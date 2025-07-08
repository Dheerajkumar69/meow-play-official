import React from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

interface EqualizerProps {
  isOpen: boolean;
  onClose: () => void;
}

const Equalizer: React.FC<EqualizerProps> = ({ isOpen, onClose }) => {
  const { equalizer, setEqualizer, crossfadeEnabled, crossfadeDuration, setCrossfade } = useMusic();

  const handleEqualizerChange = (band: keyof typeof equalizer, value: number) => {
    setEqualizer({
      ...equalizer,
      [band]: value
    });
  };

  const resetEqualizer = () => {
    setEqualizer({
      bass: 0,
      mid: 0,
      treble: 0,
      enabled: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Audio Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Equalizer Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Equalizer</span>
            <button
              onClick={() => handleEqualizerChange('enabled', !equalizer.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                equalizer.enabled ? 'bg-purple-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  equalizer.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* EQ Controls */}
          <div className={`space-y-4 ${!equalizer.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Bass</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm w-8">-12</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={equalizer.bass}
                  onChange={(e) => handleEqualizerChange('bass', parseFloat(e.target.value))}
                  className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-gray-400 text-sm w-8">+12</span>
                <span className="text-white text-sm w-8">{equalizer.bass > 0 ? '+' : ''}{equalizer.bass}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Mid</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm w-8">-12</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={equalizer.mid}
                  onChange={(e) => handleEqualizerChange('mid', parseFloat(e.target.value))}
                  className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-gray-400 text-sm w-8">+12</span>
                <span className="text-white text-sm w-8">{equalizer.mid > 0 ? '+' : ''}{equalizer.mid}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Treble</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm w-8">-12</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={equalizer.treble}
                  onChange={(e) => handleEqualizerChange('treble', parseFloat(e.target.value))}
                  className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-gray-400 text-sm w-8">+12</span>
                <span className="text-white text-sm w-8">{equalizer.treble > 0 ? '+' : ''}{equalizer.treble}</span>
              </div>
            </div>

            <button
              onClick={resetEqualizer}
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Crossfade */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-medium">Crossfade</span>
              <button
                onClick={() => setCrossfade(!crossfadeEnabled, crossfadeDuration)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  crossfadeEnabled ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    crossfadeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {crossfadeEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Duration</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">0s</span>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={crossfadeDuration}
                    onChange={(e) => setCrossfade(crossfadeEnabled, parseFloat(e.target.value))}
                    className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-gray-400 text-sm">12s</span>
                  <span className="text-white text-sm w-8">{crossfadeDuration}s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equalizer;