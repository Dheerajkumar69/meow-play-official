/**
 * User Profile Management Component
 */
import React, { useState, useRef } from 'react';
import { User, Upload, Camera, Save, X, Edit3, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { updateUserProfile, uploadAvatar } from '../store/slices/userSlice';
import { addToast } from '../store/slices/uiSlice';
import { validationSchemas } from '../utils/validationSchemas';
import { sanitizationService } from '../utils/sanitization';

interface UserProfileProps {
  onClose?: () => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  onClose,
  className 
}) => {
  const dispatch = useAppDispatch();
  const { currentUser, isLoading } = useAppSelector(state => state.user);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    // Sanitize input
    const sanitizedValue = sanitizationService.sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      dispatch(addToast({
        type: 'error',
        message: 'Please select a valid image file (JPEG, PNG, or WebP)'
      }));
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      dispatch(addToast({
        type: 'error',
        message: 'Image size must be less than 5MB'
      }));
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate username
    try {
      validationSchemas.username.parse(formData.username);
    } catch (error: any) {
      newErrors.username = error.errors?.[0]?.message || 'Invalid username';
    }

    // Validate bio if provided
    if (formData.bio) {
      try {
        validationSchemas.bio.parse(formData.bio);
      } catch (error: any) {
        newErrors.bio = error.errors?.[0]?.message || 'Invalid bio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!currentUser || !validateForm()) return;

    try {
      // Upload avatar first if changed
      if (avatarFile) {
        await dispatch(uploadAvatar(avatarFile)).unwrap();
      }

      // Update profile
      await dispatch(updateUserProfile({
        username: formData.username,
        bio: formData.bio || undefined,
      })).unwrap();

      dispatch(addToast({
        type: 'success',
        message: 'Profile updated successfully!'
      }));

      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        message: error.message || 'Failed to update profile'
      }));
    }
  };

  const handleCancel = () => {
    setFormData({
      username: currentUser?.username || '',
      bio: currentUser?.bio || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrors({});
    setIsEditing(false);
  };

  if (!currentUser) {
    return (
      <div className={`user-profile ${className || ''}`}>
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="text-center text-gray-400">
            <User className="w-12 h-12 mx-auto mb-4" />
            <p>Please log in to view your profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`user-profile ${className || ''}`}>
      <div className="bg-gray-900 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <User className="w-6 h-6 mr-2 text-purple-400" />
            My Profile
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                  {avatarPreview || currentUser.avatar ? (
                    <img 
                      src={avatarPreview || currentUser.avatar} 
                      alt={currentUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && handleAvatarSelect(e.target.files[0])}
                className="hidden"
              />
              
              {isEditing && (
                <p className="text-sm text-gray-400 mt-2">
                  Click the camera icon to change your avatar
                  <br />
                  Max size: 5MB (JPEG, PNG, WebP)
                </p>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="md:col-span-2 space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.username ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Enter your username"
                    maxLength={30}
                  />
                  {errors.username && (
                    <div className="flex items-center mt-1 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.username}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-white text-lg">{currentUser.username}</span>
                  {currentUser.isAdmin && (
                    <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                      Admin
                    </span>
                  )}
                  {currentUser.isArtist && (
                    <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      Artist
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="flex items-center">
                <span className="text-gray-400">{currentUser.email}</span>
                <CheckCircle className="w-4 h-4 ml-2 text-green-400" />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              {isEditing ? (
                <div>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                      errors.bio ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      {errors.bio && (
                        <div className="flex items-center text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.bio}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formData.bio.length}/500
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-300">
                  {currentUser.bio || (
                    <span className="text-gray-500 italic">No bio added yet</span>
                  )}
                </div>
              )}
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {currentUser.createdAt ? 
                    Math.floor((Date.now() - new Date(currentUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
                    : 0
                  }
                </div>
                <div className="text-sm text-gray-400">Days Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {currentUser.followers?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Followers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning for Profile Changes */}
        {isEditing && (
          <div className="mt-6 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium mb-1">Profile Update Notice:</p>
                <ul className="space-y-1 text-yellow-300">
                  <li>• Username changes may affect how others find you</li>
                  <li>• Profile changes are visible to all users</li>
                  <li>• Avatar images are automatically resized and optimized</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
