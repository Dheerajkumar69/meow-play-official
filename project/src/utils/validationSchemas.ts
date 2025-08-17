import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long')
});

export const registrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email too long'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
});

export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Song validation schemas
export const songUploadSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .trim(),
  artist: z
    .string()
    .min(1, 'Artist is required')
    .max(100, 'Artist name too long')
    .trim(),
  album: z
    .string()
    .max(100, 'Album name too long')
    .optional(),
  genre: z
    .string()
    .max(50, 'Genre too long')
    .optional(),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be after 1900')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),
  lyrics: z
    .string()
    .max(10000, 'Lyrics too long')
    .optional(),
  isPublic: z.boolean().default(true)
});

export const songMetadataSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(100),
  album: z.string().max(100).optional(),
  genre: z.string().max(50).optional(),
  duration: z.number().positive(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  tempo: z.number().positive().optional(),
  key: z.string().max(10).optional()
});

// Playlist validation schemas
export const playlistCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required')
    .max(100, 'Playlist name too long')
    .trim(),
  description: z
    .string()
    .max(500, 'Description too long')
    .optional(),
  isPublic: z.boolean().default(false),
  isCollaborative: z.boolean().default(false)
});

export const playlistUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required')
    .max(100, 'Playlist name too long')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description too long')
    .optional(),
  isPublic: z.boolean().optional(),
  isCollaborative: z.boolean().optional()
});

// Comment validation schemas
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment too long')
    .trim(),
  songId: z.string().uuid('Invalid song ID'),
  parentId: z.string().uuid().optional() // For replies
});

// Search validation schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .trim(),
  type: z.enum(['songs', 'artists', 'albums', 'playlists', 'users']).default('songs'),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0)
});

// Profile validation schemas
export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio too long')
    .optional(),
  isArtist: z.boolean().optional()
});

// File validation schemas
export const audioFileSchema = z.object({
  file: z.instanceof(File),
  size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'), // 50MB limit
  type: z.string().refine(
    (type) => ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac'].includes(type),
    'Invalid audio file type'
  )
});

export const imageFileSchema = z.object({
  file: z.instanceof(File),
  size: z.number().max(5 * 1024 * 1024, 'Image size must be less than 5MB'), // 5MB limit
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
    'Invalid image file type'
  )
});

// API validation schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export const sortSchema = z.object({
  sortBy: z.enum(['created_at', 'updated_at', 'play_count', 'likes_count', 'title', 'artist']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Validation helper functions
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
};

export const validateFile = (file: File, maxSize: number, allowedTypes: string[]): void => {
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
};

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type SongUploadInput = z.infer<typeof songUploadSchema>;
export type PlaylistCreateInput = z.infer<typeof playlistCreateSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
