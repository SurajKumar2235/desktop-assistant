import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AvatarController {
  constructor(containerElement) {
    this.container = containerElement;
    this.width = containerElement.clientWidth || 400;
    this.height = containerElement.clientHeight || 320;

    // States: 'idle', 'listening', 'thinking', 'speaking'
    this.state = 'idle';
    this.audioLevel = 0; // 0.0 to 1.0

    // Theme color palettes
    this.themes = {
      cyan: {
        primary: 0x00f0ff,
        secondary: 0x7000ff,
        core: 0x00f0ff,
        ambient: 0x142036,
        particles: 0x00c8ff
      },
      purple: {
        primary: 0xd946ef,
        secondary: 0x8b5cf6,
        core: 0xec4899,
        ambient: 0x251436,
        particles: 0xf472b6
      },
      emerald: {
        primary: 0x10b981,
        secondary: 0x06b6d4,
        core: 0x34d399,
        ambient: 0x102b20,
        particles: 0x6ee7b7
      },
      gold: {
        primary: 0xf59e0b,
        secondary: 0xef4444,
        core: 0xfbbf24,
        ambient: 0x2d2212,
        particles: 0xfde68a
      }
    };
    this.currentThemeName = 'cyan';
    this.theme = this.themes.cyan;

    // Mouse tracking
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();

    // Internal animation tickers
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.clickBounce = 0;

    this.initScene();
    this.createAvatar();
    this.createParticles();
    this.setupEventListeners();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.2, 3.8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(this.theme.ambient, 1.8);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.dirLight.position.set(2, 4, 3);
    this.scene.add(this.dirLight);

    // Rim/Accent glow light
    this.rimLight = new THREE.PointLight(this.theme.primary, 3.5, 10);
    this.rimLight.position.set(-2, 1, 1);
    this.scene.add(this.rimLight);

    this.secondaryLight = new THREE.PointLight(this.theme.secondary, 2.5, 10);
    this.secondaryLight.position.set(2, -1, 1);
    this.scene.add(this.secondaryLight);

    this.raycaster = new THREE.Raycaster();
  }

  createAvatar() {
    this.avatarGroup = new THREE.Group();
    this.scene.add(this.avatarGroup);

    // Shared high-tech materials
    const darkShellMat = new THREE.MeshStandardMaterial({
      color: 0x161922,
      metalness: 0.85,
      roughness: 0.22,
      envMapIntensity: 1.0
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.1
    });

    this.glowMat = new THREE.MeshBasicMaterial({
      color: this.theme.primary,
      transparent: true,
      opacity: 0.95
    });

    this.coreMat = new THREE.MeshBasicMaterial({
      color: this.theme.core,
      transparent: true,
      opacity: 0.9
    });

    // 1. Head Assembly
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.45, 0);

    // Outer Head Shell (Stylized smooth capsule/sphere)
    const headGeo = new THREE.SphereGeometry(0.72, 32, 32);
    headGeo.scale(1, 1.1, 0.95);
    this.headMesh = new THREE.Mesh(headGeo, darkShellMat);
    this.headGroup.add(this.headMesh);

    // Visor Face Plate (Curved glass front)
    const visorGeo = new THREE.SphereGeometry(0.68, 32, 32, 0, Math.PI, 0, Math.PI * 0.7);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x05070e,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.5,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1.0
    });
    this.visorMesh = new THREE.Mesh(visorGeo, visorMat);
    this.visorMesh.rotation.x = -Math.PI / 2.3;
    this.visorMesh.position.set(0, 0.05, 0.12);
    this.headGroup.add(this.visorMesh);

    // Expressive Eyes (Left & Right)
    this.eyeGroup = new THREE.Group();
    this.eyeGroup.position.set(0, 0.05, 0.65);

    const eyeGeo = new THREE.CapsuleGeometry(0.065, 0.14, 16, 16);
    eyeGeo.rotateZ(Math.PI / 2);

    this.leftEye = new THREE.Mesh(eyeGeo, this.glowMat.clone());
    this.leftEye.position.set(-0.25, 0, 0);
    this.rightEye = new THREE.Mesh(eyeGeo, this.glowMat.clone());
    this.rightEye.position.set(0.25, 0, 0);

    this.eyeGroup.add(this.leftEye);
    this.eyeGroup.add(this.rightEye);
    this.headGroup.add(this.eyeGroup);

    // Audio-reactive Voice Waveform / Mouth Bar
    this.mouthBars = [];
    this.mouthGroup = new THREE.Group();
    this.mouthGroup.position.set(0, -0.22, 0.64);

    const barCount = 7;
    const barWidth = 0.035;
    for (let i = 0; i < barCount; i++) {
      const barGeo = new THREE.BoxGeometry(barWidth, 0.04, 0.02);
      const barMesh = new THREE.Mesh(barGeo, this.glowMat.clone());
      const xOffset = (i - (barCount - 1) / 2) * 0.055;
      barMesh.position.set(xOffset, 0, 0);
      this.mouthBars.push(barMesh);
      this.mouthGroup.add(barMesh);
    }
    this.headGroup.add(this.mouthGroup);

    // Floating Cyber Headphones / Audio Fins
    const earGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.15, 24);
    earGeo.rotateZ(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeo, darkShellMat);
    leftEar.position.set(-0.76, 0.02, 0);
    const rightEar = new THREE.Mesh(earGeo, darkShellMat);
    rightEar.position.set(0.76, 0.02, 0);

    const earRingGeo = new THREE.TorusGeometry(0.19, 0.02, 16, 32);
    earRingGeo.rotateY(Math.PI / 2);
    this.leftEarGlow = new THREE.Mesh(earRingGeo, this.glowMat.clone());
    leftEar.add(this.leftEarGlow);
    this.rightEarGlow = new THREE.Mesh(earRingGeo, this.glowMat.clone());
    rightEar.add(this.rightEarGlow);

    this.headGroup.add(leftEar);
    this.headGroup.add(rightEar);

    // Antennas / Audio sensor fins
    const antennaGeo = new THREE.ConeGeometry(0.04, 0.35, 16);
    antennaGeo.rotateX(0.2);
    const leftAntenna = new THREE.Mesh(antennaGeo, chromeMat);
    leftAntenna.position.set(-0.72, 0.35, -0.1);
    leftAntenna.rotation.z = 0.35;
    const rightAntenna = new THREE.Mesh(antennaGeo, chromeMat);
    rightAntenna.position.set(0.72, 0.35, -0.1);
    rightAntenna.rotation.z = -0.35;
    this.headGroup.add(leftAntenna);
    this.headGroup.add(rightAntenna);

    this.avatarGroup.add(this.headGroup);

    // 2. Torso / Chassis Assembly
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, -0.65, 0);

    // Segmented Floating Collar
    const collarGeo = new THREE.TorusGeometry(0.45, 0.07, 16, 32);
    collarGeo.rotateX(Math.PI / 2);
    const collarMesh = new THREE.Mesh(collarGeo, darkShellMat);
    collarMesh.position.set(0, 0.32, 0);
    this.torsoGroup.add(collarMesh);

    // Chest Body Shell
    const chestGeo = new THREE.CylinderGeometry(0.38, 0.22, 0.55, 32);
    const chestMesh = new THREE.Mesh(chestGeo, darkShellMat);
    chestMesh.position.set(0, 0, 0);
    this.torsoGroup.add(chestMesh);

    // Core Glowing Arc Reactor
    const coreGeo = new THREE.SphereGeometry(0.14, 24, 24);
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.coreMesh.position.set(0, 0.05, 0.26);
    this.torsoGroup.add(this.coreMesh);

    // Halo Rings around Core
    const ringGeo = new THREE.TorusGeometry(0.32, 0.015, 16, 40);
    this.gyroRing1 = new THREE.Mesh(ringGeo, this.glowMat.clone());
    this.gyroRing1.position.copy(this.coreMesh.position);
    this.gyroRing2 = new THREE.Mesh(ringGeo, this.glowMat.clone());
    this.gyroRing2.position.copy(this.coreMesh.position);
    this.torsoGroup.add(this.gyroRing1);
    this.torsoGroup.add(this.gyroRing2);

    this.avatarGroup.add(this.torsoGroup);

    // Holo Base Ring beneath avatar
    const baseHoloGeo = new THREE.RingGeometry(0.6, 0.85, 48);
    baseHoloGeo.rotateX(-Math.PI / 2);
    const baseHoloMat = new THREE.MeshBasicMaterial({
      color: this.theme.primary,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.baseHolo = new THREE.Mesh(baseHoloGeo, baseHoloMat);
    this.baseHolo.position.set(0, -1.25, 0);
    this.avatarGroup.add(this.baseHolo);
  }

  createParticles() {
    const particleCount = 85;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.2 + Math.random() * 1.5;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      speeds[i] = 0.2 + Math.random() * 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleSpeeds = speeds;

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.035,
      color: this.theme.particles,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      // Mouse coordinates relative to container center
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Normalized coordinates (-1 to +1)
      this.mouse.targetX = (clientX / this.width) * 2 - 1;
      this.mouse.targetY = -(clientY / this.height) * 2 + 1;
    });

    this.container.addEventListener('click', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / this.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / this.height) * 2 + 1;

      this.raycaster.setFromCamera({ x, y }, this.camera);
      const intersects = this.raycaster.intersectObjects(this.avatarGroup.children, true);

      if (intersects.length > 0) {
        this.triggerClickReaction();
      }
    });

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.width = this.container.clientWidth || 400;
    this.height = this.container.clientHeight || 320;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  triggerClickReaction() {
    this.clickBounce = 1.0;
    // Dispatch event to app for a lively friendly message
    const event = new CustomEvent('avatar-clicked', { detail: { state: this.state } });
    window.dispatchEvent(event);
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;

    // Reactively update lights and colors depending on state
    if (newState === 'listening') {
      this.rimLight.color.setHex(0x00ffff);
      this.secondaryLight.color.setHex(0x38bdf8);
    } else if (newState === 'thinking') {
      this.rimLight.color.setHex(0xf59e0b);
      this.secondaryLight.color.setHex(0xf43f5e);
    } else if (newState === 'speaking') {
      this.rimLight.color.setHex(0x10b981);
      this.secondaryLight.color.setHex(0x06b6d4);
    } else {
      // Idle
      this.rimLight.color.setHex(this.theme.primary);
      this.secondaryLight.color.setHex(this.theme.secondary);
    }
  }

  setAudioLevel(level) {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }

  setTheme(themeName) {
    if (!this.themes[themeName]) return;
    this.currentThemeName = themeName;
    this.theme = this.themes[themeName];

    this.ambientLight.color.setHex(this.theme.ambient);
    this.rimLight.color.setHex(this.theme.primary);
    this.secondaryLight.color.setHex(this.theme.secondary);
    this.glowMat.color.setHex(this.theme.primary);
    this.coreMat.color.setHex(this.theme.core);
    this.particleMaterial.color.setHex(this.theme.particles);
    this.baseHolo.material.color.setHex(this.theme.primary);
  }

  updateEyeBlink(delta) {
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.8) {
      this.isBlinking = true;
      if (this.blinkTimer > 4.05) {
        this.blinkTimer = 0;
        this.isBlinking = false;
      }
    }

    let targetEyeScaleY = 1.0;
    if (this.isBlinking) {
      targetEyeScaleY = 0.08;
    } else if (this.state === 'thinking') {
      targetEyeScaleY = 0.6; // squinting thoughtfully
    } else if (this.state === 'listening') {
      targetEyeScaleY = 1.25; // wide alert eyes
    }

    this.leftEye.scale.y = THREE.MathUtils.lerp(this.leftEye.scale.y, targetEyeScaleY, 0.25);
    this.rightEye.scale.y = THREE.MathUtils.lerp(this.rightEye.scale.y, targetEyeScaleY, 0.25);
  }

  updateMouthAndVoice(time) {
    const isSpeakingOrVoiceActive = this.state === 'speaking' || this.audioLevel > 0.08;

    this.mouthBars.forEach((bar, index) => {
      let height = 0.04;
      if (isSpeakingOrVoiceActive) {
        const offset = index * 0.8;
        const wave = Math.sin(time * 16 + offset) * 0.5 + 0.5;
        const activeAmp = this.state === 'speaking' ? 0.22 : this.audioLevel * 0.35;
        height = 0.04 + wave * activeAmp;
      }
      bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, height / 0.04, 0.3);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Smooth mouse interpolation
    this.mouse.x = THREE.MathUtils.lerp(this.mouse.x, this.mouse.targetX, 0.06);
    this.mouse.y = THREE.MathUtils.lerp(this.mouse.y, this.mouse.targetY, 0.06);

    // 1. Idle Floating & Breathing
    const hoverOffset = Math.sin(time * 1.8) * 0.045;
    const breatheScale = 1.0 + Math.sin(time * 2.5) * 0.015;

    // Click bounce decay
    if (this.clickBounce > 0) {
      this.clickBounce -= delta * 3.0;
      if (this.clickBounce < 0) this.clickBounce = 0;
    }
    const bounceOffset = Math.sin(this.clickBounce * Math.PI) * 0.12;

    this.avatarGroup.position.y = hoverOffset + bounceOffset;

    // 2. Head Tracking towards mouse
    const maxHeadYaw = 0.55;
    const maxHeadPitch = 0.35;
    const targetHeadYaw = this.mouse.x * maxHeadYaw;
    const targetHeadPitch = -this.mouse.y * maxHeadPitch;

    this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, targetHeadYaw, 0.08);
    this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, targetHeadPitch, 0.08);

    // Slight head roll when thinking
    if (this.state === 'thinking') {
      this.headGroup.rotation.z = Math.sin(time * 3) * 0.08;
    } else {
      this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, 0, 0.08);
    }

    // 3. Gyro Rings rotation
    let ringSpeed1 = 0.8;
    let ringSpeed2 = -1.1;
    if (this.state === 'thinking') {
      ringSpeed1 = 4.5;
      ringSpeed2 = -5.2;
    } else if (this.state === 'speaking') {
      ringSpeed1 = 2.0;
      ringSpeed2 = -2.2;
    }
    this.gyroRing1.rotation.x += delta * ringSpeed1;
    this.gyroRing1.rotation.y += delta * (ringSpeed1 * 0.7);
    this.gyroRing2.rotation.y += delta * ringSpeed2;
    this.gyroRing2.rotation.z += delta * (ringSpeed2 * 0.6);

    // Base holo rotation
    this.baseHolo.rotation.z = time * 0.4;

    // 4. Core Pulsing
    let corePulse = 1.0 + Math.sin(time * 3.5) * 0.12;
    if (this.state === 'thinking') {
      corePulse = 1.0 + Math.sin(time * 12) * 0.28;
    } else if (this.state === 'listening') {
      corePulse = 1.0 + this.audioLevel * 0.6;
    } else if (this.state === 'speaking') {
      corePulse = 1.0 + Math.sin(time * 8) * 0.22;
    }
    this.coreMesh.scale.setScalar(corePulse);

    // 5. Eye Blinks & Expression
    this.updateEyeBlink(delta);

    // 6. Voice Waveform / Mouth Bar animation
    this.updateMouthAndVoice(time);

    // 7. Ambient Particle Movement
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] += Math.sin(time + i) * 0.0015;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.rotation.y = time * 0.05;

    this.renderer.render(this.scene, this.camera);
  }

  loadCustomGLTF(url, onLoaded, onError) {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (this.avatarGroup) {
          this.avatarGroup.visible = false;
        }
        if (this.customModel) {
          this.scene.remove(this.customModel);
        }
        this.customModel = gltf.scene;
        
        // Auto-center and normalize scale
        const box = new THREE.Box3().setFromObject(this.customModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / (maxDim || 1);
        this.customModel.scale.setScalar(scale);

        const center = box.getCenter(new THREE.Vector3());
        this.customModel.position.x = -center.x * scale;
        this.customModel.position.y = -center.y * scale;
        this.customModel.position.z = -center.z * scale;

        this.scene.add(this.customModel);
        if (onLoaded) onLoaded(gltf);
      },
      undefined,
      (err) => {
        console.error('Failed to load custom GLTF:', err);
        if (onError) onError(err);
      }
    );
  }
}
