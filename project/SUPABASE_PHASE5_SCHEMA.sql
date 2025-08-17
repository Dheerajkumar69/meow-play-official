-- Phase 5: Advanced Features Database Schema
-- Social Features, Real-time Features, and AI Recommendations

-- User Following System
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Activity Feed System
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('song_play', 'song_like', 'song_upload', 'playlist_create', 'user_follow')),
  activity_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live Listening Parties
CREATE TABLE IF NOT EXISTS listening_parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
  current_position INTEGER DEFAULT 0,
  is_playing BOOLEAN DEFAULT FALSE,
  participants UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Party Chat Messages
CREATE TABLE IF NOT EXISTS party_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES listening_parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Listening History for AI Recommendations
CREATE TABLE IF NOT EXISTS user_listening_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  play_count INTEGER DEFAULT 1,
  liked BOOLEAN DEFAULT FALSE,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- Real-time Chat System
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'public' CHECK (type IN ('public', 'private', 'party')),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  participants UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'system')),
  reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Presence for Real-time Features
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_activity JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_user ON user_listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_song ON user_listening_history(song_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_liked ON user_listening_history(liked) WHERE liked = true;
CREATE INDEX IF NOT EXISTS idx_party_messages_party ON party_messages(party_id);
CREATE INDEX IF NOT EXISTS idx_party_messages_created ON party_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- User Follows Policies
CREATE POLICY "Users can view all follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON user_follows FOR ALL USING (auth.uid() = follower_id);

-- Activity Feed Policies
CREATE POLICY "Users can view activity from followed users" ON activity_feed FOR SELECT USING (
  user_id = auth.uid() OR 
  user_id IN (
    SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
  )
);
CREATE POLICY "Users can create their own activities" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listening Parties Policies
CREATE POLICY "Anyone can view public parties" ON listening_parties FOR SELECT USING (true);
CREATE POLICY "Hosts can manage their parties" ON listening_parties FOR ALL USING (auth.uid() = host_id);
CREATE POLICY "Participants can update party state" ON listening_parties FOR UPDATE USING (
  auth.uid() = host_id OR auth.uid() = ANY(participants)
);

-- Party Messages Policies
CREATE POLICY "Participants can view party messages" ON party_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM listening_parties 
    WHERE id = party_id AND (host_id = auth.uid() OR auth.uid() = ANY(participants))
  )
);
CREATE POLICY "Participants can send messages" ON party_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM listening_parties 
    WHERE id = party_id AND (host_id = auth.uid() OR auth.uid() = ANY(participants))
  )
);

-- Listening History Policies
CREATE POLICY "Users can manage their own history" ON user_listening_history FOR ALL USING (auth.uid() = user_id);

-- Chat Policies
CREATE POLICY "Users can view accessible chat rooms" ON chat_rooms FOR SELECT USING (
  type = 'public' OR 
  created_by = auth.uid() OR 
  auth.uid() = ANY(participants)
);
CREATE POLICY "Users can create chat rooms" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view messages in accessible rooms" ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE id = room_id AND (
      type = 'public' OR 
      created_by = auth.uid() OR 
      auth.uid() = ANY(participants)
    )
  )
);
CREATE POLICY "Users can send messages to accessible rooms" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE id = room_id AND (
      type = 'public' OR 
      created_by = auth.uid() OR 
      auth.uid() = ANY(participants)
    )
  )
);

-- User Presence Policies
CREATE POLICY "Users can view all presence" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Users can manage their own presence" ON user_presence FOR ALL USING (auth.uid() = user_id);

-- Functions for Real-time Updates
CREATE OR REPLACE FUNCTION update_listening_party_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listening_parties_updated_at
  BEFORE UPDATE ON listening_parties
  FOR EACH ROW
  EXECUTE FUNCTION update_listening_party_timestamp();

CREATE OR REPLACE FUNCTION update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_timestamp();

-- Sample Data for Testing
INSERT INTO chat_rooms (name, type, created_by) VALUES 
('General Chat', 'public', (SELECT id FROM users LIMIT 1)),
('Music Discovery', 'public', (SELECT id FROM users LIMIT 1)),
('Late Night Vibes', 'public', (SELECT id FROM users LIMIT 1))
ON CONFLICT DO NOTHING;
