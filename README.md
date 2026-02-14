# AI Prompt Builder (i-prompt-bad)

A lightweight desktop app that transforms rough ideas into optimized prompts using local AI (Ollama).

## Features

- **3 Categories**: Coding/Development, Analysis/Summarization, Creative Writing
- **Local AI**: Uses Ollama running on your machine - no cloud calls
- **Streaming**: See the optimized prompt generate in real-time
- **Bilingual**: Input in Swedish or English - output matches input language
- **Minimal**: No history, no accounts, no saved prompts

## Prerequisites

- **Node.js** 18+
- **Ollama** running locally on `localhost:11434`
- At least one Ollama model installed (e.g., `gpt-oss`, `qwen`, `ministral`)

### Installing Ollama

```bash
# On Fedora/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve

# Pull a model (in another terminal)
ollama pull gpt-oss
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

This starts Vite dev server and Electron simultaneously.

## Build

```bash
# Build the app
npm run electron:build
```

Outputs:
- `release/AI Prompt Builder-1.0.0.AppImage` - Portable Linux app

> **Note**: RPM build requires `rpmbuild` and may fail on some systems. AppImage is the recommended distribution format.

### Running the AppImage

```bash
chmod +x "release/AI Prompt Builder-1.0.0.AppImage"
./release/AI\ Prompt\ Builder-1.0.0.AppImage
```

## Usage

1. **Start Ollama** (if not already running)
   ```bash
   ollama serve
   ```

2. **Launch the app**
   - Run `npm run electron:dev` for development
   - Or install the AppImage/rpm package

3. **Generate a prompt**
   - Select a **Category** (Coding, Analysis, or Creative)
   - Select a **Model** from the dropdown
   - Write your rough idea in Swedish or English
   - Click **Generate Prompt**
   - Click **Copy to Clipboard** when done

## Tech Stack

- **Electron** - Desktop shell
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Ollama** - Local LLM inference

## License

MIT
