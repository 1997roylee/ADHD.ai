import { z } from "zod";

export async function parseJsonBody(
	request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
	try {
		return { ok: true, value: await request.json() };
	} catch {
		return { ok: false, error: "Malformed JSON body" };
	}
}

export function validateCreatePayload<T extends object>(
	value: unknown,
	allowedFields: readonly string[],
): { ok: true; value: T } | { ok: false; error: string } {
	if (!isRecord(value)) {
		return { ok: false, error: "Malformed request: expected object body" };
	}
	const fieldError = findUnknownField(value, allowedFields);
	if (fieldError) {
		return { ok: false, error: fieldError };
	}
	for (const field of allowedFields) {
		if (!(field in value)) {
			return {
				ok: false,
				error: `Malformed request: missing required field '${field}'`,
			};
		}
	}
	const result = createStringObjectSchema(allowedFields).safeParse(value);
	if (!result.success) {
		return {
			ok: false,
			error: fieldValidationError(result.error, allowedFields),
		};
	}
	return { ok: true, value: result.data as T };
}

export function validateUpdatePayload<T extends object>(
	value: unknown,
	allowedFields: readonly string[],
): { ok: true; value: T } | { ok: false; error: string } {
	if (!isRecord(value)) {
		return { ok: false, error: "Malformed request: expected object body" };
	}
	const keys = Object.keys(value);
	if (keys.length === 0) {
		return {
			ok: false,
			error: "Malformed request: expected at least one field",
		};
	}
	const fieldError = findUnknownField(value, allowedFields);
	if (fieldError) {
		return { ok: false, error: fieldError };
	}
	const result = createStringObjectSchema(allowedFields)
		.partial()
		.safeParse(value);
	if (!result.success) {
		return {
			ok: false,
			error: fieldValidationError(result.error, allowedFields),
		};
	}
	return { ok: true, value: result.data as T };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createStringObjectSchema(fields: readonly string[]): z.ZodObject {
	return z.object(
		Object.fromEntries(
			fields.map((field) => [field, z.string().trim().min(1)]),
		),
	);
}

function findUnknownField(
	value: Record<string, unknown>,
	allowedFields: readonly string[],
): string | null {
	for (const key of Object.keys(value)) {
		if (!allowedFields.includes(key)) {
			return `Malformed request: unknown field '${key}'`;
		}
	}
	return null;
}

function fieldValidationError(
	error: z.ZodError,
	allowedFields: readonly string[],
): string {
	const field = String(error.issues[0]?.path[0] ?? allowedFields[0] ?? "field");
	return `Malformed request: field '${field}' must be a non-empty string`;
}
