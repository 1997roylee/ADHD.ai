import { readFlagValue, readRequiredFlagValue } from "../../args-utils";
import type { TaskCommand } from "../../args.types";

export function parseTaskCommand(args: string[]): TaskCommand {
	const action = args[0];
	if (!action) {
		throw new Error("task command requires an action: create");
	}
	if (action !== "create") {
		throw new Error(`Unknown task action: ${action}`);
	}
	const actionArgs = args.slice(1);
	return {
		action: "create",
		projectId: readFlagValue(actionArgs, "--project"),
		request: readRequiredFlagValue(actionArgs, "--request", "task create"),
	};
}
