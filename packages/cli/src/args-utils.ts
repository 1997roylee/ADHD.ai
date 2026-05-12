export function readFlagValue(
	args: string[],
	flag: string,
): string | undefined {
	const index = args.indexOf(flag);
	if (index < 0) {
		return undefined;
	}
	return args[index + 1];
}

export function readRequiredFlagValue(
	args: string[],
	flag: string,
	commandLabel: string,
): string {
	const value = readFlagValue(args, flag);
	if (!value) {
		throw new Error(`${commandLabel} requires ${flag} <VALUE>`);
	}
	return value;
}

export function readOptionalPositiveInt(
	args: string[],
	flag: string,
): number | undefined {
	const raw = readFlagValue(args, flag);
	if (raw === undefined) {
		return undefined;
	}
	const value = Number(raw);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${flag} must be a positive integer`);
	}
	return value;
}
