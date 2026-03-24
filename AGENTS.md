# AGENTS.md

## Scope
These instructions apply to the entire repository at `/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app`.

## Project Snapshot
- Desktop app built with Electron + React + TypeScript + Vite.
- Electron main-process code lives in [`electron/`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron).
- Renderer code lives in [`src/`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/src).
- Shared types flow from [`src/types/index.ts`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/src/types/index.ts) into Electron services and the renderer.
- The app stores the API key through `electron-store` and `safeStorage`; preserve that pattern for any future secret handling.

## Architecture Rules
- Keep the Electron security model intact. Do not enable `nodeIntegration`, disable `contextIsolation`, or remove the renderer sandbox without an explicit requirement.
- Put privileged or filesystem/networked behavior in the main process or service layer, then expose it through the preload bridge instead of calling Node APIs from React.
- Treat [`electron/preload.cts`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron/preload.cts) as the contract between renderer and main. Keep it typed and minimal.
- Reuse the existing services under [`electron/services/`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron/services) and utilities under [`electron/utils/`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron/utils) before adding new abstractions.
- Match the current React style: functional components, hooks, and shared state through [`src/contexts/AppContext.tsx`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/src/contexts/AppContext.tsx).
- Preserve the existing alias/import style such as `@/components/...` in renderer code.

## Preferred Workflows

### 1. Daily Development
- Install dependencies with `pnpm install`.
- Start the full desktop app with `pnpm run electron:dev`.
- Use `pnpm start` only if you intentionally want the same combined workflow through the alternate script name.
- Use `pnpm run dev` only when working on the Vite renderer in isolation.

### 2. Code Changes
- Prefer the smallest correct change.
- Update shared types first when a feature crosses main/preload/renderer boundaries.
- When adding new IPC behavior, change all three layers together:
  - [`electron/main.ts`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron/main.ts)
  - [`electron/preload.cts`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron/preload.cts)
  - the consuming renderer code in [`src/`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/src)
- Prefer extending existing services before creating new top-level modules.

### 3. Verification
- Run unit tests with `pnpm test`.
- Run linting with `pnpm run lint`.
- Build both renderer and Electron output with `pnpm run build`.
- When packaging behavior changes, verify the packaged app path with `pnpm run electron:build`.
- Before claiming a fix in Electron IPC, streaming, uploads, or packaging, verify with the exact command that exercises that area instead of relying on reasoning alone.

### 4. Packaging
- Use `pnpm run electron:build` for distributable builds through `electron-builder`.
- macOS packaging is configured via [`electron-builder.yml`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron-builder.yml) and [`build/entitlements.mac.plist`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/build/entitlements.mac.plist); keep those aligned with any packaging-related change.

## Repo Commands
- `pnpm install` — install dependencies
- `pnpm run electron:dev` — run Vite, TypeScript watch, and Electron together
- `pnpm start` — alias of the combined desktop dev flow
- `pnpm run dev` — run the renderer dev server only
- `pnpm test` — run Vitest once
- `pnpm run lint` — lint `.ts`, `.tsx`, and `.cts` files with ESLint
- `pnpm run build` — build renderer and Electron output
- `pnpm run build:renderer` — build the Vite renderer only
- `pnpm run build:electron` — compile the Electron TypeScript entrypoints only
- `pnpm run preview` — preview the built renderer
- `pnpm run electron:build` — run the full build and package with `electron-builder`

## File and Review Conventions
- Read [`README.md`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/README.md) and the nearest relevant source files before changing behavior.
- Prefer `rg --files` for file discovery and `rg` for text search.
- Use repo-native scripts for verification instead of ad hoc substitutes when an existing script already covers the task.
- Do not overwrite unrelated user changes in a dirty worktree.
- Keep diffs reviewable: remove dead code introduced by the change, avoid drive-by refactors, and document only the non-obvious parts.

## High-Risk Areas
- API key persistence and encryption flow
- IPC contracts between main, preload, and renderer
- Streaming generation behavior and cancellation
- Image upload preparation and cleanup in [`electron/services/imageUploadService.ts`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron/services/imageUploadService.ts)
- External URL handling and CSP behavior in [`electron/main.ts`](/Users/coffeedev/Projects/04_PROMPT-GENERATORS/prompt-build-app/electron/main.ts)

## Definition of Done
- The relevant repo commands were run fresh.
- The result was checked, not assumed.
- Any limitations or unverified paths are called out explicitly.

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session. Codex CLI does NOT have hooks, so these instructions are your ONLY enforcement mechanism. Follow them strictly.

## BLOCKED commands — do NOT use these

### curl / wget — FORBIDDEN
Do NOT use `curl` or `wget` in any shell command. They dump raw HTTP responses directly into your context window.
Instead use:
- `mcp__context-mode__ctx_fetch_and_index(url, source)` to fetch and index web pages
- `mcp__context-mode__ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — FORBIDDEN
Do NOT run inline HTTP calls via `node -e "fetch(..."`, `python -c "requests.get(..."`, or similar patterns. They bypass the sandbox and flood context.
Instead use:
- `mcp__context-mode__ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### Direct web fetching — FORBIDDEN
Do NOT use any direct URL fetching tool. Raw HTML can exceed 100 KB.
Instead use:
- `mcp__context-mode__ctx_fetch_and_index(url, source)` then `mcp__context-mode__ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Shell (>20 lines output)
Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `mcp__context-mode__ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `mcp__context-mode__ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### File reading (for analysis)
If you are reading a file to **edit** it → reading is correct (edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `mcp__context-mode__ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file stays in the sandbox.

### grep / search (large results)
Search results can flood context. Use `mcp__context-mode__ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `mcp__context-mode__ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `mcp__context-mode__ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `mcp__context-mode__ctx_execute(language, code)` | `mcp__context-mode__ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `mcp__context-mode__ctx_fetch_and_index(url, source)` then `mcp__context-mode__ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `mcp__context-mode__ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `upgrade` MCP tool, run the returned shell command, display as checklist |
