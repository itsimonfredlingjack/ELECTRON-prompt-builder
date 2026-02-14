<div align="center">

# 🧠 AI Prompt Builder
### Transform Rough Ideas into Optimized Prompts with Local AI

![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F?style=flat-square&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)

<br />

**A private, lightning-fast desktop application for refining prompts using local LLMs via Ollama.**

[Report Bug](https://github.com/local/ai-prompt-builder/issues) · [Request Feature](https://github.com/local/ai-prompt-builder/issues)

</div>

---

## 📖 About

**AI Prompt Builder** (formerly `i-prompt-bad`) is a lightweight desktop tool designed for developers, writers, and analysts who need high-quality prompts without compromising privacy. By leveraging **Ollama**, all processing happens locally on your machine—no API keys, no cloud subscriptions, and zero data leakage.

Simply select a category, choose your model, and type a rough idea. Watch as the AI transforms it into a structured, optimized prompt in real-time.

<div align="center">
  <!-- Replace with actual demo GIF -->
  <img src="https://via.placeholder.com/800x450.png?text=AI+Prompt+Builder+Demo" alt="App Demo" width="800" />
</div>

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🚀 **Local & Private** | Powered by Ollama. No data ever leaves your device. |
| ⚡ **Real-time Streaming** | Watch your prompt evolve instantly as the AI generates it. |
| 🌍 **Bilingual Support** | Input in **English** or **Swedish**. The output automatically adapts. |
| 🎯 **3 Specialized Modes** | **Coding/Dev**, **Analysis/Summary**, and **Creative Writing**. |
| 🎨 **Modern UI** | Clean, distraction-free interface built with React & Tailwind CSS. |
| 📦 **Portable** | distinct AppImage for Linux (cross-platform compatible via Electron). |
| 🧹 **Minimalist** | No history, no accounts, no saved prompts. Pure utility. |

---

## 🛠 Tech Stack

Built with modern web technologies wrapped in a robust desktop shell:

- **[Electron](https://www.electronjs.org/)**: Desktop shell
- **[React 18](https://react.dev/)**: UI Library
- **[TypeScript](https://www.typescriptlang.org/)**: Type safety
- **[Tailwind CSS](https://tailwindcss.com/)**: Styling
- **[Vite](https://vitejs.dev/)**: Build tool & Dev server
- **[Ollama](https://ollama.com/)**: Local LLM Inference

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js 18+**
2.  **[Ollama](https://ollama.com/)** running locally.

### Setting up Ollama

```bash
# Install Ollama (Linux/macOS)
curl -fsSL https://ollama.com/install.sh | sh

# Start the Ollama server
ollama serve

# Pull a model (required)
ollama pull gpt-oss # or qwen, ministral, llama3, etc.
```

---

## 🚀 Installation & Usage

### 1. Clone the Repository

```bash
git clone https://github.com/local/ai-prompt-builder.git
cd ai-prompt-builder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run in Development Mode

Starts the Vite dev server and Electron app concurrently.

```bash
npm run electron:dev
```

### 4. Build for Production

Create a distributable package (AppImage for Linux).

```bash
npm run electron:build
```

The output will be in the `release/` directory:
- `release/AI Prompt Builder-1.0.0.AppImage`

> **Note**: To run the AppImage, ensure it's executable:
> ```bash
> chmod +x "release/AI Prompt Builder-1.0.0.AppImage"
> ./release/AI\ Prompt\ Builder-1.0.0.AppImage
> ```

---

## 📝 How to Use

1.  **Ensure Ollama is running** (`ollama serve`).
2.  Launch the app.
3.  Select a **Category** suitable for your task.
4.  Choose an installed **Model** from the dropdown.
5.  Type your rough idea in the input box.
6.  Click **Generate Prompt**.
7.  Copy the result to your clipboard!

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Built with ❤️ by the Open Source Community
</div>
