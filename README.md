# 🧠 AI Prompt Builder

**Transform rough ideas into optimized prompts using Z.AI GLM models.**

A macOS desktop app for refining prompts via the [Z.AI GLM API](https://docs.z.ai/devpack/quick-start). Select a category, choose a model (GLM-5, GLM-4.7, etc.), and type your idea in Swedish or English. The AI streams a structured, optimized prompt in real time.

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🤖 **Z.AI GLM** | Powered by GLM-5, GLM-4.7, and other models via [Z.AI](https://z.ai). |
| ⚡ **Real-time Streaming** | Watch your prompt evolve as the AI generates it. |
| 🌍 **Bilingual** | Input in **English** or **Swedish**; output matches your language. |
| 🎯 **3 Modes** | **Coding/Dev**, **Analysis/Summary**, and **Creative Writing**. |
| ⌨️ **Shortcuts** | ⌘+Enter to generate, Esc to stop. |
| 📦 **macOS** | Native DMG for Apple Silicon & Intel. |

## ⚙️ Prerequisites

1. **Node.js 18+**
2. **Z.AI API Key** – Subscribe to [GLM Coding Plan](https://z.ai/subscribe) and create an API key at [z.ai/manage-apikey](https://z.ai/manage-apikey).

## 🚀 Quick Start

```bash
pnpm install
pnpm run electron:dev
```

1. Click **Settings** (gear icon) and enter your Z.AI API key.
2. Select a **Category** and **Model**.
3. Type your rough idea and press **⌘+Enter** (or click Generate).

## Build for macOS

```bash
pnpm run build
pnpm exec electron-builder --mac
```

Output: `release/AI Prompt Builder-1.0.0-arm64.dmg` (or `-x64.dmg` on Intel).

## Tech Stack

- **Electron** – Desktop shell  
- **React 18** – UI  
- **TypeScript** – Type safety  
- **Tailwind CSS** – Styling  
- **Vite** – Build tool  
- **Z.AI API** – [OpenAI-compatible chat completions](https://docs.z.ai/api-reference/llm/chat-completion)

## License

MIT
