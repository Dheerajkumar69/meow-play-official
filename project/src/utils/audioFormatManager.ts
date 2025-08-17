import { Song } from '../types';

export interface AudioFormat {
  extension: string;
  mimeType: string;
  supported: boolean;
}

class AudioFormatManager {
  private static instance: AudioFormatManager;
  
  private readonly supportedFormats: AudioFormat[] = [
    { extension: 'mp3', mimeType: 'audio/mpeg', supported: false },
    { extension: 'wav', mimeType: 'audio/wav', supported: false },
    { extension: 'ogg', mimeType: 'audio/ogg', supported: false },
    { extension: 'aac', mimeType: 'audio/aac', supported: false },
    { extension: 'm4a', mimeType: 'audio/mp4', supported: false },
    { extension: 'flac', mimeType: 'audio/flac', supported: false },
    { extension: 'opus', mimeType: 'audio/opus', supported: false },
    { extension: 'webm', mimeType: 'audio/webm', supported: false }
  ];

  static getInstance(): AudioFormatManager {
    if (!AudioFormatManager.instance) {
      AudioFormatManager.instance = new AudioFormatManager();
      AudioFormatManager.instance.checkSupportedFormats();
    }
    return AudioFormatManager.instance;
  }

  private async checkSupportedFormats(): Promise<void> {
    const audio = document.createElement('audio');
    
    this.supportedFormats.forEach(format => {
      format.supported = audio.canPlayType(format.mimeType) !== '';
    });
  }

  getSupportedFormats(): AudioFormat[] {
    return this.supportedFormats.filter(format => format.supported);
  }

  isFormatSupported(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return this.supportedFormats.some(
      format => format.extension === extension && format.supported
    );
  }

  async convertToSupportedFormat(file: File): Promise<File> {
    if (this.isFormatSupported(file.name)) {
      return file;
    }

    // Use WebAssembly-based audio converter (e.g., FFmpeg.wasm)
    try {
      const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();

      const inputData = await fetchFile(file);
      ffmpeg.FS('writeFile', 'input', inputData);

      // Convert to MP3 (most widely supported)
      await ffmpeg.run('-i', 'input', 'output.mp3');
      const outputData = ffmpeg.FS('readFile', 'output.mp3');

      return new File([outputData.buffer], `${file.name}.mp3`, {
        type: 'audio/mpeg'
      });
    } catch (error) {
      console.error('Audio conversion failed:', error);
      throw new Error('Could not convert audio format');
    }
  }

  getOptimalFormat(): AudioFormat {
    const preferred = ['opus', 'aac', 'mp3'];
    for (const format of preferred) {
      const found = this.supportedFormats.find(
        f => f.extension === format && f.supported
      );
      if (found) return found;
    }
    return this.supportedFormats.find(f => f.supported) || this.supportedFormats[0];
  }
}
