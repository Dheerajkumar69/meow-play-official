import React, { useState } from 'react';
import { Download, AlertCircle, CheckCircle, ExternalLink, Info } from 'lucide-react';
import { spotifyIntegration, demonstrateSpotifyIntegration } from '../utils/spotifyIntegration';
import { useMusic } from '../contexts/MusicContext';

interface SpotifyImporterProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpotifyImporter: React.FC<SpotifyImporterProps> = ({ isOpen, onClose }) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { songs, setSongs } = useMusic();

  const handleImport = async () => {
    if (!playlistUrl.trim()) {
      setError('Please enter a Spotify playlist URL');
      return;
    }

    if (!playlistUrl.includes('spotify.com/playlist/')) {
      setError('Please enter a valid Spotify playlist URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const importedSongs = await demonstrateSpotifyIntegration(playlistUrl);
      
      if (importedSongs.length > 0) {
        // Add imported songs to the library
        setSongs([...importedSongs, ...songs]);
        setSuccess(`Successfully imported ${importedSongs.length} song previews from Spotify!`);
        setPlaylistUrl('');
      } else {
        setError('No songs found in the playlist or import failed');
      }
    } catch (err) {
      setError('Failed to import playlist. Please try again.');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Import from Spotify</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Important Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-yellow-300 font-medium mb-2">Important Notice</h3>
                <ul className="text-yellow-200 text-sm space-y-1">
                  <li>• Only 30-second previews are available through Spotify API</li>
                  <li>• This is a demonstration of integration concepts</li>
                  <li>• Full implementation requires proper Spotify API credentials</li>
                  <li>• Always respect copyright and Spotify's Terms of Service</li>
                </ul>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spotify Playlist URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <button
                onClick={handleImport}
                disabled={loading || !playlistUrl.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Import</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* How to Use */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">How to use:</h3>
            <ol className="text-gray-300 text-sm space-y-2">
              <li>1. Go to Spotify and find a public playlist</li>
              <li>2. Click "Share" → "Copy link to playlist"</li>
              <li>3. Paste the URL above and click Import</li>
              <li>4. Preview tracks will be added to your library</li>
            </ol>
          </div>

          {/* Alternative Methods */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-3">Alternative Methods</h3>
            <div className="text-blue-200 text-sm space-y-2">
              <p><strong>spotdl (Backend Required):</strong></p>
              <code className="block bg-black/30 p-2 rounded text-xs font-mono">
                pip install spotdl<br/>
                spotdl download "https://open.spotify.com/playlist/xyz"
              </code>
              <p className="text-xs text-blue-300 mt-2">
                Note: This requires a backend server and proper licensing considerations.
              </p>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-300 font-medium mb-2">Legal Considerations</h3>
            <p className="text-red-200 text-sm">
              Always ensure you have proper rights to download and use music. 
              Support artists by purchasing music through official channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyImporter;