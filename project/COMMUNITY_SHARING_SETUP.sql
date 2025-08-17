-- Community Sharing Database Schema for Meow-Play
-- This extends the existing Supabase schema with community features

-- Community Music Table (Global shared music database)
CREATE TABLE community_music (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    genre VARCHAR(100),
    duration INTEGER NOT NULL, -- in seconds
    file_url TEXT NOT NULL,
    cover_art_url TEXT,
    file_size BIGINT,
    bitrate INTEGER,
    sample_rate INTEGER,
    audio_format VARCHAR(10), -- mp3, flac, wav, etc.
    
    -- Upload metadata
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    original_filename VARCHAR(255),
    file_hash VARCHAR(64) UNIQUE, -- SHA-256 hash to prevent duplicates
    
    -- Community metrics
    play_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    download_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    
    -- Moderation
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_notes TEXT,
    
    -- Metadata
    lyrics TEXT,
    tags TEXT[], -- Array of tags
    language VARCHAR(10),
    explicit_content BOOLEAN DEFAULT FALSE,
    copyright_info TEXT,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || artist || ' ' || COALESCE(album, '') || ' ' || COALESCE(genre, ''))
    ) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Playlists (Shared playlists)
CREATE TABLE community_playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_art_url TEXT,
    
    -- Creator info
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Community metrics
    follower_count BIGINT DEFAULT 0,
    play_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    
    -- Settings
    is_public BOOLEAN DEFAULT TRUE,
    is_collaborative BOOLEAN DEFAULT FALSE,
    allow_downloads BOOLEAN DEFAULT TRUE,
    
    -- Moderation
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'flagged', 'removed')),
    
    -- Tags and categorization
    tags TEXT[],
    mood VARCHAR(50),
    genre VARCHAR(100),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(genre, ''))
    ) STORED
);

-- Community Playlist Items
CREATE TABLE community_playlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES community_playlists(id) ON DELETE CASCADE,
    music_id UUID REFERENCES community_music(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(playlist_id, music_id),
    UNIQUE(playlist_id, position)
);

-- User Community Interactions
CREATE TABLE community_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('music', 'playlist', 'user')),
    target_id UUID NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'follow', 'download', 'share', 'report')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, target_type, target_id, interaction_type)
);

-- Community Reports (For moderation)
CREATE TABLE community_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reported_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('music', 'playlist', 'user', 'comment')),
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('copyright', 'inappropriate', 'spam', 'harassment', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Comments (For music and playlists)
CREATE TABLE community_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('music', 'playlist')),
    target_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE, -- For replies
    like_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- User Profiles (Extended for community features)
CREATE TABLE community_user_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    location VARCHAR(100),
    website TEXT,
    
    -- Community stats
    uploads_count BIGINT DEFAULT 0,
    followers_count BIGINT DEFAULT 0,
    following_count BIGINT DEFAULT 0,
    total_plays BIGINT DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    
    -- Settings
    is_public BOOLEAN DEFAULT TRUE,
    allow_messages BOOLEAN DEFAULT TRUE,
    show_listening_activity BOOLEAN DEFAULT TRUE,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    is_artist BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Follows (Community social features)
CREATE TABLE community_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- Community Activity Feed
CREATE TABLE community_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN (
        'uploaded_music', 'created_playlist', 'liked_music', 'followed_user', 
        'shared_music', 'commented', 'achieved_milestone'
    )),
    target_type VARCHAR(20),
    target_id UUID,
    metadata JSONB, -- Additional activity data
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_community_music_search ON community_music USING GIN(search_vector);
CREATE INDEX idx_community_music_status ON community_music(status);
CREATE INDEX idx_community_music_uploaded_by ON community_music(uploaded_by);
CREATE INDEX idx_community_music_genre ON community_music(genre);
CREATE INDEX idx_community_music_play_count ON community_music(play_count DESC);

CREATE INDEX idx_community_playlists_search ON community_playlists USING GIN(search_vector);
CREATE INDEX idx_community_playlists_created_by ON community_playlists(created_by);
CREATE INDEX idx_community_playlists_public ON community_playlists(is_public);

CREATE INDEX idx_community_interactions_user ON community_interactions(user_id);
CREATE INDEX idx_community_interactions_target ON community_interactions(target_type, target_id);

CREATE INDEX idx_community_reports_status ON community_reports(status);
CREATE INDEX idx_community_comments_target ON community_comments(target_type, target_id);

CREATE INDEX idx_community_activity_user ON community_activity(user_id);
CREATE INDEX idx_community_activity_public ON community_activity(is_public);

-- Row Level Security (RLS) Policies

-- Community Music Policies
ALTER TABLE community_music ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community music is viewable by everyone" ON community_music
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can insert their own music" ON community_music
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own music" ON community_music
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Community Playlists Policies
ALTER TABLE community_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public playlists are viewable by everyone" ON community_playlists
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create playlists" ON community_playlists
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own playlists" ON community_playlists
    FOR UPDATE USING (auth.uid() = created_by);

-- Community Interactions Policies
ALTER TABLE community_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions" ON community_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions" ON community_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON community_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for updating counters
CREATE OR REPLACE FUNCTION update_community_music_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update counters based on interaction type
        IF NEW.interaction_type = 'like' AND NEW.target_type = 'music' THEN
            UPDATE community_music SET like_count = like_count + 1 WHERE id = NEW.target_id;
        ELSIF NEW.interaction_type = 'download' AND NEW.target_type = 'music' THEN
            UPDATE community_music SET download_count = download_count + 1 WHERE id = NEW.target_id;
        ELSIF NEW.interaction_type = 'share' AND NEW.target_type = 'music' THEN
            UPDATE community_music SET share_count = share_count + 1 WHERE id = NEW.target_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease counters
        IF OLD.interaction_type = 'like' AND OLD.target_type = 'music' THEN
            UPDATE community_music SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
        ELSIF OLD.interaction_type = 'download' AND OLD.target_type = 'music' THEN
            UPDATE community_music SET download_count = GREATEST(download_count - 1, 0) WHERE id = OLD.target_id;
        ELSIF OLD.interaction_type = 'share' AND OLD.target_type = 'music' THEN
            UPDATE community_music SET share_count = GREATEST(share_count - 1, 0) WHERE id = OLD.target_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating stats
CREATE TRIGGER community_music_stats_trigger
    AFTER INSERT OR DELETE ON community_interactions
    FOR EACH ROW EXECUTE FUNCTION update_community_music_stats();

-- Function to update user upload count
CREATE OR REPLACE FUNCTION update_user_upload_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO community_user_profiles (user_id, uploads_count)
        VALUES (NEW.uploaded_by, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET uploads_count = community_user_profiles.uploads_count + 1;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_user_profiles 
        SET uploads_count = GREATEST(uploads_count - 1, 0)
        WHERE user_id = OLD.uploaded_by;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user upload count
CREATE TRIGGER user_upload_count_trigger
    AFTER INSERT OR DELETE ON community_music
    FOR EACH ROW EXECUTE FUNCTION update_user_upload_count();
