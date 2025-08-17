# Meow Play - AI Development Instructions

This document guides AI agents in understanding and working with the Meow Play music player application.

## Project Overview

Meow Play is a React-based music player application with offline-first capabilities, built using:
- Vite + React + TypeScript
- Tailwind CSS for styling
- Supabase for cloud storage (with offline fallback)
- IndexedDB for local storage
- Vitest for testing

## Core Architecture

### State Management
- Global state is managed through React Context (`src/contexts/`)
  - `MusicContext.tsx`: Core music playback state and controls
  - `AuthContext.tsx`: User authentication state

### Data Flow
1. Music data is stored in both Supabase (cloud) and IndexedDB (local)
2. `sharedDatabase.ts` handles sync between local and cloud storage
3. Components subscribe to contexts for real-time updates
4. Audio playback is managed through `MusicContext` using HTML5 Audio API

### Key Components
- `src/components/PlayerBar.tsx`: Main playback controls
- `src/components/Layout.tsx`: App structure and navigation
- `src/pages/`: Route-level components with page-specific logic
- `src/services/api.ts`: API client for external services

## Development Workflow

### Setup & Running
```bash
npm install
npm run dev     # Start development server
npm run test    # Run tests
npm run build   # Production build
```

### Testing
- Test files are co-located with components (`*.test.tsx`)
- Use Vitest's expect API for assertions
- Example: `src/test/components/SongCard.test.tsx`

## Project Conventions

### File Organization
- Feature-first organization within `src/`
- Shared utilities in `src/utils/`
- Type definitions in `src/types/`

### State Management
- Use contexts for global state
- Use hooks for shared component logic
- Prefer local state for UI-only concerns

### Error Handling
- Use `ErrorBoundary` component for React errors
- Network errors handled in `services/api.ts`
- Offline mode fallbacks in `utils/offlineAuth.ts`

### TypeScript Patterns
- Define shared types in `types/index.ts`
- Use strict type checking
- Prefer interfaces for object types

## Common Tasks

### Adding a New Feature
1. Add types to `src/types/index.ts`
2. Create components in appropriate directory
3. Add to routing if needed (`App.tsx`)
4. Include tests in adjacent `.test.tsx` file

### Working with Audio
- Audio operations go through `MusicContext`
- Support crossfade and equalizer effects
- Handle multiple audio sources via `musicSources.ts`

### Database & Storage Operations

Database:
- Check `isSupabaseConfigured()` before cloud operations
- Use `sharedDatabase.ts` methods for data sync
- IndexedDB operations through `indexedDB.ts`

File Storage:
- Songs are stored in `public/songs/` directory
- Metadata is tracked in `public/songs/songs.json`
- File operations through `songStorage.ts` API:
  ```typescript
  const songStorage = SongStorageManager.getInstance();
  await songStorage.storeSong(file, metadata);
  await songStorage.getSongMetadata(id);
  await songStorage.getAllSongMetadata();
  ```
- Files are renamed with timestamp and UUID to prevent collisions
- REST API endpoints available at `/api/songs/`
  - POST `/api/songs/upload` for file uploads
  - GET `/api/songs/metadata` for song listing
  - GET `/api/songs/{id}` for single song details
  - DELETE `/api/songs/{id}` for removal
