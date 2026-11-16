import { AvatarController } from './avatar.js';
import { AudioVoiceManager } from './audio.js';

class ChatAssistantApp {
  constructor() {
    this.avatarContainer = document.getElementById('avatar-canvas-container');
    this.statusPill = document.getElementById('status-pill');
    this.statusText = document.getElementById('status-text');
    this.messagesList = document.getElementById('messages-list');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');
    this.micBtn = document.getElementById('mic-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.settingsModal = document.getElementById('settings-modal');
    this.closeSettingsBtn = document.getElementById('close-settings-btn');
    this.themeSelect = document.getElementById('theme-select');
    this.llmProviderSelect = document.getElementById('llm-provider');
    this.apiEndpointInput = document.getElementById('api-endpoint');
    this.apiKeyInput = document.getElementById('api-key');
    this.ttsToggle = document.getElementById('tts-toggle');
    this.pinBtn = document.getElementById('pin-btn');
    this.minimizeBtn = document.getElementById('minimize-btn');
    this.closeBtn = document.getElementById('close-btn');

    this.settings = {
      provider: 'mock', // 'mock', 'fastapi', 'ollama', 'openai'
      endpoint: 'http://localhost:8000/api/chat',
      apiKey: '',
      model: 'default',
      ttsEnabled: true,
      theme: 'cyan'
    };

    this.loadSettings();
    this.initAvatar();
    this.initAudio();
    this.setupEventListeners();
    this.checkInitialPinStatus();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('assistant_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    if (this.themeSelect) this.themeSelect.value = this.settings.theme;
    if (this.llmProviderSelect) this.llmProviderSelect.value = this.settings.provider;
    if (this.apiEndpointInput) this.apiEndpointInput.value = this.settings.endpoint;
    if (this.apiKeyInput) this.apiKeyInput.value = this.settings.apiKey;
    if (this.ttsToggle) this.ttsToggle.checked = this.settings.ttsEnabled;
  }

  saveSettings() {
    this.settings.theme = this.themeSelect.value;
    this.settings.provider = this.llmProviderSelect.value;
    this.settings.endpoint = this.apiEndpointInput.value;
    this.settings.apiKey = this.apiKeyInput.value;
    this.settings.ttsEnabled = this.ttsToggle.checked;

    try {
      localStorage.setItem('assistant_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }

    this.avatar.setTheme(this.settings.theme);
  }

  initAvatar() {
    this.avatar = new AvatarController(this.avatarContainer);
    if (this.settings.theme) {
      this.avatar.setTheme(this.settings.theme);
    }
  }

  initAudio() {
    this.audioManager = new AudioVoiceManager(
      // onAudioLevel
      (level) => {
        this.avatar.setAudioLevel(level);
      },
      // onSpeechRecognized
      (transcript) => {
        if (transcript && transcript.trim()) {
          this.chatInput.value = transcript;
          this.handleSendMessage();
        }
      },
      // onStateChange
      (state) => {
        this.setAppState(state);
      }
    );
  }

  setAppState(state) {
    this.avatar.setState(state);

    if (this.statusText) {
      const labels = {
        idle: 'Online & Ready',
        listening: 'Listening...',
        thinking: 'Synthesizing...',
        speaking: 'Speaking...'
      };
      this.statusText.textContent = labels[state] || state;
    }

    if (this.statusPill) {
      this.statusPill.className = `status-pill status-${state}`;
    }

    if (this.micBtn) {
      if (state === 'listening') {
        this.micBtn.classList.add('active');
      } else {
        this.micBtn.classList.remove('active');
      }
    }
  }

  async checkInitialPinStatus() {
    if (window.electronAPI && window.electronAPI.getPinned) {
      try {
        const isPinned = await window.electronAPI.getPinned();
        if (this.pinBtn) {
          this.pinBtn.classList.toggle('active', isPinned);
        }
      } catch (err) {
        console.warn('Could not read pin status:', err);
      }
    }
  }

  setupEventListeners() {
    // Window header buttons
    if (this.minimizeBtn && window.electronAPI) {
      this.minimizeBtn.addEventListener('click', () => window.electronAPI.minimize());
    }
    if (this.closeBtn && window.electronAPI) {
      this.closeBtn.addEventListener('click', () => window.electronAPI.close());
    }
    if (this.pinBtn && window.electronAPI) {
      this.pinBtn.addEventListener('click', async () => {
        const isPinned = await window.electronAPI.togglePin();
        this.pinBtn.classList.toggle('active', isPinned);
      });
    }

    // Input handlers
    this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Mic toggle
    this.micBtn.addEventListener('click', () => {
      this.audioManager.toggleListening();
    });

    // Settings Modal
    this.settingsBtn.addEventListener('click', () => {
      this.settingsModal.classList.remove('hidden');
    });

    this.closeSettingsBtn.addEventListener('click', () => {
      this.saveSettings();
      this.settingsModal.classList.add('hidden');
    });

    this.themeSelect.addEventListener('change', () => {
      this.avatar.setTheme(this.themeSelect.value);
    });

    // Quick suggestion chips
    document.querySelectorAll('.chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-prompt') || chip.textContent.trim();
        this.chatInput.value = text;
        this.handleSendMessage();
      });
    });

    // Avatar click reaction from 3D scene
    window.addEventListener('avatar-clicked', () => {
      const greetings = [
        "Hello! I am ready to assist you.",
        "Systems nominal! How can I help you today?",
        "Watching and waiting! Ask me anything."
      ];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      this.appendMessage('assistant', randomGreeting);
      if (this.settings.ttsEnabled) {
        this.audioManager.speak(randomGreeting);
      }
    });
  }

  appendMessage(role, text) {
    const msgEl = document.createElement('div');
    msgEl.className = `message message-${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'message-time';
    const now = new Date();
    time.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    msgEl.appendChild(bubble);
    msgEl.appendChild(time);
    this.messagesList.appendChild(msgEl);

    // Scroll to bottom
    this.messagesList.scrollTop = this.messagesList.scrollHeight;
  }

  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message message-assistant typing-indicator-item';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="message-bubble typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    this.messagesList.appendChild(indicator);
    this.messagesList.scrollTop = this.messagesList.scrollHeight;
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  async handleSendMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.chatInput.value = '';
    this.appendMessage('user', text);

    // Transition to thinking state
    this.setAppState('thinking');
    this.showTypingIndicator();

    try {
      const responseText = await this.getAssistantResponse(text);
      this.removeTypingIndicator();
      this.appendMessage('assistant', responseText);

      // Play vocal speech if enabled
      if (this.settings.ttsEnabled) {
        this.audioManager.speak(responseText, () => {
          this.setAppState('idle');
        });
      } else {
        this.setAppState('idle');
      }
    } catch (err) {
      this.removeTypingIndicator();
      this.appendMessage('assistant', `⚠️ Error communicating with assistant: ${err.message}`);
      this.setAppState('idle');
    }
  }

  async getAssistantResponse(prompt) {
    // If provider is set to FastAPI backend
    if (this.settings.provider === 'fastapi') {
      try {
        const res = await fetch(this.settings.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, stream: false })
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        return data.response || data.text || JSON.stringify(data);
      } catch (err) {
        console.warn('FastAPI backend not reachable, falling back to local engine:', err);
        return this.generateLocalResponse(prompt) + ' (FastAPI backend was unreachable, using local fallback)';
      }
    }

    // Default intelligent local simulation with realistic latency
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    return this.generateLocalResponse(prompt);
  }

  generateLocalResponse(prompt) {
    const lower = prompt.toLowerCase();

    if (lower.includes('what can you do') || lower.includes('help')) {
      return "I'm your 3D Interactive AI Assistant! I feature a reactive Three.js avatar that tracks your mouse, reacts to your voice, pulses when thinking, and speaks back to you. You can press Alt+Space anytime to toggle me from the system tray!";
    }
    if (lower.includes('fact')) {
      const facts = [
        "Light from the sun takes about 8 minutes and 20 seconds to reach Earth!",
        "Three.js renders 3D graphics using WebGL directly in your GPU hardware.",
        "Octopuses have three hearts and blue blood!",
        "Electron powers some of the world's most popular desktop apps including VS Code and Discord."
      ];
      return facts[Math.floor(Math.random() * facts.length)];
    }
    if (lower.includes('system') || lower.includes('status')) {
      return "All core telemetry parameters are optimal. 3D avatar WebGL pipeline active at 60 FPS, audio analyzer initialized, and tray shortcut Alt+Space registered.";
    }
    if (lower.includes('theme') || lower.includes('color')) {
      return "You can customize my aesthetic anytime in the Settings menu (top right cog icon)! Choose between Cyber Cyan, Neon Purple, Emerald Matrix, or Solar Gold.";
    }
    if (lower.includes('hello') || lower.includes('hi')) {
      return "Hello! Great to see you. How can I assist you with your tasks today?";
    }

    return `I received your message: "${prompt}". My 3D avatar is tracking your input and ready for LLM or FastAPI orchestrator expansion!`;
  }
}

// Start app on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new ChatAssistantApp();
});
