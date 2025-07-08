import React, { useState } from 'react';
import { MessageCircle, Heart, Send, MoreHorizontal } from 'lucide-react';
import { Comment } from '../types';
import { mockComments } from '../utils/mockData';

interface SongCommentsProps {
  songId: string;
  isOpen: boolean;
  onClose: () => void;
}

const SongComments: React.FC<SongCommentsProps> = ({ songId, isOpen, onClose }) => {
  const [comments, setComments] = useState<Comment[]>(mockComments.filter(c => c.songId === songId));
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: '1',
      username: 'You',
      songId,
      content: newComment,
      createdAt: new Date(),
      likes: 0
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Comments</h2>
            <span className="text-gray-400">({comments.length})</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                {comment.avatar ? (
                  <img src={comment.avatar} alt={comment.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {comment.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-white font-medium">{comment.username}</span>
                  <span className="text-gray-400 text-sm">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs">{comment.likes}</span>
                  </button>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="p-6 border-t border-white/10">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">Y</span>
            </div>
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SongComments;