import path from "node:path";
import type { ResolvedEnv } from "../config";
import type { OnboardInstanceConfig } from "../setup";
import type { LauncherDatabaseStatus } from "./launcher.types";

export interface LauncherStatusInput {
	config: OnboardInstanceConfig;
	configPath: string;
	database: LauncherDatabaseStatus;
	env: ResolvedEnv;
	pollIntervalMs: number;
	uiPort: string;
}

export function formatLauncherStatus(input: LauncherStatusInput): string {
	const { config } = input;
	const serverBaseUrl = formatHttpUrl(config.server.host, config.server.port);
	const apiUrl = `${serverBaseUrl}/api`;
	const rows: Array<[string, string]> = [
		["Mode", `${config.database.mode} | separate-next-ui`],
		["Deploy", `${config.server.deploymentMode} (${config.server.exposure})`],
		["Bind", `${config.server.bind} (${config.server.host})`],
		["Auth", input.env.JWT_SECRET?.trim() ? "ready" : "missing"],
		["Server", String(config.server.port)],
		["API", `${apiUrl} (health: ${apiUrl}/health)`],
		["UI", formatHttpUrl(config.server.host, input.uiPort)],
		[
			"Database",
			`${input.database.databasePath} (pg:${config.database.embeddedPostgresPort})`,
		],
		["Migrations", formatMigrationStatus(input.database.appliedMigrationCount)],
		["Agent JWT", input.env.JWT_SECRET?.trim() ? "set" : "missing"],
		["Heartbeat", `enabled (${input.pollIntervalMs}ms)`],
		["DB Backup", formatBackupStatus(config)],
		["Backup Dir", config.database.backup.dir],
		["Config", path.resolve(input.configPath)],
	];
	const labelWidth = Math.max(...rows.map(([label]) => label.length));
	return `${rows
		.map(([label, value]) => `${label.padEnd(labelWidth)}  ${value}`)
		.join("\n")}\n`;
}

export function formatMigrationStatus(appliedCount: number): string {
	return appliedCount === 0 ? "already applied" : `applied ${appliedCount}`;
}

function formatBackupStatus(config: OnboardInstanceConfig): string {
	if (!config.database.backup.enabled) {
		return "disabled";
	}
	return `enabled (every ${config.database.backup.intervalMinutes}m, keep ${config.database.backup.retentionDays}d)`;
}

function formatHttpUrl(host: string, port: number | string): string {
	return `http://${host}:${port}`;
}
