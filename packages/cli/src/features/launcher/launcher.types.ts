import type { SetupCheck } from "../setup";

export interface LauncherChild {
	killed: boolean;
	kill(signal?: NodeJS.Signals): boolean;
	on(event: "close", listener: LauncherChildCloseListener): this;
	on(event: "error", listener: LauncherChildErrorListener): this;
}

export type LauncherChildCloseListener = (
	code: number | null,
	signal: NodeJS.Signals | null,
) => void;

export type LauncherChildErrorListener = (error: Error) => void;

export interface LauncherSpawnOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	stdio: "inherit";
}

export type LauncherSpawn = (
	command: string,
	args: string[],
	options: LauncherSpawnOptions,
) => LauncherChild;

export interface LauncherSignalTarget {
	on(signal: NodeJS.Signals, listener: () => void): void;
	off(signal: NodeJS.Signals, listener: () => void): void;
}

export interface LauncherBackupScheduler {
	stop(): void;
}

export interface LauncherCommandDaemon {
	port: number;
	stop(): Promise<void>;
}

export interface LauncherDatabaseStatus {
	appliedMigrationCount: number;
	databasePath: string;
}

export interface LauncherDoctorResult {
	checks: SetupCheck[];
	passed: boolean;
}
