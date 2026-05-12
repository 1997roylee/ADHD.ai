# CLI-To-Server Workflow Coverage Audit

This document captures current workflow control coverage for ROY-144 and maps
what the web UI can call today versus what still needs a server contract.

## Scope

Audited surfaces:

1. CLI command entry points and workflow orchestration.
2. CLI command executor request contract used by server helpers.
3. Server-exposed routes and backing repositories.
4. Server package HTTP runtime routes.
5. Run-state, chat-log, and token usage persistence.

## CLI Control Surface

Primary CLI command parsing and dispatch:

- `packages/cli/src/args.ts`
- `packages/cli/src/features/commands/handlers.ts`
- `packages/cli/src/features/workflow/workflow.ts`

Supported user-facing command kinds:

- `run`
- `status`
- `projects`
- `cron`
- `setup`
- `skills` (`list`, `add`, `update`, `remove`)
- `task` (`create`)

Workflow execution (plan/implement/review orchestration) is owned by
`packages/cli/src/features/workflow/` and triggered through `run`.

## CLI Executor Request Contract (Server Helper)

CLI execution contract:

- `packages/cli/src/features/server/cli-command-executor.types.ts`
- `packages/cli/src/features/server/cli-command-executor.ts`

Supported `action` values in executor requests:

- `run`
- `status`
- `projects`

Unsupported by the executor (gap relative to CLI command surface):

- `cron`
- `setup`
- `skills`
- `task`

This means current helper-level command execution is intentionally narrower than
the full CLI interface.

## Server Data Routes Available Today

Route handling:

- `packages/cli/src/features/server/routes.ts`

Current GET routes:

- `/api/token-usage` -> `listTokenUsage()`
- `/api/jobs` -> `listJobs()`
- `/api/agents` -> `listAgents()`
- `/api/skills` -> `listSkills()`
- `/api/command-history` -> `listCommandHistory()`

Backing read repositories:

- `packages/cli/src/features/server/repositories.ts`
- `packages/cli/src/features/server/repositories.types.ts`

All listed routes are read-only list endpoints.

## HTTP Server Runtime Coverage

Server package runtime:

- `packages/server/src/app.ts`
- `packages/server/src/index.ts`

Current route coverage in `packages/server`:

- `GET /health`

Important boundary note:
`packages/server` does not currently expose or bridge the CLI server helper
routes from `packages/cli/src/features/server/routes.ts`.

## Persistence and Storage Model

Filesystem-backed state:

- Run state files:
  `.piv-loop/projects/<project-id>/runs/<ISSUE_KEY>.json`
  via `packages/cli/src/features/workflow/state.ts`
- Agent chat logs:
  `.piv-loop/projects/<project-id>/chat-logs/<agent-role>/<skill-file>.json`
  via `packages/cli/src/features/workflow/state-chat-log.ts`

Database-backed read models:

- `token_usage` table for `/api/token-usage`
- `jobs` table for `/api/jobs`
- `agents` table for `/api/agents`
- `skills` table for `/api/skills`
- `command_history` table for `/api/command-history`

Read access is implemented in `packages/cli/src/features/server/repositories.ts`.

## Web UI Capability-To-Route Contract Guidance

Current web app scaffold:

- `packages/web/src/app/page.tsx`

No workflow API integration is wired in the UI yet. For ROY-144 execution
control from web, use the following target contracts:

1. Read-only monitoring/data views:
   use existing GET routes:
   `/api/token-usage`, `/api/jobs`, `/api/agents`, `/api/skills`,
   `/api/command-history`.
2. Workflow control actions:
   add server routes that accept the CLI executor request contract for:
   `run`, `status`, and `projects`.
3. Additional CLI command coverage:
   expand executor contract and route handling only when ROY-144 scope
   explicitly requires `cron`, `setup`, `skills`, or `task` controls.

## Missing Execution Paths (For ROY-144)

Primary gaps to close for web-controlled CLI workflows:

1. No HTTP route in `packages/server` for submitting workflow control commands.
2. No HTTP route in `packages/server` for exposing CLI command execution status
   or command result history beyond current DB read models.
3. No server bridge from `packages/server` to CLI executor helpers for
   `run`/`status`/`projects`.

These are the missing paths between current web/server runtime and CLI workflow
control needed by ROY-144.
