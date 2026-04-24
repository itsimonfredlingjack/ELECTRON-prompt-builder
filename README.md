# AI Prompt Builder

Transform rough ideas into clearer, ready-to-use prompts with local models in Ollama.

AI Prompt Builder is an Electron + React desktop app focused on one job: rewrite a rough prompt into a stronger prompt for another AI assistant. The app is now **Ollama-only** (no cloud API key flow).

## Highlights

- Local-first generation through [Ollama](https://ollama.com)
- Real-time streamed output with `Esc` to stop
- Prompt rewrite categories:
  - Coding / Development
  - Analysis / Summarization
  - Creative Writing
- Fast output actions:
  - `Copy`
  - `Clear`
  - `Regenerate`
- Keyboard shortcut: `Cmd/Ctrl + Enter` to generate
- Optional image input (when selected model supports images)
- Connection refresh button for local Ollama status
- Privacy-by-default UX: prompt content stays in memory only

## Provider Model

This project currently supports **only local Ollama**.

- Removed surface: Z.AI provider and API key settings
- Active provider type: `ollama`
- Installed model options are discovered from the local Ollama runtime (`/api/tags`)
- Runtime status is shown explicitly:
  - Ollama daemon reachable
  - installed model list available
  - selected model installed
  - selected model runtime-ready

## Requirements

1. Node.js 18+
2. pnpm
3. Ollama installed and running locally
4. At least one local model available in Ollama

## Quick Start

```bash
pnpm install
pnpm run electron:dev
```

Then:

1. Select category and model
2. Write your rough input prompt
3. Press `Cmd/Ctrl + Enter` or click **Generate Prompt**
4. Use **Copy** or **Clear** in the output panel

## Available Scripts

- `pnpm run electron:dev` - run renderer + Electron in development
- `pnpm start` - alias for the combined desktop dev flow
- `pnpm run dev` - renderer-only Vite server
- `pnpm test` - run unit tests (Vitest)
- `pnpm run lint` - run ESLint
- `pnpm run build` - build renderer + Electron TypeScript
- `pnpm run electron:build` - build and package with electron-builder

## Packaging

For distributable desktop builds:

```bash
pnpm run electron:build
```

macOS packaging is configured through `electron-builder.yml` and `build/entitlements.mac.plist`.

## Project Structure

- `electron/` - main process, preload bridge, desktop integrations
- `src/` - renderer app (React + TypeScript)
- `src/types/` - shared contracts between renderer/main

## Security Notes

- Renderer runs with context isolation and uses a typed preload bridge
- Privileged operations (clipboard, generation, upload preparation) are routed through IPC
- No API key persistence is required in the current Ollama-only flow

## Troubleshooting

If generation fails:

1. Confirm Ollama is running (`ollama serve` if needed)
2. Confirm the selected model is available locally (for example `ollama list`)
3. Use the app refresh button to re-check provider connectivity
4. Re-run checks locally:
   - `pnpm test`
   - `pnpm run lint`
   - `pnpm run build`

## Tech Stack

- Electron
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Ollama

## License

MIT
