export class AudioVoiceManager {
  constructor(onAudioLevelCallback, onSpeechRecognizedCallback, onStateChangeCallback) {
    this.onAudioLevel = onAudioLevelCallback || (() => {});
    this.onSpeechRecognized = onSpeechRecognizedCallback || (() => {});
    this.onStateChange = onStateChangeCallback || (() => {});

    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;
    this.isListening = false;
    this.animationFrameId = null;

    // Speech Recognition
    this.recognition = null;
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChange('listening');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.onSpeechRecognized(transcript);
        this.stopListening();
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.stopListening();
      };

      this.recognition.onend = () => {
        this.stopListening();
      };
    }
  }

  async startListening() {
    if (this.isListening) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.micStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      this.isListening = true;
      this.onStateChange('listening');

      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // May already be running
        }
      }

      this.monitorAudioLevels();
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      // Fallback: simulate microphone listening wave
      this.isListening = true;
      this.onStateChange('listening');
      this.simulateMicLevel();
    }
  }

  monitorAudioLevels() {
    if (!this.isListening || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const tick = () => {
      if (!this.isListening) return;

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedLevel = Math.min(1.0, average / 128);

      this.onAudioLevel(normalizedLevel);
      this.animationFrameId = requestAnimationFrame(tick);
    };

    tick();
  }

  simulateMicLevel() {
    let t = 0;
    const tick = () => {
      if (!this.isListening) return;
      t += 0.1;
      const level = Math.sin(t) * 0.4 + 0.5;
      this.onAudioLevel(level);
      this.animationFrameId = requestAnimationFrame(tick);
    };
    tick();
  }

  stopListening() {
    this.isListening = false;
    this.onAudioLevel(0);
    this.onStateChange('idle');

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
    return this.isListening;
  }

  speak(text, onEndCallback) {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.1; // Friendly futuristic pitch

    // Prefer high quality English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || (v.lang === 'en-US' && !v.localService)
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    this.onStateChange('speaking');

    // Simulate animated speech cadence audio level
    let speechInterval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        const rand = 0.3 + Math.random() * 0.6;
        this.onAudioLevel(rand);
      } else {
        clearInterval(speechInterval);
      }
    }, 80);

    utterance.onend = () => {
      clearInterval(speechInterval);
      this.onAudioLevel(0);
      this.onStateChange('idle');
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      clearInterval(speechInterval);
      this.onAudioLevel(0);
      this.onStateChange('idle');
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  }
}
