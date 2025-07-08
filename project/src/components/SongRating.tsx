import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Song } from '../types';

interface SongRatingProps {
  song: Song;
  onRate?: (rating: number) => void;
}

const SongRating: React.FC<SongRatingProps> = ({ song, onRate }) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userRating, setUserRating] = useState(song.rating || 0);

  const handleRate = (rating: number) => {
    setUserRating(rating);
    onRate?.(rating);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                star <= (hoveredRating || userRating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-400'
              }`}
            />
          </button>
        ))}
      </div>
      
      {song.averageRating && (
        <div className="flex items-center space-x-1 text-sm text-gray-400">
          <span>{song.averageRating.toFixed(1)}</span>
          <span>({song.totalRatings})</span>
        </div>
      )}
    </div>
  );
};

export default SongRating;