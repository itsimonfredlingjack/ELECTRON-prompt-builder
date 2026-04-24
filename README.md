# AI Prompt Builder

AI Prompt Builder is a local-first Electron desktop app for turning rough requests into stronger prompts using models installed in [Ollama](https://ollama.com). It does not use a cloud provider or store API keys.

## Current App

- Brief-driven prompt builder with fields for raw intent, context, must-include details, must-avoid rules, output shape, reference material, and extra constraints
- Intent, target, and strategy controls for create/analyze/fix/critique workflows across code, analysis, creative, and general prompt targets
- Local Ollama runtime discovery from `/api/tags`, with explicit status for daemon reachability, model list availability, selected-model installation, and runtime readiness
- Real-time streamed generation with `Esc` cancellation and `Cmd/Ctrl + Enter` build shortcut
- Editable generated prompt draft with word count, copy, clear, and regenerate actions
- Optional image attachment flow when the selected local model supports vision
- Privacy-by-default behavior: prompt content is kept in app state only, and generation runs against the local Ollama daemon

## Requirements

1. Node.js 18+
2. pnpm
3. Ollama installed and running locally
4. At least one local Ollama model installed

## Quick Start

```bash
pnpm install
pnpm run electron:dev
```

Then select a local model, write a rough prompt brief, and click `Build Prompt` or press `Cmd/Ctrl + Enter`.

## Scripts

- `pnpm run electron:dev` - start Vite on `127.0.0.1:5173`, compile Electron in watch mode, and launch the desktop app
- `pnpm start` - alias for the combined desktop dev flow
- `pnpm run dev` - run only the Vite renderer dev server
- `pnpm test` - run Vitest once
- `pnpm run lint` - lint TypeScript, TSX, and CTS files
- `pnpm run build` - build the renderer and Electron entrypoints
- `pnpm run build:renderer` - build only the Vite renderer
- `pnpm run build:electron` - compile only the Electron TypeScript entrypoints
- `pnpm run preview` - preview the built renderer
- `pnpm run electron:build` - build and package the app with electron-builder

## Architecture

- `electron/` contains the main process, preload bridge, service layer, and desktop integrations
- `electron/preload.cts` is the typed renderer/main contract
- `electron/services/` contains Ollama generation, Ollama runtime discovery, and image upload preparation
- `src/` contains the React renderer, context providers, components, and prompt-building helpers
- `src/types/` contains shared contracts used by both Electron and the renderer

## Electron Security

- Renderer windows keep `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`
- Privileged behavior is routed through IPC and the preload bridge instead of direct renderer access to Node APIs
- External URLs are opened through the validated `external:open` IPC handler
- BrowserWindow navigation is restricted to the packaged app file URL in production and the configured Vite dev-server origin in development
- `window.open` is denied so external pages cannot run inside the app window with the preload bridge
- Production responses receive a restrictive Content Security Policy

## Dependency Health

The repo keeps vulnerable dev/build transitive packages pinned forward through `pnpm.overrides` where needed. Run the audit gate after dependency changes:

```bash
pnpm audit --audit-level=moderate
```

## Packaging

Create a distributable build with:

```bash
pnpm run electron:build
```

macOS packaging is configured through `electron-builder.yml` and `build/entitlements.mac.plist`. The packaged Electron main process loads the renderer from `dist/index.html`.

## Verification

Before shipping Electron, IPC, dependency, or packaging changes, run:

```bash
pnpm test
pnpm run lint
pnpm run build
pnpm audit --audit-level=moderate
```

Run `pnpm run electron:build` when packaging paths or electron-builder behavior changes.

## Troubleshooting

If generation fails:

1. Confirm Ollama is running with `ollama serve` if needed
2. Confirm the selected model is installed with `ollama list`
3. Use the app `Refresh` button to re-check local runtime status
4. Confirm the selected model is ready before building the prompt

If Electron fails to launch after changing the Electron version, reinstall dependencies with `pnpm install`.

## Tech Stack

- Electron
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Vitest
- Ollama

## License

MIT
