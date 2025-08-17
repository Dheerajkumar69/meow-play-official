import React, { useEffect } from 'react';
import { useMusic } from '../contexts/MusicContext';
import { useNavigate } from 'react-router-dom';

const KeyboardShortcuts: React.FC = () => {
  const { togglePlay, nextSong, prevSong, setVolume, volume } = useMusic();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = ['Space', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];
      if (shortcuts.includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'Space':
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            nextSong();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            prevSong();
          }
          break;
        case 'ArrowUp':
          if (e.shiftKey) {
            setVolume(Math.min(1, volume + 0.1));
          }
          break;
        case 'ArrowDown':
          if (e.shiftKey) {
            setVolume(Math.max(0, volume - 0.1));
          }
          break;
        case 'KeyH':
          if (e.ctrlKey || e.metaKey) {
            navigate('/');
          }
          break;
        case 'KeyS':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigate('/search');
          }
          break;
        case 'KeyL':
          if (e.ctrlKey || e.metaKey) {
            navigate('/library');
          }
          break;
        case 'KeyU':
          if (e.ctrlKey || e.metaKey) {
            navigate('/upload');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, nextSong, prevSong, setVolume, volume, navigate]);

  return null; // This component only handles keyboard events
};

export default KeyboardShortcuts;