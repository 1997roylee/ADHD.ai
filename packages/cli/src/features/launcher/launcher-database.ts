import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PGlite, runMigrations } from "devos-db";
import type { LauncherDatabaseStatus } from "./launcher.types";

interface MigrationCountRow {
	count: number | string;
}

export async function prepareLauncherDatabase(
	databasePath: string,
): Promise<LauncherDatabaseStatus> {
	const resolvedPath = path.resolve(databasePath);
	await mkdir(path.dirname(resolvedPath), { recursive: true });
	const client = new PGlite(resolvedPath);
	try {
		await client.waitReady;
		const before = await readMigrationCount(client);
		await runMigrations(client);
		const after = await readMigrationCount(client);
		return {
			databasePath: resolvedPath,
			appliedMigrationCount: Math.max(0, after - before),
		};
	} finally {
		await client.close();
	}
}

async function readMigrationCount(client: PGlite): Promise<number> {
	try {
		const result = await client.query<MigrationCountRow>(
			"SELECT COUNT(*) AS count FROM schema_migrations",
		);
		return Number(result.rows[0]?.count ?? 0);
	} catch {
		return 0;
	}
}
