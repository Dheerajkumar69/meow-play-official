import { useEffect } from 'react';
import { useMusic } from '../contexts/MusicContext';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const { togglePlay, nextSong, prevSong, setVolume, volume } = useMusic();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if modifier keys are pressed (except for our specific combos)
      if (e.altKey && !['KeyH', 'KeyS', 'KeyL', 'KeyU'].includes(e.code)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault();
            nextSong();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            e.preventDefault();
            prevSong();
          }
          break;
        case 'ArrowUp':
          if (e.shiftKey) {
            e.preventDefault();
            setVolume(Math.min(1, volume + 0.1));
          }
          break;
        case 'ArrowDown':
          if (e.shiftKey) {
            e.preventDefault();
            setVolume(Math.max(0, volume - 0.1));
          }
          break;
        case 'KeyH':
          if (e.altKey) {
            e.preventDefault();
            navigate('/');
          }
          break;
        case 'KeyS':
          if (e.altKey) {
            e.preventDefault();
            navigate('/search');
          }
          break;
        case 'KeyL':
          if (e.altKey) {
            e.preventDefault();
            navigate('/library');
          }
          break;
        case 'KeyU':
          if (e.altKey) {
            e.preventDefault();
            navigate('/upload');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, nextSong, prevSong, setVolume, volume, navigate]);
};

export default useKeyboardShortcuts;