import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import type { OnboardInstanceConfig } from "../setup";
import type { LauncherBackupScheduler } from "./launcher.types";

export interface LauncherBackupResult {
	backupPath: string;
	sourcePath: string;
}

export async function runLauncherBackupOnce(
	config: OnboardInstanceConfig,
	now = new Date(),
): Promise<LauncherBackupResult> {
	const sourcePath = path.resolve(config.database.embeddedPostgresDataDir);
	const backupDir = path.resolve(config.database.backup.dir);
	await mkdir(backupDir, { recursive: true });
	const backupPath = path.join(
		backupDir,
		`${path.basename(sourcePath)}.backup-${formatBackupTimestamp(now)}`,
	);
	await cp(sourcePath, backupPath, { recursive: true });
	await pruneExpiredBackups({
		backupDir,
		prefix: `${path.basename(sourcePath)}.backup-`,
		retentionDays: config.database.backup.retentionDays,
		now,
	});
	return { backupPath, sourcePath };
}

export function startLauncherBackupScheduler(
	config: OnboardInstanceConfig,
	write: (message: string) => void = process.stderr.write.bind(process.stderr),
): LauncherBackupScheduler {
	if (!config.database.backup.enabled) {
		return { stop() {} };
	}
	const intervalMs = config.database.backup.intervalMinutes * 60 * 1000;
	const timer = setInterval(() => {
		void runLauncherBackupOnce(config).catch((error) => {
			const message = error instanceof Error ? error.message : String(error);
			write(`DB backup failed: ${message}\n`);
		});
	}, intervalMs);
	timer.unref?.();
	return {
		stop() {
			clearInterval(timer);
		},
	};
}

async function pruneExpiredBackups(options: {
	backupDir: string;
	prefix: string;
	retentionDays: number;
	now: Date;
}): Promise<void> {
	if (options.retentionDays <= 0) {
		return;
	}
	const cutoffMs =
		options.now.getTime() - options.retentionDays * 24 * 60 * 60 * 1000;
	const entries = await readdir(options.backupDir);
	await Promise.all(
		entries
			.filter((entry) => entry.startsWith(options.prefix))
			.map(async (entry) => {
				const entryPath = path.join(options.backupDir, entry);
				const stats = await stat(entryPath);
				if (stats.mtimeMs < cutoffMs) {
					await rm(entryPath, { recursive: true, force: true });
				}
			}),
	);
}

function formatBackupTimestamp(now: Date): string {
	return now.toISOString().replace(/[-:.]/g, "");
}
