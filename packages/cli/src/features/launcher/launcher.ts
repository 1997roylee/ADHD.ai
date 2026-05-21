import { spawn } from "node:child_process";
import path from "node:path";
import { type ResolvedEnv, loadConfig, loadResolvedEnv } from "../config";
import {
	formatCliDaemonWsUrl,
	startCliCommandDaemon,
} from "../daemon/command-daemon";
import {
	INSTANCE_CONFIG_FILE,
	type OnboardInstanceConfig,
	collectSetupChecks,
	formatSetupChecks,
	loadInstanceConfig,
} from "../setup";
import { startLauncherBackupScheduler } from "./launcher-backup";
import { prepareLauncherDatabase } from "./launcher-database";
import { formatLauncherStatus } from "./launcher-status";
import type {
	LauncherBackupScheduler,
	LauncherChild,
	LauncherCommandDaemon,
	LauncherDatabaseStatus,
	LauncherSignalTarget,
	LauncherSpawn,
} from "./launcher.types";

const SIGNALS = ["SIGINT", "SIGTERM"] as const;

export interface RunLocalLauncherOptions {
	cwd?: string;
	env?: NodeJS.ProcessEnv;
	write?: (message: string) => void;
	writeErr?: (message: string) => void;
	spawnChild?: LauncherSpawn;
	signalTarget?: LauncherSignalTarget;
	startCommandDaemon?: (options: {
		cwd: string;
		env?: NodeJS.ProcessEnv;
	}) => LauncherCommandDaemon;
	collectChecks?: typeof collectSetupChecks;
	loadInstance?: typeof loadInstanceConfig;
	loadEnv?: typeof loadResolvedEnv;
	loadRuntimeConfig?: typeof loadConfig;
	prepareDatabase?: (databasePath: string) => Promise<LauncherDatabaseStatus>;
	startBackup?: (
		config: OnboardInstanceConfig,
		write: (message: string) => void,
	) => LauncherBackupScheduler;
}

export async function runLocalLauncher(
	options: RunLocalLauncherOptions = {},
): Promise<number> {
	const cwd = options.cwd ?? process.cwd();
	const write = options.write ?? process.stdout.write.bind(process.stdout);
	const writeErr =
		options.writeErr ?? process.stderr.write.bind(process.stderr);
	const checks = await (options.collectChecks ?? collectSetupChecks)(cwd);
	if (checks.some((check) => check.status === "fail")) {
		write(formatSetupChecks(checks));
		throw new Error("Setup check failed");
	}

	const instanceResult = await (options.loadInstance ?? loadInstanceConfig)(
		cwd,
	);
	if (!instanceResult.ok) {
		throw new Error(instanceResult.message);
	}
	const env = await (options.loadEnv ?? loadResolvedEnv)(cwd);
	const config = await (options.loadRuntimeConfig ?? loadConfig)(cwd);
	const database = await (options.prepareDatabase ?? prepareLauncherDatabase)(
		instanceResult.config.database.embeddedPostgresDataDir,
	);
	const backup = (options.startBackup ?? startLauncherBackupScheduler)(
		instanceResult.config,
		writeErr,
	);
	const commandDaemon = (options.startCommandDaemon ?? startCliCommandDaemon)({
		cwd,
		env: toProcessEnv(env, options.env),
	});

	let children: LauncherChild[] = [];
	try {
		children = startLauncherChildren({
			cwd,
			env,
			processEnv: options.env,
			config: instanceResult.config,
			commandDaemon,
			spawnChild: options.spawnChild ?? spawnLauncherChild,
		});
		write(
			formatLauncherStatus({
				config: instanceResult.config,
				configPath: path.join(cwd, INSTANCE_CONFIG_FILE),
				database,
				env,
				pollIntervalMs: config.polling.intervalMs,
				uiPort: resolveUiPort(env),
			}),
		);
		return await superviseLauncher({
			children,
			commandDaemon,
			backup,
			signalTarget: options.signalTarget ?? process,
		});
	} catch (error) {
		for (const child of children) {
			if (!child.killed) child.kill("SIGTERM");
		}
		backup.stop();
		await commandDaemon.stop();
		throw error;
	}
}

function startLauncherChildren(options: {
	cwd: string;
	env: ResolvedEnv;
	processEnv?: NodeJS.ProcessEnv;
	config: OnboardInstanceConfig;
	commandDaemon: LauncherCommandDaemon;
	spawnChild: LauncherSpawn;
}): LauncherChild[] {
	const serverBaseUrl = serverUrl(options.config);
	const baseEnv = toProcessEnv(options.env, options.processEnv);
	const serverWsUrl = toWsUrl(serverBaseUrl, "/api/cli/stream");
	return [
		options.spawnChild("bun", ["run", "--filter", "devos-server", "start"], {
			cwd: options.cwd,
			stdio: "inherit",
			env: {
				...baseEnv,
				NODE_ENV: "production",
				PIV_WORKSPACE_PATH: options.cwd,
				PIV_SERVER_DATABASE_PATH:
					options.config.database.embeddedPostgresDataDir,
				PIV_SERVER_HOST: options.config.server.host,
				PIV_SERVER_PORT: String(options.config.server.port),
				DEVOS_SERVER_BASE_URL: serverBaseUrl,
				DEVOS_CLI_DAEMON_WS_URL: formatCliDaemonWsUrl(
					options.commandDaemon.port,
				),
			},
		}),
		options.spawnChild("bun", ["run", "--filter", "web", "start"], {
			cwd: options.cwd,
			stdio: "inherit",
			env: {
				...baseEnv,
				NODE_ENV: "production",
				PORT: resolveUiPort(options.env),
				DEVOS_SERVER_BASE_URL: serverBaseUrl,
				NEXT_PUBLIC_DEVOS_SERVER_WS_URL: serverWsUrl,
			},
		}),
		options.spawnChild(
			"npx",
			["devos", "workflow", "run", "--all-projects", "--poll-forever"],
			{
				cwd: options.cwd,
				stdio: "inherit",
				env: {
					...baseEnv,
					DEVOS_SERVER_BASE_URL: serverBaseUrl,
					DEVOS_SERVER_EVENTS_WS_URL: toWsUrl(serverBaseUrl, "/daemon/events"),
					DEVOS_WORKFLOW_WS_URL: toWsUrl(serverBaseUrl, "/api/workflow"),
					DEVOS_WORKFLOW_PROGRESS_STREAM: "1",
				},
			},
		),
	];
}

function superviseLauncher(options: {
	children: LauncherChild[];
	commandDaemon: LauncherCommandDaemon;
	backup: LauncherBackupScheduler;
	signalTarget: LauncherSignalTarget;
}): Promise<number> {
	return new Promise((resolve) => {
		let resolved = false;
		let shuttingDown = false;
		const finish = (code: number, signal?: NodeJS.Signals) => {
			if (resolved) return;
			resolved = true;
			shuttingDown = true;
			for (const item of SIGNALS) {
				options.signalTarget.off(item, signalHandlers[item]);
			}
			for (const child of options.children) {
				if (!child.killed) child.kill(signal ?? "SIGTERM");
			}
			options.backup.stop();
			void options.commandDaemon.stop().finally(() => resolve(code));
		};
		const signalHandlers = {
			SIGINT: () => finish(0, "SIGINT"),
			SIGTERM: () => finish(0, "SIGTERM"),
		};
		for (const item of SIGNALS) {
			options.signalTarget.on(item, signalHandlers[item]);
		}
		for (const child of options.children) {
			child.on("error", () => finish(1));
			child.on("close", (code, signal) => {
				if (!shuttingDown)
					finish(code ?? (signal ? 1 : 0), signal ?? undefined);
			});
		}
	});
}

function resolveUiPort(env: ResolvedEnv): string {
	const rawPort = env.PORT ?? "3000";
	const port = Number(rawPort);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		throw new Error("PORT must be a valid TCP port");
	}
	return String(port);
}

function serverUrl(config: OnboardInstanceConfig): string {
	return `http://${config.server.host}:${config.server.port}`;
}

function toWsUrl(baseUrl: string, pathname: string): string {
	const url = new URL(pathname, baseUrl);
	url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
	return url.toString();
}

function toProcessEnv(
	env: ResolvedEnv,
	processEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
	return { ...processEnv, ...env };
}

const spawnLauncherChild: LauncherSpawn = (command, args, options) =>
	spawn(command, args, options);
