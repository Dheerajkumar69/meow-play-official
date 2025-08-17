-- 🐱 ================================================================
-- MEOW PLAY - COMPLETE CAT-THEMED SUPABASE DATABASE SETUP
-- The purrfect music streaming database for cat lovers!
-- This script does EVERYTHING - run once and your cat colony is ready!
-- 🐱 ================================================================

-- 🧹 CLEAN SLATE: Drop existing tables if they exist (fresh start)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Enable required extensions for our cat colony
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable Row Level Security by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC GRANT EXECUTE ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ================================================================
-- TABLES
-- ================================================================

-- 🐾 Cat profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    favorite_cat_breed TEXT DEFAULT 'Persian',
    purr_level INTEGER DEFAULT 1 CHECK (purr_level >= 1 AND purr_level <= 10),
    is_artist BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    cat_coins INTEGER DEFAULT 100, -- Virtual currency for cat-themed rewards
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- 🎵 Purrfect songs table
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    genre VARCHAR(100),
    duration INTEGER NOT NULL, -- in seconds
    file_url TEXT NOT NULL,
    cover_art_url TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    play_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    total_ratings INTEGER DEFAULT 0,
    lyrics TEXT,
    mood TEXT[], -- array of mood tags like 'playful', 'sleepy', 'hunting'
    tempo INTEGER, -- BPM
    key VARCHAR(10), -- musical key
    year INTEGER,
    is_public BOOLEAN DEFAULT TRUE,
    cat_rating INTEGER DEFAULT 5 CHECK (cat_rating >= 1 AND cat_rating <= 10),
    is_cat_approved BOOLEAN DEFAULT false,
    purr_factor DECIMAL(3,2) DEFAULT 5.0, -- How much cats love this song
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 📋 Cat playlist collections
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_art_url TEXT,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    is_collaborative BOOLEAN DEFAULT FALSE,
    playlist_mood TEXT DEFAULT 'playful' CHECK (playlist_mood IN ('playful', 'sleepy', 'hunting', 'cuddly', 'energetic')),
    cat_theme TEXT DEFAULT 'general' CHECK (cat_theme IN ('general', 'kitten_vibes', 'lazy_cat', 'wild_cat', 'house_cat')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Playlist songs junction table
CREATE TABLE IF NOT EXISTS public.playlist_songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(playlist_id, song_id)
);

-- User likes table
CREATE TABLE IF NOT EXISTS public.user_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, song_id)
);

-- User follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- 🎧 Cat listening history table
CREATE TABLE IF NOT EXISTS public.listening_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    play_duration INTEGER NOT NULL, -- seconds listened
    listening_context TEXT DEFAULT 'normal' CHECK (listening_context IN ('normal', 'party', 'playlist', 'radio')),
    cat_mood_during_play TEXT DEFAULT 'content' CHECK (cat_mood_during_play IN ('content', 'excited', 'sleepy', 'playful', 'grumpy'))
);

-- 🎉 PHASE 5: Live Listening Parties for Cat Music Sessions
CREATE TABLE IF NOT EXISTS public.listening_parties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    current_song_id UUID REFERENCES public.songs(id),
    current_position INTEGER DEFAULT 0, -- Current playback position in seconds
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 50,
    party_theme TEXT DEFAULT 'general' CHECK (party_theme IN ('general', 'jazz_cats', 'rock_cats', 'classical_cats', 'pop_cats', 'kitten_party')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 👥 PHASE 5: Party Participants (Cat Colony Members)
CREATE TABLE IF NOT EXISTS public.party_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES public.listening_parties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_host BOOLEAN DEFAULT false,
    cat_status TEXT DEFAULT 'listening' CHECK (cat_status IN ('listening', 'dancing', 'napping', 'purring')),
    UNIQUE(party_id, user_id)
);

-- 💬 PHASE 5: Party Chat Messages
CREATE TABLE IF NOT EXISTS public.party_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES public.listening_parties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'cat_reaction', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 📰 PHASE 5: Activity Feed for Cat Social Network
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('song_play', 'song_like', 'song_upload', 'playlist_create', 'user_follow', 'party_join', 'cat_achievement')),
    target_id UUID, -- Can reference songs, playlists, users, or parties
    metadata JSONB DEFAULT '{}',
    cat_reaction TEXT DEFAULT 'neutral' CHECK (cat_reaction IN ('excited', 'happy', 'content', 'sleepy', 'playful', 'neutral')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 💬 PHASE 5: Chat Rooms for Cat Discussions
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    room_type TEXT DEFAULT 'public' CHECK (room_type IN ('public', 'private', 'genre', 'cat_breed')),
    genre TEXT, -- For genre-specific rooms
    cat_breed TEXT, -- For breed-specific cat discussions
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 100,
    room_mood TEXT DEFAULT 'friendly' CHECK (room_mood IN ('friendly', 'chill', 'energetic', 'cozy', 'playful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 💬 PHASE 5: Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'image', 'song_share', 'cat_gif')),
    reply_to_id UUID REFERENCES public.chat_messages(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 👥 PHASE 5: Chat Room Members
CREATE TABLE IF NOT EXISTS public.chat_room_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'cat_whisperer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    cat_nickname TEXT, -- Fun cat-themed nickname in the room
    UNIQUE(room_id, user_id)
);

-- 👁️ PHASE 5: User Presence (Online Cat Status)
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'napping', 'hunting', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    current_activity TEXT, -- What the cat is currently doing
    listening_to_song_id UUID REFERENCES public.songs(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 🚀 ================================================================
-- INDEXES FOR PURRFECT PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_songs_uploaded_by ON public.songs(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON public.songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON public.songs(created_at);
CREATE INDEX IF NOT EXISTS idx_songs_is_public ON public.songs(is_public);
CREATE INDEX IF NOT EXISTS idx_songs_title_artist ON public.songs(title, artist);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON public.playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_song_id ON public.playlist_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON public.user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_song_id ON public.user_likes(song_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON public.listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON public.listening_history(played_at);

-- PHASE 5 Cat Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_parties_active ON public.listening_parties(is_active);
CREATE INDEX IF NOT EXISTS idx_listening_parties_host ON public.listening_parties(host_id);
CREATE INDEX IF NOT EXISTS idx_party_participants_party ON public.party_participants(party_id);
CREATE INDEX IF NOT EXISTS idx_party_participants_user ON public.party_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_party_messages_party ON public.party_messages(party_id);
CREATE INDEX IF NOT EXISTS idx_party_messages_created ON public.party_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON public.chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON public.chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_songs_cat_rating ON public.songs(cat_rating);
CREATE INDEX IF NOT EXISTS idx_songs_purr_factor ON public.songs(purr_factor);
CREATE INDEX IF NOT EXISTS idx_playlists_mood ON public.playlists(playlist_mood);
CREATE INDEX IF NOT EXISTS idx_playlists_cat_theme ON public.playlists(cat_theme);

-- 🐾 ================================================================
-- CAT-TASTIC FUNCTIONS & TRIGGERS
-- ================================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_songs_updated_at
    BEFORE UPDATE ON public.songs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_playlists_updated_at
    BEFORE UPDATE ON public.playlists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_listening_parties_updated_at
    BEFORE UPDATE ON public.listening_parties
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_presence_updated_at
    BEFORE UPDATE ON public.user_presence
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to increment play count and purr factor
CREATE OR REPLACE FUNCTION public.increment_play_count(song_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.songs 
    SET play_count = play_count + 1,
        purr_factor = LEAST(purr_factor + 0.01, 10.0), -- Increase purr factor slightly
        updated_at = NOW()
    WHERE id = song_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award cat coins for activities
CREATE OR REPLACE FUNCTION public.award_cat_coins(user_id UUID, coins INTEGER, reason TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET cat_coins = cat_coins + coins,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Log the activity
    INSERT INTO public.activity_feed (user_id, activity_type, metadata)
    VALUES (user_id, 'cat_achievement', jsonb_build_object('coins_earned', coins, 'reason', reason));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PHASE 5: Real-time notification functions
CREATE OR REPLACE FUNCTION notify_activity_feed()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('activity_feed', json_build_object(
        'user_id', NEW.user_id,
        'activity_type', NEW.activity_type,
        'target_id', NEW.target_id,
        'cat_reaction', NEW.cat_reaction,
        'created_at', NEW.created_at
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify party messages
    IF TG_TABLE_NAME = 'party_messages' THEN
        PERFORM pg_notify('party_message', json_build_object(
            'party_id', NEW.party_id,
            'user_id', NEW.user_id,
            'message', NEW.message,
            'message_type', NEW.message_type,
            'created_at', NEW.created_at
        )::text);
    END IF;
    
    -- Notify chat messages
    IF TG_TABLE_NAME = 'chat_messages' THEN
        PERFORM pg_notify('chat_message', json_build_object(
            'room_id', NEW.room_id,
            'user_id', NEW.user_id,
            'message', NEW.message,
            'message_type', NEW.message_type,
            'created_at', NEW.created_at
        )::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PHASE 5: Real-time triggers (now that functions are defined)
CREATE TRIGGER activity_feed_notify AFTER INSERT ON public.activity_feed
    FOR EACH ROW EXECUTE FUNCTION notify_activity_feed();

CREATE TRIGGER party_message_notify AFTER INSERT ON public.party_messages
    FOR EACH ROW EXECUTE FUNCTION notify_new_message();

CREATE TRIGGER chat_message_notify AFTER INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 🛡️ ================================================================
-- CAT SECURITY POLICIES (RLS) - PROTECTING OUR CAT COLONY
-- ================================================================

-- Users table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All cat profiles are viewable by everyone" ON public.users;
CREATE POLICY "All cat profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Cats can create their own profile" ON public.users;
CREATE POLICY "Cats can create their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Cats can update their own profile" ON public.users;
CREATE POLICY "Cats can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Songs table RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Purrfect songs are viewable by all cats" ON public.songs;
CREATE POLICY "Purrfect songs are viewable by all cats" 
ON public.songs FOR SELECT 
USING (is_public = true OR auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Authenticated users can insert songs" ON public.songs;
CREATE POLICY "Authenticated users can insert songs" 
ON public.songs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can update their own songs" ON public.songs;
CREATE POLICY "Users can update their own songs" 
ON public.songs FOR UPDATE 
USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can delete their own songs" ON public.songs;
CREATE POLICY "Users can delete their own songs" 
ON public.songs FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Playlists table RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public playlists are viewable by everyone" ON public.playlists;
CREATE POLICY "Public playlists are viewable by everyone" 
ON public.playlists FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create playlists" ON public.playlists;
CREATE POLICY "Authenticated users can create playlists" 
ON public.playlists FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own playlists" ON public.playlists;
CREATE POLICY "Users can update their own playlists" 
ON public.playlists FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own playlists" ON public.playlists;
CREATE POLICY "Users can delete their own playlists" 
ON public.playlists FOR DELETE 
USING (auth.uid() = user_id);

-- Playlist songs RLS
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Playlist songs are viewable if playlist is accessible" ON public.playlist_songs;
CREATE POLICY "Playlist songs are viewable if playlist is accessible" 
ON public.playlist_songs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.playlists 
        WHERE id = playlist_id 
        AND (is_public = true OR user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can add songs to their playlists" ON public.playlist_songs;
CREATE POLICY "Users can add songs to their playlists" 
ON public.playlist_songs FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.playlists 
        WHERE id = playlist_id 
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can remove songs from their playlists" ON public.playlist_songs;
CREATE POLICY "Users can remove songs from their playlists" 
ON public.playlist_songs FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.playlists 
        WHERE id = playlist_id 
        AND user_id = auth.uid()
    )
);

-- User likes RLS
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own likes" ON public.user_likes;
CREATE POLICY "Users can view their own likes" 
ON public.user_likes FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can like songs" ON public.user_likes;
CREATE POLICY "Users can like songs" 
ON public.user_likes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike songs" ON public.user_likes;
CREATE POLICY "Users can unlike songs" 
ON public.user_likes FOR DELETE 
USING (auth.uid() = user_id);

-- User follows RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view follows" ON public.user_follows;
CREATE POLICY "Users can view follows" 
ON public.user_follows FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.user_follows;
CREATE POLICY "Users can follow others" 
ON public.user_follows FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow others" ON public.user_follows;
CREATE POLICY "Users can unfollow others" 
ON public.user_follows FOR DELETE 
USING (auth.uid() = follower_id);

-- Listening history RLS
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own listening history" ON public.listening_history;
CREATE POLICY "Users can view their own listening history" 
ON public.listening_history FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to their listening history" ON public.listening_history;
CREATE POLICY "Users can add to their listening history" 
ON public.listening_history FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Add PHASE 5 RLS Policies for new tables

-- Activity Feed Policies
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cats can view activity from followed users" ON public.activity_feed;
CREATE POLICY "Cats can view activity from followed users" ON public.activity_feed
FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.user_follows 
        WHERE follower_id = auth.uid() AND following_id = user_id
    )
);

DROP POLICY IF EXISTS "Cats can create own activity" ON public.activity_feed;
CREATE POLICY "Cats can create own activity" ON public.activity_feed
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listening Parties Policies
ALTER TABLE public.listening_parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All cats can view active parties" ON public.listening_parties;
CREATE POLICY "All cats can view active parties" ON public.listening_parties
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated cats can create parties" ON public.listening_parties;
CREATE POLICY "Authenticated cats can create parties" ON public.listening_parties
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Party hosts can update own parties" ON public.listening_parties;
CREATE POLICY "Party hosts can update own parties" ON public.listening_parties
FOR UPDATE USING (auth.uid() = host_id);

-- Party Participants Policies
ALTER TABLE public.party_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All cats can view party participants" ON public.party_participants;
CREATE POLICY "All cats can view party participants" ON public.party_participants
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cats can join/leave parties" ON public.party_participants;
CREATE POLICY "Cats can join/leave parties" ON public.party_participants
FOR ALL USING (auth.uid() = user_id);

-- Party Messages Policies
ALTER TABLE public.party_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Party cats can view messages" ON public.party_messages;
CREATE POLICY "Party cats can view messages" ON public.party_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.party_participants 
        WHERE party_id = party_messages.party_id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Party cats can send messages" ON public.party_messages;
CREATE POLICY "Party cats can send messages" ON public.party_messages
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.party_participants 
        WHERE party_id = party_messages.party_id AND user_id = auth.uid()
    )
);

-- Chat Rooms Policies
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All cats can view public chat rooms" ON public.chat_rooms;
CREATE POLICY "All cats can view public chat rooms" ON public.chat_rooms
FOR SELECT USING (
    room_type = 'public' OR
    EXISTS (
        SELECT 1 FROM public.chat_room_members 
        WHERE room_id = chat_rooms.id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Authenticated cats can create rooms" ON public.chat_rooms;
CREATE POLICY "Authenticated cats can create rooms" ON public.chat_rooms
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Chat Messages Policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Room cats can view messages" ON public.chat_messages;
CREATE POLICY "Room cats can view messages" ON public.chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_room_members 
        WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Room cats can send messages" ON public.chat_messages;
CREATE POLICY "Room cats can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.chat_room_members 
        WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
    )
);

-- Chat Room Members Policies
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Room cats can view membership" ON public.chat_room_members;
CREATE POLICY "Room cats can view membership" ON public.chat_room_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_room_members crm
        WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Cats can manage own membership" ON public.chat_room_members;
CREATE POLICY "Cats can manage own membership" ON public.chat_room_members
FOR ALL USING (auth.uid() = user_id);

-- User Presence Policies
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All cats can view user presence" ON public.user_presence;
CREATE POLICY "All cats can view user presence" ON public.user_presence
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cats can update own presence" ON public.user_presence;
CREATE POLICY "Cats can update own presence" ON public.user_presence
FOR ALL USING (auth.uid() = user_id);

-- 🐱 ================================================================
-- SAMPLE CAT DATA (Optional - for testing our cat colony)
-- ================================================================

-- Sample cat users will be created automatically via trigger when cats sign up
-- But you can also insert manually for testing our cat colony:
/*
INSERT INTO public.users (id, email, username, favorite_cat_breed, purr_level, bio, cat_coins) VALUES
('00000000-0000-0000-0000-000000000001', 'whiskers@catmail.com', 'whiskers_the_great', 'Maine Coon', 8, 'I love jazz and long naps in the sun', 150),
('00000000-0000-0000-0000-000000000002', 'fluffy@catmail.com', 'fluffy_paws', 'Persian', 6, 'Classical music makes me purr', 120);

-- Sample cat-approved songs
INSERT INTO public.songs (title, artist, album, genre, duration, file_url, uploaded_by, cat_rating, is_cat_approved, purr_factor) VALUES
('Purr Symphony No. 1', 'The Cat Orchestra', 'Feline Classics', 'Classical', 240, 'https://example.com/purr-symphony.mp3', '00000000-0000-0000-0000-000000000001', 9, true, 8.5),
('Midnight Hunt Blues', 'Alley Cat Jazz Band', 'Nocturnal Vibes', 'Jazz', 180, 'https://example.com/midnight-hunt.mp3', '00000000-0000-0000-0000-000000000002', 8, true, 7.8);

-- Sample cat-themed playlists
INSERT INTO public.playlists (name, description, user_id, is_public, playlist_mood, cat_theme) VALUES
('Sleepy Cat Vibes', 'Perfect for afternoon naps', '00000000-0000-0000-0000-000000000001', true, 'sleepy', 'lazy_cat'),
('Hunting Hour Energy', 'Get your paws moving!', '00000000-0000-0000-0000-000000000002', true, 'energetic', 'wild_cat');

-- Sample listening party
INSERT INTO public.listening_parties (name, description, host_id, party_theme, max_participants) VALUES
('Jazz Cats Unite', 'A purr-fect evening of smooth jazz', '00000000-0000-0000-0000-000000000001', 'jazz_cats', 25);
*/

-- 🐱 ================================================================
-- MEOW PLAY CAT COLONY SETUP COMPLETE!
-- 🐱 ================================================================

-- After running this purrfect script:
-- 1. Go to Authentication > Settings in your Supabase dashboard
-- 2. Set Site URL to: http://localhost:5173 (for development)
-- 3. Configure any additional auth providers you want (Google, GitHub, etc.)
-- 4. Create Storage buckets for our cat media:
--    - 'audio-files' (for song uploads)
--    - 'cover-art' (for album and playlist covers)
--    - 'avatars' (for cat profile pictures)
--    - 'cat-gifs' (for fun cat animations in chat)
-- 5. Set up RLS policies for Storage buckets
-- 6. Your MeowPlay cat colony is ready to purr! 🐾


-- 🏪 STORAGE BUCKETS SETUP INSTRUCTIONS
-- These need to be created manually in Supabase Dashboard > Storage
-- Create these buckets:
-- 1. 'audio-files' (Private, 50MB limit)
-- 2. 'cover-art' (Public, 5MB limit) 
-- 3. 'avatars' (Public, 2MB limit)
-- 4. 'cat-gifs' (Public, 10MB limit)
--
-- Then add these RLS policies for each bucket in the dashboard:
-- 
-- For audio-files bucket:
-- Policy: "Users can upload own audio" 
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
-- 
-- Policy: "Public audio access"
-- SELECT: true
--
-- For avatars bucket:
-- Policy: "Users can upload own avatars"
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy: "Public avatar access" 
-- SELECT: true
--
-- For cover-art bucket:
-- Policy: "Users can upload cover art"
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy: "Public cover art access"
-- SELECT: true
--
-- For cat-gifs bucket:
-- Policy: "Anyone can view cat gifs"
-- SELECT: true
--
-- Policy: "Authenticated users can upload cat gifs"
-- INSERT: auth.role() = 'authenticated'

-- 🔄 ENABLE REALTIME FOR CAT SOCIAL FEATURES
-- Go to Database > Replication in Supabase Dashboard
-- Enable realtime for these tables:
-- ✅ activity_feed
-- ✅ party_messages  
-- ✅ chat_messages
-- ✅ user_presence
-- ✅ listening_parties
-- ✅ party_participants
-- ✅ user_follows
-- ✅ chat_room_members

-- 🎮 SAMPLE CAT DATA SETUP
-- Sample users will be created when they sign up through your app
-- The handle_new_user() trigger will automatically create profiles

-- Sample data will be created when users sign up and use the app
-- You can manually insert test data if needed:
/*
INSERT INTO public.users (id, email, username, favorite_cat_breed, purr_level, bio, cat_coins) VALUES
('00000000-0000-0000-0000-000000000001', 'whiskers@catmail.com', 'whiskers_the_great', 'Maine Coon', 8, 'I love jazz and long naps in the sun ☀️', 150),
('00000000-0000-0000-0000-000000000002', 'fluffy@catmail.com', 'fluffy_paws', 'Persian', 6, 'Classical music makes me purr 🎼', 120)
ON CONFLICT (id) DO NOTHING;
*/

-- Sample data can be added after users sign up:
/*
-- Sample cat-approved songs (add after users exist)
INSERT INTO public.songs (title, artist, album, genre, duration, file_url, uploaded_by, cat_rating, is_cat_approved, purr_factor) VALUES
('Purr Symphony No. 1', 'The Cat Orchestra', 'Feline Classics', 'Classical', 240, 'https://example.com/purr-symphony.mp3', 'user_id_here', 9, true, 8.5),
('Midnight Hunt Blues', 'Alley Cat Jazz Band', 'Nocturnal Vibes', 'Jazz', 180, 'https://example.com/midnight-hunt.mp3', 'user_id_here', 8, true, 7.8);
*/

-- 🎯 SETUP COMPLETE!
SELECT '🐱 MEOWPLAY DATABASE SETUP COMPLETE! 🎵' as status,
       'Next: Create Storage Buckets in Dashboard' as next_step_1,
       'Next: Enable Realtime in Database > Replication' as next_step_2,
       'Next: Set Site URL in Auth > Settings' as next_step_3,
       'Cat Colony Database: 🐾 Ready to Purr!' as final_status;

-- 📋 POST-SETUP CHECKLIST:
-- ✅ Database tables and functions created
-- ⏳ Create storage buckets manually in dashboard
-- ⏳ Enable realtime for specified tables  
-- ⏳ Set authentication site URL
-- ⏳ Test your app connection
-- 🎉 Start building your cat colony!
