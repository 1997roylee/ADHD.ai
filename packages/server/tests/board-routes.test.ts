import { afterEach, describe, expect, it } from "bun:test";
import { createHandleRequest } from "../src/app";
import type { AppDeps, BoardReadModels, CliExecutor } from "../src/app.types";
import { createBoardReadModels } from "../src/board-read-models";
import {
	type NewBoardProjectRow,
	type NewBoardTaskRow,
	type NewProjectBoardRow,
	boardProjectsTable,
	boardTasksTable,
	projectBoardsTable,
} from "../src/db";
import {
	type DrizzleServerTestDatabase,
	createDrizzleServerTestDatabase,
} from "./server-db-test-helpers";

function createCliExecutor(): CliExecutor {
	return {
		execute: async () => ({
			status: "rejected",
			reason: "unsupported",
			request: { action: "unknown" },
		}),
		getHistory: () => [],
	};
}

function createDeps(boardReadModels: BoardReadModels): AppDeps {
	return {
		cliExecutor: createCliExecutor(),
		boardReadModels,
	};
}

let testDatabase: DrizzleServerTestDatabase | undefined;

afterEach(async () => {
	if (testDatabase) {
		await testDatabase.cleanup();
		testDatabase = undefined;
	}
});

describe("board routes", () => {
	it("returns workspace projects through createHandleRequest", async () => {
		const app = createHandleRequest(
			createDeps({
				listWorkspaceProjects: async (workspaceId) => [
					{
						id: "project-1",
						boardId: "board-1",
						externalProjectId: workspaceId,
						name: "Project 1",
						description: null,
						ownerId: "owner-1",
						createdAt: "2026-05-14T00:00:00.000Z",
						updatedAt: "2026-05-14T00:00:00.000Z",
					},
				],
				getProjectBoard: async () => ({
					id: "board-1",
					name: "Board 1",
					description: null,
					ownerId: "owner-1",
					createdAt: "2026-05-14T00:00:00.000Z",
					updatedAt: "2026-05-14T00:00:00.000Z",
					projects: [],
					tasks: [],
				}),
			}),
		);
		const response = await app(
			new Request("http://localhost/api/workspaces/ws-1/projects", {
				method: "GET",
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([
			{
				id: "project-1",
				boardId: "board-1",
				externalProjectId: "ws-1",
				name: "Project 1",
				description: null,
				ownerId: "owner-1",
				createdAt: "2026-05-14T00:00:00.000Z",
				updatedAt: "2026-05-14T00:00:00.000Z",
			},
		]);
	});

	it("returns project board through createHandleRequest", async () => {
		const app = createHandleRequest(
			createDeps({
				listWorkspaceProjects: async () => [],
				getProjectBoard: async (workspaceId, projectId) => ({
					id: `board-${projectId}`,
					name: "Board",
					description: workspaceId,
					ownerId: "owner-1",
					createdAt: "2026-05-14T00:00:00.000Z",
					updatedAt: "2026-05-14T00:00:00.000Z",
					projects: [],
					tasks: [],
				}),
			}),
		);
		const response = await app(
			new Request(
				"http://localhost/api/workspaces/ws-1/projects/proj-1/board",
				{
					method: "GET",
				},
			),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			id: "board-proj-1",
			name: "Board",
			description: "ws-1",
			ownerId: "owner-1",
			createdAt: "2026-05-14T00:00:00.000Z",
			updatedAt: "2026-05-14T00:00:00.000Z",
			projects: [],
			tasks: [],
		});
	});

	it("returns seeded board data from database-backed read models", async () => {
		testDatabase = await createDrizzleServerTestDatabase();
		const board: NewProjectBoardRow = {
			id: "board-1",
			name: "Core Board",
			description: "Workspace board",
			ownerId: "ws-1",
			createdAt: "2026-05-14 00:00:00",
			updatedAt: "2026-05-14 00:00:00",
		};
		const project: NewBoardProjectRow = {
			id: "project-1",
			boardId: "board-1",
			externalProjectId: "ROY",
			name: "API Project",
			description: "Server API",
			ownerId: "ws-1",
			createdAt: "2026-05-14 00:01:00",
			updatedAt: "2026-05-14 00:01:00",
		};
		const task: NewBoardTaskRow = {
			id: "task-1",
			projectId: "project-1",
			title: "Implement endpoint",
			content: "Wire endpoint to db read model",
			priority: 1,
			status: "open",
			dueDate: null,
			creatorId: "user-1",
			linkedPr: null,
			createdAt: "2026-05-14 00:02:00",
			updatedAt: "2026-05-14 00:02:00",
		};
		await testDatabase.db.insert(projectBoardsTable).values(board);
		await testDatabase.db.insert(boardProjectsTable).values(project);
		await testDatabase.db.insert(boardTasksTable).values(task);

		const app = createHandleRequest(
			createDeps(createBoardReadModels(testDatabase.db)),
		);

		const projectsResponse = await app(
			new Request("http://localhost/api/workspaces/ws-1/projects", {
				method: "GET",
			}),
		);
		const boardResponse = await app(
			new Request(
				"http://localhost/api/workspaces/ws-1/projects/project-1/board",
				{
					method: "GET",
				},
			),
		);

		expect(projectsResponse.status).toBe(200);
		expect(await projectsResponse.json()).toEqual([
			{
				id: "project-1",
				boardId: "board-1",
				externalProjectId: "ROY",
				name: "API Project",
				description: "Server API",
				ownerId: "ws-1",
				createdAt: "2026-05-14 00:01:00",
				updatedAt: "2026-05-14 00:01:00",
			},
		]);
		expect(boardResponse.status).toBe(200);
		expect(await boardResponse.json()).toEqual({
			id: "board-1",
			name: "Core Board",
			description: "Workspace board",
			ownerId: "ws-1",
			createdAt: "2026-05-14 00:00:00",
			updatedAt: "2026-05-14 00:00:00",
			projects: [
				{
					id: "project-1",
					boardId: "board-1",
					externalProjectId: "ROY",
					name: "API Project",
					description: "Server API",
					ownerId: "ws-1",
					createdAt: "2026-05-14 00:01:00",
					updatedAt: "2026-05-14 00:01:00",
				},
			],
			tasks: [
				{
					id: "task-1",
					projectId: "project-1",
					title: "Implement endpoint",
					content: "Wire endpoint to db read model",
					priority: 1,
					status: "open",
					dueDate: null,
					creatorId: "user-1",
					linkedPr: null,
					createdAt: "2026-05-14 00:02:00",
					updatedAt: "2026-05-14 00:02:00",
				},
			],
		});
	});
});
