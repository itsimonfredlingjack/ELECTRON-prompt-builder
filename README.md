# Lazy Prompter

> *Sloppy in. Sharp out.*

A local-first Electron desktop app that turns a rough, half-formed ask into a sharper, mode-tuned prompt — running entirely against models installed in [Ollama](https://ollama.com). No cloud calls, no API keys, no telemetry. Your brief stays in app state on your machine.

![Idle workspace at 1280×800](./audit-1-idle.png)

## What it is

Lazy Prompter sits between you and your local model. You drop in a messy intent ("refactor this class component to hooks", "rewrite this landing hero in a calmer voice", "summarize this doc by impact"), pick a mode, optionally pin a few rules, and it sharpens the prompt before sending it to Ollama. The deliverable is the *rendered prompt* and the *model's response* — both editable, both local, both yours.

It's built for the moment where you'd otherwise stare at an empty chat box and either type something lazy or open three tabs to copy a 2-shot template. Lazy Prompter is the template.

## What it does

### Brief → sharpened prompt

- A two-pane workspace: **brief sidebar** (~440px) on the left, **draft stage** (1fr) on the right
- One textarea for raw intent (`Describe the rough ask. Messy is fine.`) plus an optional context field
- One-click **mode chip** picks the prompt's working register: `build code`, `code review`, `debug / fix`, `visual review`, `creative writing`, `copywriting`, `summarize`, `brainstorm`, or `system prompt`
- Streamed generation against your local Ollama daemon with `Cmd/Ctrl + Enter` to fire and `Esc` to cancel
- Editable response draft with copy, clear, and regenerate

### Live brief quality pulse

A heuristic scoring pass runs as you type and surfaces up to **two concrete suggestions** inline beneath the intent — never more, never moralising:

```
●●●○○ going. now ground it.
[+ paste the source]   [+ pin the audience]
```

The pulse evaluates intent richness, context substance, output-shape clarity, pinned constraints, and whether you've said enough words to have an opinion. Suggestions are mode-aware — code modes ask for the source file, copywriting modes ask for the audience and tone.

### Chip-list rules editor with auto-detected types

Replaces the old three-input "must include / must avoid / output shape" form. Each rule is a single chip with a coloured type pill:

- **`do`** — additive ("named exports only", "early returns over nested ifs")
- **`don't`** — subtractive ("no any types", "no console.log left in")
- **`format`** — structural ("max 200 words", "return JSON")

Type is detected from the prefix (`no/never/avoid` → don't, `format/json/max/return` → format, else do). Click the type pill on a chip to override the detection.

![Brief panel with rules pinned and live mirror](./audit-2-mirror.png)

### Curated rule library per mode

Click-to-pin chips with ~36 opinionated defaults across six tag groups (`code`, `review`, `design`, `writing`, `marketing`, `reasoning`). Each mode resolves to one or more tags via a static map, so the library only shows rules that are useful for the mode you're in.

```
SUGGESTED FOR BUILD CODE  (9)
[+ early returns over nested ifs]
[+ prefer composition over inheritance]
[+ WHY comments only, not WHAT]
[+ no any types]
[+ no magic numbers]
…
```

### Rendered Prompt preview modal

Press **`show prompt`** in the brief header to see the literal text that will be sent to Ollama, in mono with section highlights. Critical for the "will the model actually respect this rule?" question — small local models often ignore unstructured constraints, and the preview shows you whether your rules ended up buried in a paragraph or lifted into a labeled block.

The preview annotates four section kinds:

- `Structured brief` (amber tint) — your `must include / must avoid / output shape` payload
- `Extra constraints` (subtle tint) — anything pinned that didn't fit the structured shape
- `Reference material` (subtle tint) — pasted source / docs
- `Strategy guidance` — the meta-prompt that tells the model how to do its job

Char count, word count, and the active model id sit in the header. One-click copy.

### Drag-drop attach (image, text, code)

Drop a file anywhere on the brief panel — the surface dims, an overlay shows `Drop to attach · images go to the model · text becomes reference`. Routing is automatic:

- **Images** → existing vision pipeline if the selected model supports vision
- **Text / code** → appended to `referenceMaterial`, capped at 100KB

A single `+ attach` button does the same thing via a file picker.

### Live mirror panel

The right pane mirrors what the brief looks like as it forms — `INTENT`, `CONTEXT`, `CONSTRAINTS`, `OUTPUT SHAPE`, `REFERENCE`, with the active strategy and target shown beneath (`will build with balanced general`). Replaces a passive empty state with an honest preview of the prompt structure as it grows.

### Compare A/B mode (preview)

Toggle `compare a/b` to run two strategies head-to-head against the same brief. The right pane splits into two columns and a "pick a winner" affordance. Currently mock-driven for design polish — real parallel generation lands behind the same UI.

### Local-first by design

- Runtime discovery via Ollama `/api/tags` with explicit status: daemon reachable / model list available / selected model installed / runtime ready
- Title bar shows live runtime state (`LOCAL READY` / `OFFLINE` / `WARMING`) with refresh
- Footer ribbon: `LOCAL WORKSPACE · NO CLOUD REQUEST SENT` — there is no fallback to a hosted endpoint, ever
- Prompt history persists to localStorage; you can restore a prior draft with full provenance (`Loaded draft · 2026-04-24 · critique`)

## Look & feel

**Workshop terminal direction.** Warm amber `#DC8442` accent on tinted charcoal `#0C0D0F`, dense mono-leaning typography, hairline borders, minimal radius. The empty state opens with an editorial display headline (`Sloppy in. Sharp out.`) plus three launch cards seeded with realistic example briefs. Every status pill, kicker dot, and inline meta uses lower-case mono — the chrome reads like an IDE, not a SaaS dashboard.

| State | Screenshot |
|---|---|
| Idle (1280×800) | `audit-1-idle.png` |
| Working with rules + mirror | `audit-2-mirror.png` |
| Desktop reference | `lazy-prompter-new.png` |
| Soft monochrome variant (archived) | `soft-monochrome-*.png` |

Animation is restricted to `transform` and `opacity`, drives spring physics by default (`useMotionValue` for continuous motion), and never animates `width` / `height` / layout. Grain overlay sits on a `position: fixed` pseudo-element so it never interferes with hit-testing.

## Modes

Each mode wires an opinionated default rule library and tunes the meta-prompt that gets prepended:

| Mode | Tags | Resolves to |
|---|---|---|
| `build code` | `code` | code rules, fail-fast bias |
| `code review` | `code`, `review` | code + review rules, severity-rank findings |
| `debug / fix` | `code` | code rules, root-cause language |
| `visual review` | `design`, `review` | a11y + design rules, severity-rank |
| `creative writing` | `writing` | writing rules, voice-aware |
| `copywriting` | `writing`, `marketing` | writing + marketing, no-buzzword bias |
| `summarize` | `reasoning` | reasoning rules, rank-by-impact |
| `brainstorm` | `reasoning` | reasoning rules, distinct-idea bias |
| `system prompt` | `code`, `reasoning` | structural rules for agent prompts |

Mode → tag mapping lives in `src/lib/ruleLibrary.ts` (`MODE_TAGS`) and is mirrored in `src/lib/briefPulse.ts` so the library row, the inline pulse, and the rendered prompt all stay in sync.

## Keyboard shortcuts

| Combo | Action |
|---|---|
| `Cmd / Ctrl + Enter` | Sharpen brief — start generation |
| `Esc` | Cancel run |
| `Cmd / Ctrl + K` | Focus intent textarea |

## Requirements

1. Node.js 18+
2. pnpm
3. Ollama installed and running locally
4. At least one local Ollama model installed (e.g. `gemma2:2b`, `qwen2.5:3b`, `llama3.2:3b`)

## Quick start

```bash
pnpm install
pnpm start
```

`pnpm start` runs three concurrent processes: Vite renderer dev server on `127.0.0.1:5179`, TypeScript watch for the Electron main process, and Electron itself once both are ready. The window opens automatically.

Then: pick a model in the title bar, drop a rough ask in the brief, optionally pin a couple of rules from the library, and press `Cmd/Ctrl + Enter` to sharpen.

## Scripts

| Script | What it does |
|---|---|
| `pnpm start` | Full Electron dev flow (vite + tsc watch + electron) |
| `pnpm run electron:dev` | Alias for the same flow |
| `pnpm run dev` | Vite renderer only |
| `pnpm test` | Vitest one-shot (79 tests) |
| `pnpm run lint` | ESLint over `.ts`, `.tsx`, `.cts` |
| `pnpm run build` | Build renderer (Vite) and Electron entrypoints (tsc) |
| `pnpm run build:renderer` | Renderer only |
| `pnpm run build:electron` | Electron entrypoints only |
| `pnpm run preview` | Preview the built renderer |
| `pnpm run electron:build` | Package with electron-builder |

## Architecture

```
electron/
├── main.cts              ← BrowserWindow + lifecycle + CSP
├── preload.cts           ← Typed renderer/main contract
└── services/
    ├── generation.ts     ← Ollama streaming generation
    ├── runtime.ts        ← /api/tags discovery + readiness probe
    └── attach.ts         ← Image / file ingestion

src/
├── App.tsx               ← Two-pane grid layout
├── components/
│   ├── PromptComposer.tsx   ← Brief panel (intent, context, mode, advanced)
│   ├── ResultPanel.tsx      ← Draft stage (mirror, generation, draft editor)
│   ├── TitleBar.tsx         ← Runtime status + model selector
│   ├── RulesEditor.tsx      ← Chip-list rules + library row
│   └── PromptPreview.tsx    ← Rendered-prompt modal (portal)
├── contexts/
│   ├── composerContext.tsx  ← Brief state (intent, rules, mode, attach)
│   ├── outputContext.tsx    ← Draft + version history (localStorage)
│   ├── runtimeContext.tsx   ← Ollama runtime snapshot + selection
│   └── generationContext.tsx ← Streaming pipeline state machine
├── lib/
│   ├── promptWorkbench.ts   ← Brief → rendered prompt builder
│   ├── briefPulse.ts        ← Heuristic quality scorer + suggestions
│   ├── ruleLibrary.ts       ← Curated rules + MODE_TAGS map
│   ├── rules.ts             ← RuleType + detectRuleType
│   ├── prompts.ts           ← Strategy meta-prompts
│   ├── clipboard.ts         ← Electron-aware clipboard write
│   ├── icons.ts             ← Lucide re-exports
│   └── springs.ts           ← Framer Motion presets
└── types/                ← Shared contracts (renderer ↔ main)
```

## Electron security

- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` on every renderer window
- All privileged behavior routes through IPC and the typed preload bridge — the renderer has no direct access to Node APIs
- External URLs open through the validated `external:open` IPC handler (allowlist-style)
- BrowserWindow navigation restricted to the packaged file URL in production, the configured Vite dev origin in development
- `window.open` denied — no external page can run inside the app shell with the preload bridge attached
- Production responses ship a restrictive Content Security Policy

## Verification

Before shipping changes that touch Electron, IPC, dependencies, or packaging:

```bash
pnpm test
pnpm run lint
pnpm run build
pnpm audit --audit-level=moderate
```

Run `pnpm run electron:build` when packaging paths or `electron-builder.yml` change.

## Troubleshooting

**Generation fails or never starts**

1. Confirm Ollama is running: `ollama serve`
2. Confirm the selected model is installed: `ollama list`
3. Click `Refresh` in the title bar to re-probe the runtime
4. Confirm the status pill reads `LOCAL READY`, not `WARMING` or `OFFLINE`

**Electron fails to launch after upgrading the Electron version**

```bash
rm -rf node_modules
pnpm install
```

**Vite picks the wrong port**

The dev script pins `127.0.0.1:5179` with `--strictPort`. If the port is taken, free it before launching — Vite will not silently fall back.

## Dependency health

The repo pins vulnerable dev / build transitive packages forward through `pnpm.overrides`. After dependency changes:

```bash
pnpm audit --audit-level=moderate
```

## Packaging

```bash
pnpm run electron:build
```

macOS packaging is configured through `electron-builder.yml` and `build/entitlements.mac.plist`. The packaged main process loads the renderer from `dist/index.html`.

## Tech stack

- **Electron 41** — desktop shell + IPC
- **React 18** — renderer
- **TypeScript 5** — strict
- **Vite 6** — dev server + bundler
- **Tailwind CSS 3** — utility-first styling, with CSS-variable design tokens
- **Framer Motion 12** — spring physics + gesture
- **Lucide** — icon set
- **Vitest** — test runner
- **Ollama** — local model runtime

## License

MIT
