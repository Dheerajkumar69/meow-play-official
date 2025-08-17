/**
 * Advanced Audio Player with Equalizer, Crossfade, and High-Quality Audio
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { 
  setCurrentTime, 
  setDuration, 
  pauseSong, 
  resumeSong, 
  setLoading,
  updateEqualizerSettings 
} from '../store/slices/musicSlice';

interface AdvancedAudioPlayerProps {
  className?: string;
}

export const AdvancedAudioPlayer: React.FC<AdvancedAudioPlayerProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    audioQuality,
    equalizerSettings,
    crossfadeEnabled,
    crossfadeDuration
  } = useAppSelector(state => state.music);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const equalizerNodesRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // EQ frequency bands (10-band equalizer)
  const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  // Initialize Web Audio API
  const initializeAudioContext = useCallback(async () => {
    if (!audioRef.current || isInitialized) return;

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;

      // Create source node
      sourceNodeRef.current = audioContext.createMediaElementSource(audioRef.current);
      
      // Create gain node for volume control
      gainNodeRef.current = audioContext.createGain();
      
      // Create analyzer for visualizations
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      // Create equalizer nodes
      equalizerNodesRef.current = EQ_FREQUENCIES.map((frequency, index) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = index === 0 ? 'lowshelf' : 
                     index === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        filter.gain.value = equalizerSettings.bands[index] || 0;
        return filter;
      });

      // Connect audio graph
      let currentNode: AudioNode = sourceNodeRef.current;
      
      // Connect equalizer chain
      if (equalizerSettings.enabled) {
        equalizerNodesRef.current.forEach(filter => {
          currentNode.connect(filter);
          currentNode = filter;
        });
      }
      
      // Connect gain and analyzer
      currentNode.connect(gainNodeRef.current);
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, [isInitialized, equalizerSettings.enabled, equalizerSettings.bands]);

  // Update audio quality
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;
    const qualitySettings = {
      low: { bitrate: '128k', format: 'mp3' },
      medium: { bitrate: '192k', format: 'mp3' },
      high: { bitrate: '320k', format: 'mp3' },
      lossless: { bitrate: '1411k', format: 'flac' }
    };

    // In a real implementation, you would request different quality versions
    // For now, we'll just set the preload strategy
    audio.preload = audioQuality === 'lossless' ? 'auto' : 'metadata';
  }, [audioQuality, currentSong]);

  // Update equalizer settings
  useEffect(() => {
    if (!equalizerNodesRef.current.length) return;

    equalizerNodesRef.current.forEach((filter, index) => {
      if (equalizerSettings.enabled) {
        filter.gain.value = equalizerSettings.bands[index] || 0;
      } else {
        filter.gain.value = 0;
      }
    });
  }, [equalizerSettings]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    } else if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.error('Playback failed:', error);
          dispatch(pauseSong());
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, dispatch]);

  // Handle song changes with crossfade
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;
    dispatch(setLoading(true));

    // Crossfade logic would go here
    if (crossfadeEnabled && gainNodeRef.current) {
      // Fade out current song
      const currentGain = gainNodeRef.current.gain.value;
      gainNodeRef.current.gain.exponentialRampToValueAtTime(
        0.01, 
        audioContextRef.current!.currentTime + crossfadeDuration
      );
      
      setTimeout(() => {
        audio.src = currentSong.url;
        audio.load();
        
        // Fade in new song
        gainNodeRef.current!.gain.exponentialRampToValueAtTime(
          currentGain,
          audioContextRef.current!.currentTime + crossfadeDuration
        );
      }, crossfadeDuration * 1000);
    } else {
      audio.src = currentSong.url;
      audio.load();
    }
  }, [currentSong, crossfadeEnabled, crossfadeDuration, dispatch]);

  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      dispatch(setDuration(audioRef.current.duration));
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      dispatch(setCurrentTime(audioRef.current.currentTime));
    }
  }, [dispatch]);

  const handleEnded = useCallback(() => {
    dispatch(pauseSong());
    // Handle next song logic here
  }, [dispatch]);

  const handleError = useCallback((error: any) => {
    console.error('Audio error:', error);
    dispatch(setLoading(false));
    dispatch(pauseSong());
  }, [dispatch]);

  const handleCanPlay = useCallback(async () => {
    await initializeAudioContext();
  }, [initializeAudioContext]);

  // Get audio analysis data for visualizations
  const getAudioData = useCallback(() => {
    if (!analyserRef.current) return null;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    return dataArray;
  }, []);

  // Expose audio data for visualizations
  useEffect(() => {
    if (isInitialized && analyserRef.current) {
      // Make audio data available globally for visualizations
      (window as any).getAudioData = getAudioData;
    }
  }, [isInitialized, getAudioData]);

  return (
    <div className={`advanced-audio-player ${className || ''}`}>
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        crossOrigin="anonymous"
        preload="metadata"
      />
      
      {/* Equalizer Controls */}
      {equalizerSettings.enabled && (
        <div className="equalizer-controls hidden">
          {EQ_FREQUENCIES.map((freq, index) => (
            <div key={freq} className="eq-band">
              <label className="text-xs text-gray-400">
                {freq < 1000 ? `${freq}Hz` : `${freq/1000}kHz`}
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={equalizerSettings.bands[index] || 0}
                onChange={(e) => {
                  const newBands = [...equalizerSettings.bands];
                  newBands[index] = parseFloat(e.target.value);
                  dispatch(updateEqualizerSettings({ bands: newBands }));
                }}
                className="eq-slider"
              />
              <span className="text-xs text-gray-400">
                {(equalizerSettings.bands[index] || 0).toFixed(1)}dB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedAudioPlayer;
