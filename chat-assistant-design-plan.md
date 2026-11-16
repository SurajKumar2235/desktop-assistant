# Design Plan: Quick-Access Interactive Chat Assistant

## 1. Overview
A cross-platform (Windows, Linux) desktop assistant featuring a Three.js-powered interactive UI. The application resides in the system tray and provides a quick-access interface via a bottom-right toggle or global shortcut keys.

## 2. Core Architecture
- **Frontend**: Electron (Desktop Wrapper) + React/Vue (UI Logic) + Three.js (Interactive Elements).
- **Backend**: FastAPI (Python) for heavy lifting, tool execution, and LLM orchestration.
- **Communication**: WebSockets or Local REST API for low-latency interaction between Electron and FastAPI.

## 3. Technology Stack
| Component | Technology |
| :--- | :--- |
| **OS Support** | Windows (10/11), Linux (Debian-based, Fedora) |
| **Shell** | Electron |
| **3D Engine** | Three.js (for the interactive avatar or background) |
| **Backend** | FastAPI |
| **Voice** | SpeechRecognition (STT) and pyttsx3/ElevenLabs (TTS) |
| **Global Shortcut** | Electron `globalShortcut` API |

## 4. UI/UX Design
### Quick Access
- **Floating Bubble**: A small, persistent interactive element in the bottom-right corner.
- **Shortcut Key**: Configurable (e.g., `Alt + Space` or `Cmd + Shift + C`) to toggle visibility.
- **Input Modes**: 
  - **Text**: Standard chat input field.
  - **Voice**: Dedicated microphone button with visual Three.js feedback for voice activity.

### Interactive UI (Three.js)
- A central 3D entity (sphere, avatar, or abstract mesh) that reacts to user input and AI processing states (e.g., pulsing while thinking, vibrating while speaking).

## 5. System Features
### Dynamic LLM Configuration
- **UI Settings Panel**: Users can switch between providers (OpenAI, Anthropic, Ollama, etc.) via the UI.
- **Storage**: Configurable `.env` or `config.json` managed by the FastAPI backend to store API keys and model preferences.

### Tool & MCP Integration
- **Modular Plugin System**: A dedicated directory for tools/MCPs.
- **Configuration**: An `mcp_config.json` file to enable/disable specific capabilities (e.g., File System access, Web Search, Calculator).
- **Extensibility**: Standardized interface for adding new Python-based tools that FastAPI can dynamically load.

## 6. Infrastructure & Deployment
- **Linux Compatibility**:
  - **Debian/Ubuntu**: `.deb` package.
  - **Fedora**: `.rpm` package.
  - Utilization of `AppImage` for universal Linux support.
- **Windows**: Standard `.exe` installer via Electron Forge or NSIS.

## 7. Development Roadmap
1. **Phase 1**: Setup Electron + FastAPI boilerplate.
2. **Phase 2**: Integrate Three.js canvas as the primary UI background/avatar.
3. **Phase 3**: Implement Global Shortcut and System Tray logic.
4. **Phase 4**: Build the LLM Orchestrator in FastAPI with tool-calling support.
5. **Phase 5**: Add Voice-to-Text and Text-to-Voice modules.
6. **Phase 6**: Develop the Settings UI for live LLM switching.
