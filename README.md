# Interactive 3D AI Assistant (Electron + Three.js + FastAPI)

A cross-platform, quick-access desktop AI assistant featuring an interactive **Three.js 3D avatar**, system tray residency, global shortcuts, and a modular **FastAPI** backend integration based on [chat-assistant-design-plan.md](file:///c:/Users/suraj/Documents/New%20folder/chat-assistant-design-plan.md).

---

## 🌟 Key Features

### 1. 🤖 Interactive Three.js 3D Avatar
- **Live Gaze & Head Tracking**: The avatar's head and eyes smoothly turn to follow your mouse cursor anywhere on the screen.
- **Expressive Operational States**:
  - `idle`: Gentle breathing, floating hover, calm cyan glow, occasional natural eye blinks.
  - `listening`: Alert posture, electric cyan sensors, real-time voice amplitude reaction.
  - `thinking`: Rapidly orbiting gyro rings, vibrating amber/orange core reactor, thoughtful head tilt.
  - `speaking`: Neon green cadence glow, dynamic waveform mouth animation, and expressive head nod synchronized with voice speech.
- **Microphone & Voice Reactivity**: Integrates the Web Audio API with real-time frequency analysis.
- **Click Interaction**: Click directly on the 3D avatar to trigger a playful greeting animation and voice reply.
- **Customizable Themes**: Switch between **Cyber Cyan**, **Neon Purple**, **Emerald Matrix**, and **Solar Gold** via the UI Settings panel.
- **Custom GLTF/GLB Support**: Includes `AvatarController.loadCustomGLTF(url)` with Three.js `GLTFLoader` to load any custom 3D model.

### 2. ⚡ Desktop Quick-Access & System Tray
- **System Tray Residency**: Lives in the system tray when closed or blurred; never clutters your taskbar unnecessarily.
- **Global Shortcut**: Press <kbd>Alt</kbd> + <kbd>Space</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd> from any application to instantly show/hide the assistant.
- **Frameless Glassmorphic UI**: Frosted dark glass aesthetic (`backdrop-filter: blur(24px)`), custom draggable titlebar, always-on-top pin toggle, and smooth window controls.
- **Positioned for Quick Access**: Auto-docks at the bottom-right corner of your primary display.

### 3. 🧠 LLM Orchestration & FastAPI Backend
- **Phase 1-4 Ready**: Includes a FastAPI Python backend (`backend/main.py`) with REST API endpoints (`/api/chat`, `/api/status`, `/api/tools`, `/api/settings`).
- **MCP & Tool Plugin Architecture**: Pre-configured `mcp_config.json` and `config.json` for tool calling and dynamic LLM switching (OpenAI, Ollama, Anthropic, or local offline simulator).
- **Voice Text-to-Speech (TTS)**: Built-in speech synthesis that syncs with avatar mouth movement.

---

## 📁 Project Structure

```
├── main.js                      # Electron Main process (Window, System Tray, Global Shortcuts, IPC)
├── preload.js                   # Secure context bridge exposing window controls to renderer
├── package.json                 # Scripts and dependencies (Electron 28, Three.js 0.160)
├── chat-assistant-design-plan.md# Design specifications
├── backend/
│   ├── main.py                  # FastAPI backend (LLM Orchestrator, Tools, Chat API)
│   ├── requirements.txt         # Python dependencies (FastAPI, Uvicorn, Pydantic)
│   ├── config.json              # LLM configuration (Provider, API Keys, Model)
│   └── mcp_config.json          # MCP Tool registration (Filesystem, Web Search, Calculator)
└── src/
    ├── index.html               # Main application layout & Three.js canvas container
    ├── styles.css               # Modern glassmorphism cyberpunk styles
    ├── avatar.js                # Three.js 3D Avatar engine (Geometry, Lighting, Animations, Tracking)
    ├── audio.js                 # Web Audio API mic analyzer & Text-to-Speech manager
    └── app.js                   # Assistant controller, chat history, settings & state machine
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.9+ (optional, for running the FastAPI backend)

### 1. Launch the Electron Desktop App

To start the desktop assistant:

```bash
npm start
```

> **Note for environments where `ELECTRON_RUN_AS_NODE` might be preset:**
> ```bash
> npm run start:clean
> ```

### 2. (Optional) Run the FastAPI Backend

If you want to use the Python LLM orchestrator:

```bash
# 1. Install Python dependencies
pip install -r backend/requirements.txt

# 2. Start the FastAPI server on port 8000
npm run backend
# or: python backend/main.py
```

Then in the assistant window, click the **Settings (gear icon)** at the top right and select **FastAPI Local Backend** as the LLM Provider.

---

## ⌨️ Controls & Shortcuts

| Action | Control / Shortcut |
| :--- | :--- |
| **Toggle Assistant** | <kbd>Alt</kbd> + <kbd>Space</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd> |
| **System Tray Menu** | Right-click the tray icon in the system notification area |
| **Toggle Always on Top** | Pin icon in the top header |
| **Interact with 3D Avatar** | Move cursor over window, or left-click on the avatar |
| **Voice Input** | Click the microphone icon to speak |
| **Switch Aesthetic** | Settings &rarr; 3D Avatar Theme |
