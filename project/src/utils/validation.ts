import { z } from 'zod';

/**
 * Comprehensive validation schemas for security and type safety
 */

// Base validation patterns
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const PASSWORD_MIN_LENGTH = 8;
const SAFE_STRING_REGEX = /^[a-zA-Z0-9\s\-_.,!?'"()]+$/;

// User validation schemas
export const userIdSchema = z.string().uuid('Invalid user ID format');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, underscores, and hyphens')
  .toLowerCase()
  .transform(val => val.trim());

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(320, 'Email must not exceed 320 characters')
  .toLowerCase()
  .transform(val => val.trim());

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const safeStringSchema = z
  .string()
  .max(1000, 'Input too long')
  .regex(SAFE_STRING_REGEX, 'Input contains invalid characters')
  .transform(val => val.trim());

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Song validation schemas
export const songIdSchema = z.string().uuid('Invalid song ID format');

export const songTitleSchema = z
  .string()
  .min(1, 'Song title is required')
  .max(200, 'Song title must not exceed 200 characters')
  .regex(SAFE_STRING_REGEX, 'Song title contains invalid characters')
  .transform(val => val.trim());

export const artistNameSchema = z
  .string()
  .min(1, 'Artist name is required')
  .max(100, 'Artist name must not exceed 100 characters')
  .regex(SAFE_STRING_REGEX, 'Artist name contains invalid characters')
  .transform(val => val.trim());

export const albumNameSchema = z
  .string()
  .max(200, 'Album name must not exceed 200 characters')
  .regex(SAFE_STRING_REGEX, 'Album name contains invalid characters')
  .transform(val => val.trim())
  .optional();

export const durationSchema = z
  .number()
  .positive('Duration must be positive')
  .max(7200, 'Duration must not exceed 2 hours') // 2 hours max
  .finite('Duration must be a valid number');

export const genreSchema = z
  .array(z.string().max(50).regex(/^[a-zA-Z0-9\s-]+$/))
  .max(5, 'Maximum 5 genres allowed')
  .optional();

export const moodSchema = z
  .array(z.string().max(30).regex(/^[a-zA-Z0-9\s-]+$/))
  .max(3, 'Maximum 3 moods allowed')
  .optional();

// Upload validation schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    file => {
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac'];
      return allowedTypes.includes(file.type);
    },
    'Only MP3, WAV, FLAC, and AAC files are allowed'
  ).refine(
    file => file.size <= 100 * 1024 * 1024, // 100MB max
    'File size must not exceed 100MB'
  ),
  metadata: z.object({
    title: songTitleSchema,
    artist: artistNameSchema,
    album: albumNameSchema,
    genre: genreSchema,
    mood: moodSchema,
    isPublic: z.boolean().default(true),
    tags: z.array(z.string().max(30)).max(10).optional(),
  }),
});

// Playlist validation schemas
export const playlistIdSchema = z.string().uuid('Invalid playlist ID format');

export const playlistNameSchema = z
  .string()
  .min(1, 'Playlist name is required')
  .max(100, 'Playlist name must not exceed 100 characters')
  .regex(SAFE_STRING_REGEX, 'Playlist name contains invalid characters')
  .transform(val => val.trim());

export const playlistDescriptionSchema = z
  .string()
  .max(500, 'Playlist description must not exceed 500 characters')
  .regex(SAFE_STRING_REGEX, 'Playlist description contains invalid characters')
  .transform(val => val.trim())
  .optional();

export const createPlaylistSchema = z.object({
  name: playlistNameSchema,
  description: playlistDescriptionSchema,
  isPublic: z.boolean().default(true),
  isCollaborative: z.boolean().default(false),
  songs: z.array(songIdSchema).max(1000, 'Playlist cannot exceed 1000 songs').optional(),
});

// Search validation schemas
export const searchQuerySchema = z
  .string()
  .min(1, 'Search query is required')
  .max(100, 'Search query must not exceed 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_.'"!?]+$/, 'Search query contains invalid characters')
  .transform(val => val.trim());

export const searchFiltersSchema = z.object({
  query: searchQuerySchema,
  type: z.array(z.enum(['songs', 'playlists', 'albums', 'users'])).optional(),
  genre: z.array(z.string().max(50)).max(10).optional(),
  mood: z.array(z.string().max(30)).max(5).optional(),
  duration: z.object({
    min: z.number().min(0).max(7200).optional(),
    max: z.number().min(0).max(7200).optional(),
  }).optional(),
  uploadDate: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }).optional(),
  sortBy: z.enum(['relevance', 'newest', 'oldest', 'mostPlayed', 'mostLiked']).optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().positive('Page must be a positive integer').max(1000, 'Page number too high'),
  limit: z.number().int().positive('Limit must be positive').min(1).max(100, 'Limit cannot exceed 100'),
});

// URL validation
export const urlSchema = z.string().url('Invalid URL format').max(2000, 'URL too long');

export const imageUrlSchema = z
  .string()
  .url('Invalid image URL')
  .refine(
    url => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const urlPath = new URL(url).pathname.toLowerCase();
      return allowedExtensions.some(ext => urlPath.endsWith(ext));
    },
    'Image must be JPG, PNG, WebP, or GIF format'
  )
  .optional();

// Volume validation
export const volumeSchema = z.number().min(0, 'Volume cannot be negative').max(1, 'Volume cannot exceed 1').finite();

// Theme validation
export const themeSchema = z.enum(['light', 'dark', 'system']);

// User preferences validation
export const userPreferencesSchema = z.object({
  theme: themeSchema,
  autoplay: z.boolean(),
  volume: volumeSchema,
  quality: z.enum(['low', 'medium', 'high', 'lossless']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    newFollowers: z.boolean(),
    newReleases: z.boolean(),
    recommendations: z.boolean(),
  }),
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  action: z.string().min(1).max(50),
  timestamp: z.number().positive(),
  userId: userIdSchema.optional(),
  ip: z.string().ip().optional(),
});

// API response validation
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    success: z.boolean(),
    message: z.string().optional(),
    errors: z.array(z.object({
      code: z.string(),
      message: z.string(),
      field: z.string().optional(),
      details: z.record(z.unknown()).optional(),
    })).optional(),
    metadata: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
      hasMore: z.boolean().optional(),
      timestamp: z.string().optional(),
    }).optional(),
  });

// Validation helper functions
export const validateAndSanitize = <T>(schema: z.ZodType<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(formattedError)}`);
    }
    throw error;
  }
};

export const safeValidate = <T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
};

// Type inference helpers
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
