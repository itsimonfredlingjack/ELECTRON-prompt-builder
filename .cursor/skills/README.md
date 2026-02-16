# Skills for AI Prompt Builder (Electron)

Project-specific and fullstack developer skills from [SkillsMP](https://skillsmp.com/).

## Installed Skills

### Electron & Desktop
| Skill | Source | Purpose |
|-------|--------|---------|
| **electron-macos-desktop** | Project | macOS builds, security, entitlements, DMG |
| **electron-cloud-llm-integration** | Project | Z.AI/OpenAI API, streaming, API key storage |
| **electron-base** | jezweb/claude-skills | Electron 33 + Vite + React, IPC, packaging |

### Fullstack & Frontend
| Skill | Source | Purpose |
|-------|--------|---------|
| **react-modernization** | wshobson/agents | React hooks, concurrent features, upgrades |
| **typescript-core** | bobmatnyc/claude-mpm-skills | TypeScript patterns, tsconfig, Zod |
| **tailwind-css** | bobmatnyc/claude-mpm-skills | Tailwind utilities, components, responsive |
| **nextjs-core** | bobmatnyc/claude-mpm-skills | Next.js App Router, SSR, routing |

### Backend & API
| Skill | Source | Purpose |
|-------|--------|---------|
| **nodejs-backend-typescript** | bobmatnyc/claude-mpm-skills | Express/Fastify, validation, auth |
| **fastapi** | jezweb/claude-skills | FastAPI, Pydantic, async SQLAlchemy |
| **api-design-patterns** | bobmatnyc/claude-mpm-skills | REST API standards, design patterns |
| **trpc-type-safety** | bobmatnyc/claude-mpm-skills | End-to-end type-safe APIs |

## Adding More Skills

```bash
npx skills add <repo-url> --skill <skill-name> -y
```

Skills install to `.agents/skills/` and symlink to Cursor automatically.
