import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AgentKey =
	| "planner"
	| "researcher"
	| "coder"
	| "reviewer"
	| "deployer";

export type AgentLine = {
	tag: AgentKey | "you";
	text: ReactNode;
};

export type AgentProfile = {
	name: AgentKey;
	role: string;
	icon: LucideIcon;
	color: string;
	tools: string[];
	command: string;
	lines: AgentLine[];
	metrics: Array<{ label: string; value: string }>;
};

export type WorkflowStep = {
	key: string;
	icon: LucideIcon;
	title: string;
	body: string;
};

export type BoardStatus =
	| "backlog"
	| "exploring"
	| "planning"
	| "implementing"
	| "testing"
	| "done";

export type BoardColumn = {
	key: BoardStatus;
	title: string;
	tint: string;
};

export type BoardTask = {
	id: string;
	title: string;
	status: BoardStatus;
	agent: string;
	meta?: string;
};

export type ChatMessage = {
	from: "bot" | "you";
	time: string;
	body: ReactNode;
	read?: boolean;
};
