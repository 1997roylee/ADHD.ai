import type { ZodError, ZodIssue } from "zod";

export type ParseResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: string };

export function mapZodResult<T>(
	result: { success: true; data: T } | { success: false; error: ZodError },
	errorForIssue: (issue: ZodIssue | undefined) => string,
): ParseResult<T> {
	if (result.success) {
		return { ok: true, value: result.data };
	}
	return { ok: false, error: errorForIssue(result.error.issues[0]) };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
