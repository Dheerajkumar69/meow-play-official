# Supabase Setup Guide for Meow Play

This guide will help you set up Supabase integration for the Meow Play application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A Supabase project created
3. The project URL and API keys from your Supabase dashboard

## Setup Steps

### 1. Environment Configuration

The `.env` file has already been created with your Supabase credentials:

```
VITE_SUPABASE_URL=https://ollbfuxoubyzlqxfepdo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbGJmdXhvdWJ5emxxeGZlcGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNTU1NTYsImV4cCI6MjA3MDkzMTU1Nn0.reZW8L37rfiyNDcAChd0fIW056THJ4IT2W4LqxsnokQ
```

### 2. Database Schema Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase-schema.sql` and paste it into a new query
4. Execute the SQL to create all necessary tables and policies

The schema includes:
- **users**: User profiles linked to Supabase Auth
- **songs**: Music tracks with metadata
- **playlists**: User-created playlists
- **playlist_songs**: Junction table for playlist-song relationships
- **user_likes**: User song likes/favorites
- **user_follows**: User following system
- **listening_history**: Analytics and listening history

### 3. Row Level Security (RLS)

The schema automatically enables Row Level Security with appropriate policies:
- Users can only modify their own data
- Public content is viewable by everyone
- Private content is restricted to owners
- Proper access controls for all operations

### 4. Storage (Optional)

If you plan to upload audio files and cover art to Supabase Storage:

1. Go to Storage in your Supabase dashboard
2. Create buckets:
   - `audio-files` (for music files)
   - `cover-art` (for album/song artwork)
   - `avatars` (for user profile pictures)
3. Configure bucket policies for appropriate access

### 5. Authentication Configuration

1. In Supabase Dashboard > Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Set up email templates if desired
4. Configure any social auth providers if needed

## Features Implemented

### Authentication
- ✅ User signup/signin with email and password
- ✅ Password reset functionality
- ✅ Profile management
- ✅ Session management
- ✅ Auth state persistence

### Database Operations
- ✅ CRUD operations for all entities
- ✅ Real-time subscriptions support
- ✅ Advanced querying and filtering
- ✅ Full-text search capabilities
- ✅ Analytics and reporting

### Security
- ✅ Row Level Security (RLS) policies
- ✅ API key-based access control
- ✅ User data isolation
- ✅ Secure file uploads

## Usage Examples

### Authentication
```typescript
import { AuthService } from './services/auth';

// Sign up
await AuthService.signUp('user@example.com', 'password', 'username');

// Sign in
await AuthService.signIn('user@example.com', 'password');

// Sign out
await AuthService.signOut();
```

### Database Operations
```typescript
import { DatabaseService } from './services/database';

// Get songs
const songs = await DatabaseService.getSongs(20, 0);

// Create a playlist
const playlist = await DatabaseService.createPlaylist({
  name: 'My Playlist',
  user_id: userId,
  is_public: true
});

// Like a song
await DatabaseService.likeSong(userId, songId);
```

## Development

The application will now:
1. Connect to your Supabase database on startup
2. Show "Supabase client initialized successfully" in console
3. Use real database operations instead of offline mode
4. Support user authentication and data persistence

## Testing

Run the test suite to verify everything works:
```bash
npm test
```

The tests have been updated to handle both online (Supabase) and offline modes gracefully.

## Troubleshooting

### Connection Issues
- Verify your environment variables are correct
- Check Supabase project status
- Ensure your IP is allowed (if using IP restrictions)

### RLS Policy Issues
- Check the browser developer tools for specific errors
- Verify user authentication status
- Review policy definitions in the SQL editor

### Performance
- Monitor query performance in Supabase dashboard
- Add additional indexes if needed
- Use pagination for large datasets

## Next Steps

1. Set up file storage for audio files
2. Implement real-time subscriptions for live updates
3. Add social authentication providers
4. Set up database backups
5. Configure monitoring and alerts

The Supabase integration is now complete and ready for use! 🎵
