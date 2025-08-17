// AudioEventManager for handling audio events and cleanup
export class AudioEventManager {
  private audio: HTMLAudioElement | null = null;
  private eventHandlers: Map<string, EventListener> = new Map();
  private equalizerNodes: {
    bass: BiquadFilterNode | null;
    mid: BiquadFilterNode | null;
    treble: BiquadFilterNode | null;
  } = { bass: null, mid: null, treble: null };
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private suspended: boolean = false;

  attach(audio: HTMLAudioElement) {
    // Clean up existing connections before attaching new audio
    this.cleanup();
    this.audio = audio;
    this.setupAudioContext();
  }

  private async setupAudioContext() {
    if (!this.audio) return;

    try {
      // Create or resume audio context
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } else if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create nodes
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.gainNode = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();
      
      // Configure analyser
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Create equalizer nodes
      this.equalizerNodes.bass = this.audioContext.createBiquadFilter();
      this.equalizerNodes.mid = this.audioContext.createBiquadFilter();
      this.equalizerNodes.treble = this.audioContext.createBiquadFilter();

      // Configure equalizer nodes
      if (this.equalizerNodes.bass) {
        this.equalizerNodes.bass.type = 'lowshelf';
        this.equalizerNodes.bass.frequency.value = 200;
      }
      if (this.equalizerNodes.mid) {
        this.equalizerNodes.mid.type = 'peaking';
        this.equalizerNodes.mid.frequency.value = 1500;
        this.equalizerNodes.mid.Q.value = 1;
      }
      if (this.equalizerNodes.treble) {
        this.equalizerNodes.treble.type = 'highshelf';
        this.equalizerNodes.treble.frequency.value = 3000;
      }

      // Connect nodes in series: source -> gain -> equalizer -> analyser -> destination
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.equalizerNodes.bass!);
      this.equalizerNodes.bass!.connect(this.equalizerNodes.mid!);
      this.equalizerNodes.mid!.connect(this.equalizerNodes.treble!);
      this.equalizerNodes.treble!.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);

    } catch (error) {
      console.error('Error setting up audio context:', error);
      this.cleanup();
      throw error;
    }
  }

  addEventHandler(event: string, handler: EventListener) {
    if (!this.audio) return;
    
    // Remove existing handler if present
    this.removeEventHandler(event);
    
    // Add new handler
    this.audio.addEventListener(event, handler);
    this.eventHandlers.set(event, handler);
  }

  removeEventHandler(event: string) {
    if (!this.audio) return;
    
    const handler = this.eventHandlers.get(event);
    if (handler) {
      this.audio.removeEventListener(event, handler);
      this.eventHandlers.delete(event);
    }
  }

  async suspend() {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
      this.suspended = true;
    }
  }

  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      this.suspended = false;
    }
  }

  cleanup() {
    if (this.audio) {
      // Remove all event listeners
      this.eventHandlers.forEach((handler, event) => {
        this.audio?.removeEventListener(event, handler);
      });
      this.eventHandlers.clear();

      // Clean up audio context and nodes
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.analyserNode) {
        this.analyserNode.disconnect();
        this.analyserNode = null;
      }
      
      // Clean up equalizer nodes
      Object.values(this.equalizerNodes).forEach(node => {
        if (node) {
          node.disconnect();
        }
      });
      this.equalizerNodes = { bass: null, mid: null, treble: null };

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
      this.audioContext = null;
    }
    this.audio = null;
    this.suspended = false;
  }

  setEqualizer(settings: { bass: number; mid: number; treble: number; enabled: boolean }) {
    if (!this.audioContext || !this.sourceNode) return;

    if (!settings.enabled) {
      // Bypass equalizer when disabled
      this.sourceNode.disconnect();
      this.sourceNode.connect(this.audioContext.destination);
      return;
    }

    // Reconnect through the audio processing chain
    this.sourceNode.disconnect();
    this.sourceNode.connect(this.gainNode!);

    // Update equalizer settings
    if (this.equalizerNodes.bass) {
      this.equalizerNodes.bass.gain.value = settings.bass;
    }
    if (this.equalizerNodes.mid) {
      this.equalizerNodes.mid.gain.value = settings.mid;
    }
    if (this.equalizerNodes.treble) {
      this.equalizerNodes.treble.gain.value = settings.treble;
    }
  }

  getAnalyserData(): { frequencyData: Uint8Array; timeData: Uint8Array } {
    if (!this.analyserNode) {
      return {
        frequencyData: new Uint8Array(),
        timeData: new Uint8Array()
      };
    }

    const frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
    const timeData = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.analyserNode.getByteFrequencyData(frequencyData);
    this.analyserNode.getByteTimeDomainData(timeData);

    return { frequencyData, timeData };
  }

  setVolume(value: number) {
    if (this.gainNode) {
      // Convert linear volume (0-1) to exponential (-40dB to 0dB)
      const minDb = -40;
      const maxDb = 0;
      if (value <= 0) {
        this.gainNode.gain.value = 0;
      } else {
        const db = minDb + (value * (maxDb - minDb));
        this.gainNode.gain.value = Math.pow(10, db / 20);
      }
    }
  }
}
