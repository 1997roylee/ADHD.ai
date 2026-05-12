import { readFlagValue, readRequiredFlagValue } from "../../args-utils";
import type { SkillsCommand } from "../../args.types";

export function parseSkillsCommand(args: string[]): SkillsCommand {
	const action = args[0];
	if (!action) {
		throw new Error(
			"skills command requires an action: list | add | update | remove",
		);
	}

	if (action === "list") {
		return {
			action: "list",
			projectId: readFlagValue(args.slice(1), "--project"),
		};
	}

	if (action === "add") {
		const actionArgs = args.slice(1);
		return {
			action: "add",
			projectId: readFlagValue(actionArgs, "--project"),
			title: readRequiredFlagValue(actionArgs, "--title", "skills add"),
			description: readRequiredFlagValue(
				actionArgs,
				"--description",
				"skills add",
			),
			content: readRequiredFlagValue(actionArgs, "--content", "skills add"),
		};
	}

	if (action === "update") {
		const name = args[1];
		if (!name) {
			throw new Error("skills update requires <NAME>");
		}
		const actionArgs = args.slice(2);
		const title = readFlagValue(actionArgs, "--title");
		const description = readFlagValue(actionArgs, "--description");
		const content = readFlagValue(actionArgs, "--content");
		if (
			title === undefined &&
			description === undefined &&
			content === undefined
		) {
			throw new Error(
				"skills update requires at least one of --title, --description, or --content",
			);
		}
		return {
			action: "update",
			name,
			projectId: readFlagValue(actionArgs, "--project"),
			title,
			description,
			content,
		};
	}

	if (action === "remove") {
		const name = args[1];
		if (!name) {
			throw new Error("skills remove requires <NAME>");
		}
		return {
			action: "remove",
			name,
			projectId: readFlagValue(args.slice(2), "--project"),
		};
	}

	throw new Error(`Unknown skills action: ${action}`);
}
