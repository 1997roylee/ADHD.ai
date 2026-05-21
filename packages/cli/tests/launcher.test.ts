import { describe, expect, it } from "bun:test";
import { EventEmitter } from "node:events";
import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import type { LoadedConfig } from "../src/features/config";
import {
	formatLauncherStatus,
	prepareLauncherDatabase,
	runLauncherBackupOnce,
	runLocalLauncher,
} from "../src/features/launcher";
import type {
	LauncherChild,
	LauncherSignalTarget,
	LauncherSpawn,
} from "../src/features/launcher";
import { createInstanceConfig } from "../src/features/setup";

describe("local launcher", () => {
	it("aborts on failed doctor checks before spawning services", async () => {
		let spawned = false;
		let output = "";

		await expect(
			runLocalLauncher({
				cwd: "/tmp/demo",
				write: (message) => {
					output += message;
				},
				collectChecks: async () => [
					{ name: "Config file", status: "fail", message: "missing" },
				],
				spawnChild: (() => {
					spawned = true;
					return new FakeLauncherChild();
				}) as LauncherSpawn,
			}),
		).rejects.toThrow("Setup check failed");

		expect(spawned).toBe(false);
		expect(output).toContain("FAIL: Config file - missing");
	});

	it("starts server, web, and workflow services before graceful shutdown", async () => {
		const signalTarget = new FakeSignalTarget();
		const children: FakeLauncherChild[] = [];
		const calls: Array<{
			command: string;
			args: string[];
			env: NodeJS.ProcessEnv;
		}> = [];
		let output = "";
		let backupStopped = false;
		let daemonStopped = false;
		const instanceConfig = createInstanceConfig(
			"/tmp/demo",
			"2026-05-12T16:13:11.419Z",
		);
		const spawnChild: LauncherSpawn = (command, args, options) => {
			calls.push({ command, args, env: options.env });
			const child = new FakeLauncherChild();
			children.push(child);
			if (children.length === 3) {
				queueMicrotask(() => signalTarget.emitSignal("SIGINT"));
			}
			return child;
		};

		const code = await runLocalLauncher({
			cwd: "/tmp/demo",
			env: {},
			signalTarget,
			spawnChild,
			write: (message) => {
				output += message;
			},
			collectChecks: async () => [
				{ name: "Config file", status: "pass", message: "ok" },
			],
			loadInstance: async () => ({ ok: true, config: instanceConfig }),
			loadEnv: async () => ({ JWT_SECRET: "jwt", PORT: "3000" }),
			loadRuntimeConfig: async () =>
				({ polling: { intervalMs: 30000 } }) as LoadedConfig,
			prepareDatabase: async (databasePath) => ({
				databasePath,
				appliedMigrationCount: 0,
			}),
			startBackup: () => ({
				stop() {
					backupStopped = true;
				},
			}),
			startCommandDaemon: () => ({
				port: 3002,
				async stop() {
					daemonStopped = true;
				},
			}),
		});

		expect(code).toBe(0);
		expect(calls.map(({ command, args }) => ({ command, args }))).toEqual([
			{
				command: "bun",
				args: ["run", "--filter", "devos-server", "start"],
			},
			{ command: "bun", args: ["run", "--filter", "web", "start"] },
			{
				command: "npx",
				args: ["devos", "workflow", "run", "--all-projects", "--poll-forever"],
			},
		]);
		expect(calls[0]?.env).toMatchObject({
			PIV_SERVER_PORT: "3100",
			PIV_SERVER_HOST: "127.0.0.1",
			PIV_SERVER_DATABASE_PATH: instanceConfig.database.embeddedPostgresDataDir,
			DEVOS_CLI_DAEMON_WS_URL: "ws://127.0.0.1:3002",
		});
		expect(output).toContain(
			"Mode        embedded-postgres | separate-next-ui",
		);
		expect(output).toContain("API         http://127.0.0.1:3100/api");
		expect(output).toContain("UI          http://127.0.0.1:3000");
		expect(children.every((child) => child.killed)).toBe(true);
		expect(backupStopped).toBe(true);
		expect(daemonStopped).toBe(true);
	});

	it("formats launcher status rows", () => {
		const config = createInstanceConfig(
			"/tmp/demo",
			"2026-05-12T16:13:11.419Z",
		);
		const status = formatLauncherStatus({
			config,
			configPath: "/tmp/demo/.devos/config/instance.config.json",
			database: {
				databasePath: config.database.embeddedPostgresDataDir,
				appliedMigrationCount: 2,
			},
			env: { JWT_SECRET: "jwt" },
			pollIntervalMs: 30000,
			uiPort: "3000",
		});

		expect(status).toContain("Migrations  applied 2");
		expect(status).toContain("Agent JWT   set");
		expect(status).toContain("Heartbeat   enabled (30000ms)");
		expect(status).toContain("DB Backup   enabled (every 60m, keep 30d)");
	});
});

describe("launcher database and backup", () => {
	it("reports fresh and already-applied migration status", async () => {
		const tempDir = await mkdtemp(
			path.join(process.cwd(), ".tmp-launcher-db-"),
		);
		try {
			const dbPath = path.join(tempDir, "db");
			const fresh = await prepareLauncherDatabase(dbPath);
			const reopened = await prepareLauncherDatabase(dbPath);

			expect(fresh.appliedMigrationCount).toBeGreaterThan(0);
			expect(reopened.appliedMigrationCount).toBe(0);
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it("copies backups to the configured backup directory", async () => {
		const tempDir = await mkdtemp(
			path.join(process.cwd(), ".tmp-launcher-backup-"),
		);
		try {
			const config = createInstanceConfig(tempDir, "2026-05-12T16:13:11.419Z");
			await mkdir(config.database.embeddedPostgresDataDir, { recursive: true });
			await writeFile(
				path.join(config.database.embeddedPostgresDataDir, "marker.txt"),
				"ok",
			);

			const result = await runLauncherBackupOnce(
				config,
				new Date("2026-05-20T01:02:03.004Z"),
			);

			expect(result.backupPath).toBe(
				path.join(config.database.backup.dir, "db.backup-20260520T010203004Z"),
			);
			expect((await stat(result.backupPath)).isDirectory()).toBe(true);
			expect(
				await readFile(path.join(result.backupPath, "marker.txt"), "utf8"),
			).toBe("ok");
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});
});

class FakeLauncherChild extends EventEmitter implements LauncherChild {
	killed = false;

	kill(_signal?: NodeJS.Signals): boolean {
		this.killed = true;
		return true;
	}
}

class FakeSignalTarget implements LauncherSignalTarget {
	private readonly emitter = new EventEmitter();

	on(signal: NodeJS.Signals, listener: () => void): void {
		this.emitter.on(signal, listener);
	}

	off(signal: NodeJS.Signals, listener: () => void): void {
		this.emitter.off(signal, listener);
	}

	emitSignal(signal: NodeJS.Signals): void {
		this.emitter.emit(signal);
	}
}
