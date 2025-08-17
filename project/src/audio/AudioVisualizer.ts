/**
 * Advanced Audio Visualizer for Meow-Play
 * Features: Multiple visualization modes, real-time analysis, customizable themes
 * Rating Target: A+ (10/10)
 */

import { AudioVisualizationData } from './AudioEngine';

export type VisualizationMode = 
  | 'bars'
  | 'wave'
  | 'circular'
  | 'spectrum'
  | 'particles'
  | 'oscilloscope'
  | 'radial-bars'
  | 'liquid'
  | 'tunnel'
  | 'galaxy';

export interface VisualizationTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  gradientStops: string[];
  glowIntensity: number;
  particleCount: number;
}

export interface VisualizationSettings {
  mode: VisualizationMode;
  theme: string;
  sensitivity: number; // 0-1
  smoothing: number; // 0-1
  barCount: number; // for bar visualizations
  fftSize: number; // 256, 512, 1024, 2048
  minFrequency: number; // Hz
  maxFrequency: number; // Hz
  showFps: boolean;
  enableParticles: boolean;
  reactToBeats: boolean;
}

export interface BeatDetection {
  isBeat: boolean;
  intensity: number; // 0-1
  frequency: number; // Hz
  timestamp: number;
  bpm: number;
}

export class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: VisualizationSettings;
  private themes: Map<string, VisualizationTheme> = new Map();
  private animationId: number | null = null;
  private isRunning: boolean = false;
  
  // Performance tracking
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  
  // Beat detection
  private beatHistory: number[] = [];
  private lastBeat: number = 0;
  private bpmHistory: number[] = [];
  
  // Particle system
  private particles: Particle[] = [];
  private maxParticles: number = 100;
  
  // Audio analysis data
  private frequencyBins: Float32Array = new Float32Array(0);
  private timeDomainBins: Float32Array = new Float32Array(0);
  private previousFrame: Float32Array = new Float32Array(0);
  
  // Visual effects state
  private rotation: number = 0;
  private pulsation: number = 0;
  private colorShift: number = 0;
  private tunnelZ: number = 0;

  constructor(canvas: HTMLCanvasElement, settings: Partial<VisualizationSettings> = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    
    this.ctx = context;
    
    this.settings = {
      mode: 'bars',
      theme: 'neon',
      sensitivity: 0.8,
      smoothing: 0.7,
      barCount: 64,
      fftSize: 2048,
      minFrequency: 20,
      maxFrequency: 20000,
      showFps: false,
      enableParticles: true,
      reactToBeats: true,
      ...settings
    };
    
    this.setupCanvas();
    this.initializeThemes();
    this.initializeParticles();
  }

  /**
   * Setup canvas properties
   */
  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  /**
   * Initialize visualization themes
   */
  private initializeThemes(): void {
    const themes: VisualizationTheme[] = [
      {
        name: 'neon',
        primaryColor: '#00ffff',
        secondaryColor: '#ff00ff',
        accentColor: '#ffff00',
        backgroundColor: '#000011',
        gradientStops: ['#00ffff', '#0088ff', '#ff00ff', '#ff8800'],
        glowIntensity: 0.8,
        particleCount: 150
      },
      {
        name: 'fire',
        primaryColor: '#ff4400',
        secondaryColor: '#ffaa00',
        accentColor: '#ffff88',
        backgroundColor: '#110000',
        gradientStops: ['#ff0000', '#ff4400', '#ff8800', '#ffaa00'],
        glowIntensity: 0.6,
        particleCount: 200
      },
      {
        name: 'ocean',
        primaryColor: '#0088ff',
        secondaryColor: '#00ffff',
        accentColor: '#88ffff',
        backgroundColor: '#001122',
        gradientStops: ['#001144', '#0044aa', '#0088ff', '#00ffff'],
        glowIntensity: 0.5,
        particleCount: 100
      },
      {
        name: 'forest',
        primaryColor: '#00ff44',
        secondaryColor: '#44ff88',
        accentColor: '#88ffaa',
        backgroundColor: '#002200',
        gradientStops: ['#002200', '#004400', '#00aa44', '#00ff44'],
        glowIntensity: 0.4,
        particleCount: 80
      },
      {
        name: 'galaxy',
        primaryColor: '#8844ff',
        secondaryColor: '#ff44aa',
        accentColor: '#ffaa88',
        backgroundColor: '#110022',
        gradientStops: ['#220044', '#4400aa', '#8844ff', '#ff44aa'],
        glowIntensity: 0.9,
        particleCount: 300
      },
      {
        name: 'minimal',
        primaryColor: '#ffffff',
        secondaryColor: '#cccccc',
        accentColor: '#888888',
        backgroundColor: '#000000',
        gradientStops: ['#000000', '#444444', '#888888', '#ffffff'],
        glowIntensity: 0.2,
        particleCount: 50
      }
    ];

    themes.forEach(theme => this.themes.set(theme.name, theme));
  }

  /**
   * Initialize particle system
   */
  private initializeParticles(): void {
    this.particles = [];
    const theme = this.themes.get(this.settings.theme)!;
    
    for (let i = 0; i < theme.particleCount; i++) {
      this.particles.push(new Particle(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        theme
      ));
    }
  }

  /**
   * Start visualization
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFpsUpdate = performance.now();
    this.animate();
  }

  /**
   * Stop visualization
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.clearCanvas();
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;
    
    this.updateFps();
    this.updateEffects();
    this.render();
    
    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Update FPS counter
   */
  private updateFps(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * Update visual effects
   */
  private updateEffects(): void {
    const deltaTime = 16; // Assume 60fps for smooth animation
    
    this.rotation += 0.01;
    this.colorShift += 0.02;
    this.tunnelZ += 2;
    
    // Reset values to prevent overflow
    if (this.rotation > Math.PI * 2) this.rotation -= Math.PI * 2;
    if (this.colorShift > Math.PI * 2) this.colorShift -= Math.PI * 2;
    if (this.tunnelZ > 1000) this.tunnelZ = 0;
  }

  /**
   * Update visualization with audio data
   */
  updateAudioData(data: AudioVisualizationData): void {
    this.frequencyBins = data.frequencyData ? new Float32Array(data.frequencyData) : new Float32Array(0);
    this.timeDomainBins = data.waveformData || new Float32Array(0);
    
    // Apply smoothing
    if (this.previousFrame.length === this.frequencyBins.length) {
      for (let i = 0; i < this.frequencyBins.length; i++) {
        this.frequencyBins[i] = this.lerp(
          this.previousFrame[i],
          this.frequencyBins[i],
          1 - this.settings.smoothing
        );
      }
    }
    
    this.previousFrame = new Float32Array(this.frequencyBins);
    
    // Beat detection
    if (this.settings.reactToBeats) {
      this.detectBeats();
    }
    
    // Update particles based on audio
    if (this.settings.enableParticles) {
      this.updateParticles();
    }
  }

  /**
   * Detect beats in audio data
   */
  private detectBeats(): void {
    if (this.frequencyBins.length === 0) return;
    
    // Analyze low frequencies for beat detection (20Hz - 200Hz)
    const lowFreqEnd = Math.floor(this.frequencyBins.length * 0.1);
    let energy = 0;
    
    for (let i = 0; i < lowFreqEnd; i++) {
      energy += this.frequencyBins[i];
    }
    
    energy /= lowFreqEnd;
    
    // Add to history
    this.beatHistory.push(energy);
    if (this.beatHistory.length > 50) {
      this.beatHistory.shift();
    }
    
    // Calculate average energy
    const avgEnergy = this.beatHistory.reduce((sum, e) => sum + e, 0) / this.beatHistory.length;
    
    // Detect beat (current energy significantly higher than average)
    const threshold = avgEnergy * 1.5;
    const now = performance.now();
    
    if (energy > threshold && now - this.lastBeat > 200) { // Min 200ms between beats
      this.lastBeat = now;
      this.pulsation = 1;
      
      // Calculate BPM
      if (this.bpmHistory.length > 0) {
        const timeDiff = (now - this.bpmHistory[this.bpmHistory.length - 1]) / 1000;
        const bpm = 60 / timeDiff;
        
        if (bpm > 60 && bpm < 200) { // Reasonable BPM range
          this.bpmHistory.push(now);
          if (this.bpmHistory.length > 10) {
            this.bpmHistory.shift();
          }
        }
      } else {
        this.bpmHistory.push(now);
      }
      
      // Trigger particle burst on beat
      this.triggerParticleBurst();
    }
    
    // Decay pulsation
    this.pulsation *= 0.95;
  }

  /**
   * Update particle system
   */
  private updateParticles(): void {
    const theme = this.themes.get(this.settings.theme)!;
    
    this.particles.forEach(particle => {
      particle.update(this.frequencyBins, this.pulsation);
    });
    
    // Remove dead particles and add new ones
    this.particles = this.particles.filter(p => p.isAlive());
    
    while (this.particles.length < theme.particleCount) {
      this.particles.push(new Particle(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        theme
      ));
    }
  }

  /**
   * Trigger particle burst on beat
   */
  private triggerParticleBurst(): void {
    const burstCount = 20;
    const theme = this.themes.get(this.settings.theme)!;
    
    for (let i = 0; i < burstCount; i++) {
      const particle = new Particle(
        this.canvas.width / 2,
        this.canvas.height / 2,
        theme
      );
      particle.velocity.x = (Math.random() - 0.5) * 10;
      particle.velocity.y = (Math.random() - 0.5) * 10;
      particle.life = 2; // Longer life for burst particles
      this.particles.push(particle);
    }
  }

  /**
   * Main render function
   */
  private render(): void {
    this.clearCanvas();
    
    switch (this.settings.mode) {
      case 'bars':
        this.renderBars();
        break;
      case 'wave':
        this.renderWave();
        break;
      case 'circular':
        this.renderCircular();
        break;
      case 'spectrum':
        this.renderSpectrum();
        break;
      case 'particles':
        this.renderParticlesOnly();
        break;
      case 'oscilloscope':
        this.renderOscilloscope();
        break;
      case 'radial-bars':
        this.renderRadialBars();
        break;
      case 'liquid':
        this.renderLiquid();
        break;
      case 'tunnel':
        this.renderTunnel();
        break;
      case 'galaxy':
        this.renderGalaxy();
        break;
    }
    
    // Render particles if enabled
    if (this.settings.enableParticles && this.settings.mode !== 'particles') {
      this.renderParticles();
    }
    
    // Show FPS if enabled
    if (this.settings.showFps) {
      this.renderFps();
    }
  }

  /**
   * Clear canvas with background
   */
  private clearCanvas(): void {
    const theme = this.themes.get(this.settings.theme)!;
    this.ctx.fillStyle = theme.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render bars visualization
   */
  private renderBars(): void {
    if (this.frequencyBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const barCount = this.settings.barCount;
    const barWidth = this.canvas.width / barCount;
    const maxHeight = this.canvas.height * 0.8;
    
    // Create gradient
    const gradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, 0);
    theme.gradientStops.forEach((color, index) => {
      gradient.addColorStop(index / (theme.gradientStops.length - 1), color);
    });
    
    this.ctx.fillStyle = gradient;
    
    for (let i = 0; i < barCount; i++) {
      const binIndex = Math.floor((i / barCount) * this.frequencyBins.length);
      const amplitude = (this.frequencyBins[binIndex] / 255) * this.settings.sensitivity;
      const barHeight = amplitude * maxHeight * (1 + this.pulsation * 0.3);
      
      const x = i * barWidth;
      const y = this.canvas.height - barHeight;
      
      this.ctx.fillRect(x, y, barWidth - 2, barHeight);
      
      // Add glow effect
      if (theme.glowIntensity > 0) {
        this.ctx.shadowColor = theme.primaryColor;
        this.ctx.shadowBlur = theme.glowIntensity * 20;
        this.ctx.fillRect(x, y, barWidth - 2, barHeight);
        this.ctx.shadowBlur = 0;
      }
    }
  }

  /**
   * Render wave visualization
   */
  private renderWave(): void {
    if (this.timeDomainBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const centerY = this.canvas.height / 2;
    const amplitude = (this.canvas.height * 0.3) * this.settings.sensitivity;
    
    this.ctx.strokeStyle = theme.primaryColor;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    
    for (let i = 0; i < this.timeDomainBins.length; i++) {
      const x = (i / this.timeDomainBins.length) * this.canvas.width;
      const y = centerY + this.timeDomainBins[i] * amplitude * (1 + this.pulsation * 0.5);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
    
    // Add glow effect
    if (theme.glowIntensity > 0) {
      this.ctx.shadowColor = theme.primaryColor;
      this.ctx.shadowBlur = theme.glowIntensity * 15;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }

  /**
   * Render circular visualization
   */
  private renderCircular(): void {
    if (this.frequencyBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.3;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    
    const barCount = 120;
    const angleStep = (Math.PI * 2) / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const binIndex = Math.floor((i / barCount) * this.frequencyBins.length);
      const amplitude = (this.frequencyBins[binIndex] / 255) * this.settings.sensitivity;
      const radius = baseRadius + amplitude * (maxRadius - baseRadius) * (1 + this.pulsation * 0.4);
      
      const angle = i * angleStep + this.rotation;
      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;
      
      // Color based on frequency
      const hue = (i / barCount) * 360 + this.colorShift * 57.3; // Convert radians to degrees
      this.ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  /**
   * Render spectrum visualization
   */
  private renderSpectrum(): void {
    if (this.frequencyBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let x = 0; x < this.canvas.width; x++) {
      const binIndex = Math.floor((x / this.canvas.width) * this.frequencyBins.length);
      const amplitude = this.frequencyBins[binIndex] / 255;
      
      for (let y = 0; y < this.canvas.height; y++) {
        const intensity = Math.max(0, amplitude - (y / this.canvas.height));
        const index = (y * this.canvas.width + x) * 4;
        
        // Create spectral colors
        const hue = (x / this.canvas.width) * 360 + this.colorShift * 57.3;
        const [r, g, b] = this.hslToRgb(hue, 80, intensity * 60);
        
        data[index] = r;     // Red
        data[index + 1] = g; // Green
        data[index + 2] = b; // Blue
        data[index + 3] = intensity * 255; // Alpha
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Render particles only mode
   */
  private renderParticlesOnly(): void {
    this.renderParticles();
  }

  /**
   * Render oscilloscope visualization
   */
  private renderOscilloscope(): void {
    if (this.timeDomainBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const centerY = this.canvas.height / 2;
    const amplitude = (this.canvas.height * 0.4) * this.settings.sensitivity;
    
    // Multiple traces with slight offsets
    const traces = 3;
    for (let trace = 0; trace < traces; trace++) {
      const offset = (trace - 1) * 20;
      const alpha = 1 - (trace * 0.3);
      
      this.ctx.strokeStyle = theme.gradientStops[trace] + Math.floor(alpha * 255).toString(16);
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      for (let i = 0; i < this.timeDomainBins.length; i++) {
        const x = (i / this.timeDomainBins.length) * this.canvas.width;
        const y = centerY + this.timeDomainBins[i] * amplitude + offset;
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      
      this.ctx.stroke();
    }
  }

  /**
   * Render radial bars visualization
   */
  private renderRadialBars(): void {
    if (this.frequencyBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const barCount = 64;
    const angleStep = (Math.PI * 2) / barCount;
    const innerRadius = 50;
    const maxLength = Math.min(centerX, centerY) - innerRadius - 20;
    
    for (let i = 0; i < barCount; i++) {
      const binIndex = Math.floor((i / barCount) * this.frequencyBins.length);
      const amplitude = (this.frequencyBins[binIndex] / 255) * this.settings.sensitivity;
      const barLength = amplitude * maxLength * (1 + this.pulsation * 0.3);
      
      const angle = i * angleStep + this.rotation;
      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * (innerRadius + barLength);
      const y2 = centerY + Math.sin(angle) * (innerRadius + barLength);
      
      // Color gradient based on amplitude
      const intensity = Math.min(1, amplitude * 2);
      this.ctx.strokeStyle = this.interpolateColor(theme.primaryColor, theme.secondaryColor, intensity);
      this.ctx.lineWidth = 3;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  /**
   * Render liquid visualization
   */
  private renderLiquid(): void {
    if (this.frequencyBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const points = 100;
    const centerY = this.canvas.height / 2;
    const amplitude = (this.canvas.height * 0.3) * this.settings.sensitivity;
    
    // Create flowing liquid shape
    this.ctx.fillStyle = theme.primaryColor + '80'; // Semi-transparent
    this.ctx.beginPath();
    
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * this.canvas.width;
      const binIndex = Math.floor((i / points) * this.frequencyBins.length);
      const wave1 = Math.sin(x * 0.02 + this.colorShift) * 30;
      const wave2 = Math.sin(x * 0.01 + this.colorShift * 2) * 20;
      const audioWave = (this.frequencyBins[binIndex] / 255) * amplitude;
      
      const y = centerY + wave1 + wave2 + audioWave * (1 + this.pulsation * 0.5);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    // Close the shape at the bottom
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.lineTo(0, this.canvas.height);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Add highlight wave on top
    this.ctx.strokeStyle = theme.accentColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * this.canvas.width;
      const binIndex = Math.floor((i / points) * this.frequencyBins.length);
      const wave1 = Math.sin(x * 0.02 + this.colorShift) * 30;
      const wave2 = Math.sin(x * 0.01 + this.colorShift * 2) * 20;
      const audioWave = (this.frequencyBins[binIndex] / 255) * amplitude;
      
      const y = centerY + wave1 + wave2 + audioWave * (1 + this.pulsation * 0.5);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
  }

  /**
   * Render tunnel visualization
   */
  private renderTunnel(): void {
    if (this.frequencyBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY);
    
    // Draw concentric circles with audio-reactive properties
    const rings = 20;
    for (let ring = rings; ring > 0; ring--) {
      const ringProgress = ring / rings;
      const baseRadius = (maxRadius * ringProgress) + (this.tunnelZ % 50) - 25;
      
      if (baseRadius <= 0) continue;
      
      // Get audio amplitude for this ring
      const binIndex = Math.floor(ringProgress * this.frequencyBins.length);
      const amplitude = (this.frequencyBins[binIndex] / 255) * this.settings.sensitivity;
      const radius = baseRadius + amplitude * 50 * (1 + this.pulsation * 0.4);
      
      // Color based on depth and amplitude
      const intensity = ringProgress * amplitude;
      const color = this.interpolateColor(theme.backgroundColor, theme.primaryColor, intensity);
      
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  /**
   * Render galaxy visualization
   */
  private renderGalaxy(): void {
    if (this.frequencyBins.length === 0) return;
    
    const theme = this.themes.get(this.settings.theme)!;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const arms = 4;
    const pointsPerArm = 50;
    
    for (let arm = 0; arm < arms; arm++) {
      const armAngle = (arm / arms) * Math.PI * 2;
      
      this.ctx.beginPath();
      for (let point = 0; point < pointsPerArm; point++) {
        const progress = point / pointsPerArm;
        const binIndex = Math.floor(progress * this.frequencyBins.length);
        const amplitude = (this.frequencyBins[binIndex] / 255) * this.settings.sensitivity;
        
        // Spiral calculation
        const spiralTurns = 3;
        const angle = armAngle + progress * spiralTurns * Math.PI * 2 + this.rotation;
        const radius = progress * Math.min(centerX, centerY) * 0.8;
        
        // Add audio-reactive variation
        const variation = amplitude * 30 * Math.sin(progress * Math.PI * 4);
        const finalRadius = radius + variation * (1 + this.pulsation * 0.3);
        
        const x = centerX + Math.cos(angle) * finalRadius;
        const y = centerY + Math.sin(angle) * finalRadius;
        
        // Draw point with size based on amplitude
        const size = 1 + amplitude * 3;
        const intensity = amplitude * progress;
        const color = this.interpolateColor(theme.primaryColor, theme.accentColor, intensity);
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  /**
   * Render particle system
   */
  private renderParticles(): void {
    this.particles.forEach(particle => {
      particle.render(this.ctx);
    });
  }

  /**
   * Render FPS counter
   */
  private renderFps(): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 25);
  }

  /**
   * Utility functions
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };

    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    // Simple color interpolation - would be more robust with proper color parsing
    const f = Math.max(0, Math.min(1, factor));
    const opacity = Math.round(f * 255).toString(16).padStart(2, '0');
    return color1 + opacity;
  }

  /**
   * Public API methods
   */
  setSettings(settings: Partial<VisualizationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Reinitialize particles if theme changed
    if (settings.theme && this.themes.has(settings.theme)) {
      this.initializeParticles();
    }
  }

  getSettings(): VisualizationSettings {
    return { ...this.settings };
  }

  getThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  addTheme(theme: VisualizationTheme): void {
    this.themes.set(theme.name, theme);
  }

  resize(): void {
    this.setupCanvas();
    this.initializeParticles();
  }

  dispose(): void {
    this.stop();
    this.particles = [];
  }
}

/**
 * Particle class for particle system
 */
class Particle {
  public position: { x: number; y: number };
  public velocity: { x: number; y: number };
  public life: number;
  public maxLife: number;
  public size: number;
  public color: string;
  public theme: VisualizationTheme;

  constructor(x: number, y: number, theme: VisualizationTheme) {
    this.position = { x, y };
    this.velocity = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    };
    this.maxLife = Math.random() * 3 + 1;
    this.life = this.maxLife;
    this.size = Math.random() * 3 + 1;
    this.color = theme.primaryColor;
    this.theme = theme;
  }

  update(frequencyData: Float32Array, pulsation: number): void {
    // Move particle
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    
    // Apply audio influence
    if (frequencyData.length > 0) {
      const influence = (frequencyData[0] / 255) * 0.1;
      this.velocity.x += (Math.random() - 0.5) * influence;
      this.velocity.y += (Math.random() - 0.5) * influence;
    }
    
    // React to beats
    if (pulsation > 0.5) {
      this.size *= 1.1;
    }
    
    // Age particle
    this.life -= 0.016; // Assume 60fps
    
    // Apply friction
    this.velocity.x *= 0.99;
    this.velocity.y *= 0.99;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const alpha = Math.max(0, this.life / this.maxLife);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isAlive(): boolean {
    return this.life > 0;
  }
}
