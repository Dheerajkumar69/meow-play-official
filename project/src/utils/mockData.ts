import { Song, Playlist, Comment, Activity, UserStats, MoodPlaylist } from '../types';

export const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Midnight Dreams',
    artist: 'Luna Nova',
    album: 'Stellar Nights',
    genre: 'Electronic',
    duration: 245,
    filePath: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    coverArt: 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: '1',
    createdAt: new Date('2024-01-15'),
    playCount: 1250,
    liked: true,
    averageRating: 4.2,
    totalRatings: 89,
    mood: ['chill', 'dreamy', 'electronic'],
    tempo: 120,
    key: 'C major',
    lyrics: `[00:00] In the midnight dreams we find our way
[00:15] Through the stellar nights we'll always stay
[00:30] Luna nova shining bright
[00:45] Guiding us through endless night`
  },
  {
    id: '2',
    title: 'Ocean Waves',
    artist: 'Aqua Sounds',
    album: 'Deep Blue',
    genre: 'Ambient',
    duration: 320,
    filePath: 'https://sample-music.netlify.app/death%20bed.mp3',
    coverArt: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: '1',
    createdAt: new Date('2024-01-10'),
    playCount: 890,
    liked: true,
    averageRating: 4.7,
    totalRatings: 156,
    mood: ['relaxing', 'nature', 'peaceful'],
    tempo: 60,
    key: 'A minor',
    lyrics: `[00:00] Listen to the ocean waves
[00:20] Feel the rhythm that nature saves
[00:40] Deep blue waters call your name
[01:00] In this peaceful, endless game`
  },
  {
    id: '3',
    title: 'Digital Sunset',
    artist: 'Neon Lights',
    album: 'Synthwave Collection',
    genre: 'Synthwave',
    duration: 198,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverArt: 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: '1',
    createdAt: new Date('2024-01-05'),
    playCount: 2100,
    liked: false,
    averageRating: 4.5,
    totalRatings: 203,
    mood: ['energetic', 'retro', 'upbeat'],
    tempo: 140,
    key: 'D minor',
    lyrics: `[00:00] Digital sunset paints the sky
[00:15] Neon colors flying high
[00:30] Synthwave dreams come alive
[00:45] In this retro paradise`
  },
  {
    id: '4',
    title: 'Forest Whispers',
    artist: 'Nature Sounds',
    album: 'Peaceful Moments',
    genre: 'Nature',
    duration: 280,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverArt: 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: '1',
    createdAt: new Date('2024-01-01'),
    playCount: 750,
    liked: true,
    averageRating: 4.3,
    totalRatings: 67,
    mood: ['peaceful', 'nature', 'meditative'],
    tempo: 70,
    key: 'G major',
    lyrics: `[00:00] Forest whispers in the breeze
[00:25] Ancient secrets in the trees
[00:50] Nature's song so pure and free
[01:15] Find your peace in harmony`
  },
  {
    id: '5',
    title: 'Urban Rhythm',
    artist: 'City Beats',
    album: 'Street Life',
    genre: 'Hip Hop',
    duration: 210,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverArt: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: '1',
    createdAt: new Date('2023-12-28'),
    playCount: 1800,
    liked: false,
    averageRating: 4.1,
    totalRatings: 134,
    mood: ['energetic', 'urban', 'confident'],
    tempo: 95,
    key: 'F# minor',
    lyrics: `[00:00] Urban rhythm in my soul
[00:15] City beats make me whole
[00:30] Street life flowing through my veins
[00:45] Breaking free from all the chains`
  },
  // Additional Creative Commons and Public Domain songs with properly matched covers
  {
    id: 'cc_1',
    title: 'Sunny Day',
    artist: 'Happy Vibes',
    genre: 'Pop',
    duration: 195,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverArt: 'https://images.pexels.com/photos/1154189/pexels-photo-1154189.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: 'external',
    createdAt: new Date('2024-01-20'),
    playCount: 850,
    liked: false,
    averageRating: 4.0,
    totalRatings: 45,
    mood: ['happy', 'uplifting', 'sunny'],
    license: 'CC BY',
    source: 'Creative Commons',
    lyrics: `[00:00] Sunny day, bright and clear
[00:15] All my worries disappear
[00:30] Happy vibes fill the air
[00:45] Joy and laughter everywhere`
  },
  {
    id: 'cc_2',
    title: 'Chill Waves',
    artist: 'Ocean Sounds',
    genre: 'Ambient',
    duration: 300,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverArt: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: 'external',
    createdAt: new Date('2024-01-18'),
    playCount: 1200,
    liked: true,
    averageRating: 4.6,
    totalRatings: 78,
    mood: ['relaxing', 'ocean', 'peaceful'],
    license: 'CC0',
    source: 'Public Domain',
    lyrics: `[00:00] Chill waves wash over me
[00:20] Setting my spirit free
[00:40] Ocean sounds so serene
[01:00] Most peaceful I've ever been`
  },
  {
    id: 'cc_3',
    title: 'Digital Dreams',
    artist: 'Synth Master',
    genre: 'Electronic',
    duration: 220,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverArt: 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: 'external',
    createdAt: new Date('2024-01-16'),
    playCount: 950,
    liked: false,
    averageRating: 4.3,
    totalRatings: 62,
    mood: ['electronic', 'futuristic', 'dreamy'],
    license: 'CC BY-SA',
    source: 'Creative Commons',
    lyrics: `[00:00] Digital dreams in neon light
[00:15] Synth waves dancing through the night
[00:30] Future sounds from another world
[00:45] Electronic magic unfurled`
  },
  {
    id: 'cc_4',
    title: 'Folk Journey',
    artist: 'Wandering Minstrel',
    album: 'Acoustic Tales',
    genre: 'Folk',
    duration: 240,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    coverArt: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: 'external',
    createdAt: new Date('2024-01-14'),
    playCount: 680,
    liked: true,
    averageRating: 4.4,
    totalRatings: 52,
    mood: ['folk', 'acoustic', 'storytelling'],
    license: 'CC BY',
    source: 'Creative Commons',
    lyrics: `[00:00] On a folk journey we embark
[00:20] Stories told from light to dark
[00:40] Acoustic strings and voices true
[01:00] Ancient tales made fresh and new`
  },
  {
    id: 'cc_5',
    title: 'Jazz Cafe',
    artist: 'Smooth Collective',
    album: 'Evening Sessions',
    genre: 'Jazz',
    duration: 280,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverArt: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: 'external',
    createdAt: new Date('2024-01-12'),
    playCount: 920,
    liked: false,
    averageRating: 4.5,
    totalRatings: 73,
    mood: ['jazz', 'smooth', 'sophisticated'],
    license: 'CC BY-SA',
    source: 'Creative Commons',
    lyrics: `[00:00] In the jazz cafe tonight
[00:20] Saxophone plays soft and bright
[00:40] Smooth melodies fill the air
[01:00] Music magic everywhere`
  },
  {
    id: 'cc_6',
    title: 'Rock Anthem',
    artist: 'Electric Storm',
    album: 'Thunder & Lightning',
    genre: 'Rock',
    duration: 210,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    coverArt: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: 'external',
    createdAt: new Date('2024-01-10'),
    playCount: 1450,
    liked: true,
    averageRating: 4.6,
    totalRatings: 98,
    mood: ['rock', 'energetic', 'powerful'],
    license: 'CC BY',
    source: 'Creative Commons',
    lyrics: `[00:00] Rock anthem rising high
[00:15] Electric guitars touch the sky
[00:30] Thunder rolling through the night
[00:45] Music burning bright as light`
  },
  {
    id: 'cc_7',
    title: 'Classical Morning',
    artist: 'Symphony Orchestra',
    album: 'Dawn Collection',
    genre: 'Classical',
    duration: 360,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    coverArt: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: 'external',
    createdAt: new Date('2024-01-08'),
    playCount: 540,
    liked: false,
    averageRating: 4.7,
    totalRatings: 34,
    mood: ['classical', 'peaceful', 'elegant'],
    license: 'Public Domain',
    source: 'Internet Archive',
    lyrics: `[00:00] Classical morning breaks the dawn
[00:30] Symphony of a new day born
[01:00] Orchestral beauty fills the air
[01:30] Music beyond compare`
  },
  {
    id: 'cc_8',
    title: 'Reggae Sunshine',
    artist: 'Island Vibes',
    album: 'Tropical Rhythms',
    genre: 'Reggae',
    duration: 225,
    filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    coverArt: 'https://images.pexels.com/photos/1154189/pexels-photo-1154189.jpeg?auto=compress&cs=tinysrgb&w=300',
    uploadedBy: 'external',
    createdAt: new Date('2024-01-06'),
    playCount: 780,
    liked: true,
    averageRating: 4.2,
    totalRatings: 56,
    mood: ['reggae', 'tropical', 'relaxed'],
    license: 'CC BY',
    source: 'Creative Commons',
    lyrics: `[00:00] Reggae sunshine warms my soul
[00:20] Island rhythms make me whole
[00:40] Tropical vibes and ocean breeze
[01:00] Music puts my mind at ease`
  }
];

export const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Chill Vibes',
    description: 'Perfect for relaxing and unwinding',
    songs: [mockSongs[1], mockSongs[3], mockSongs[6], mockSongs[7]],
    userId: '1',
    isPublic: true,
    isCollaborative: false,
    createdAt: new Date('2024-01-20'),
    coverArt: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=300',
    followers: 245
  },
  {
    id: '2',
    name: 'Electronic Mix',
    description: 'High energy electronic music',
    songs: [mockSongs[0], mockSongs[2], mockSongs[5], mockSongs[8]],
    userId: '1',
    isPublic: false,
    isCollaborative: true,
    collaborators: ['2', '3'],
    createdAt: new Date('2024-01-18'),
    coverArt: 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=300',
    followers: 89
  },
  {
    id: '3',
    name: 'Focus Flow',
    description: 'Instrumental tracks to help you concentrate',
    songs: [mockSongs[9], mockSongs[10], mockSongs[11]],
    userId: '1',
    isPublic: true,
    isCollaborative: false,
    createdAt: new Date('2024-01-15'),
    coverArt: 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=300',
    followers: 156
  },
  {
    id: '4',
    name: 'Workout Energy',
    description: 'High-tempo tracks to power your workout',
    songs: [mockSongs[4], mockSongs[12], mockSongs[13]],
    userId: '1',
    isPublic: true,
    isCollaborative: false,
    createdAt: new Date('2024-01-12'),
    coverArt: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
    followers: 203
  }
];

export const mockComments: Comment[] = [
  {
    id: '1',
    userId: '2',
    username: 'MusicLover42',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    songId: '1',
    content: 'This track is absolutely amazing! The production quality is incredible.',
    createdAt: new Date('2024-01-16'),
    likes: 23
  },
  {
    id: '2',
    userId: '3',
    username: 'ElectroFan',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    songId: '1',
    content: 'Luna Nova never disappoints! Can\'t wait for the full album.',
    createdAt: new Date('2024-01-17'),
    likes: 15
  }
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    userId: '2',
    username: 'MusicLover42',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    type: 'like',
    content: 'liked "Midnight Dreams" by Luna Nova',
    songId: '1',
    createdAt: new Date('2024-01-20T10:30:00')
  },
  {
    id: '2',
    userId: '3',
    username: 'ElectroFan',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    type: 'playlist_create',
    content: 'created a new playlist "Weekend Vibes"',
    playlistId: '3',
    createdAt: new Date('2024-01-20T09:15:00')
  },
  {
    id: '3',
    userId: '4',
    username: 'BeatMaster',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
    type: 'upload',
    content: 'uploaded a new track "Cosmic Journey"',
    songId: '6',
    createdAt: new Date('2024-01-19T16:45:00')
  }
];

export const mockUserStats: UserStats = {
  totalListeningTime: 15420, // minutes
  songsPlayed: 1247,
  favoriteGenres: [
    { genre: 'Electronic', count: 45 },
    { genre: 'Ambient', count: 32 },
    { genre: 'Hip Hop', count: 28 },
    { genre: 'Synthwave', count: 21 }
  ],
  topArtists: [
    { artist: 'Luna Nova', count: 67 },
    { artist: 'Neon Lights', count: 54 },
    { artist: 'Aqua Sounds', count: 43 },
    { artist: 'City Beats', count: 38 }
  ],
  weeklyStats: [
    { week: 'Jan 15', minutes: 420 },
    { week: 'Jan 8', minutes: 380 },
    { week: 'Jan 1', minutes: 450 },
    { week: 'Dec 25', minutes: 320 }
  ],
  currentStreak: 12
};

export const mockMoodPlaylists: MoodPlaylist[] = [
  {
    id: 'mood-1',
    name: 'Chill Out',
    mood: 'relaxed',
    description: 'Perfect for unwinding after a long day',
    songs: [mockSongs[1], mockSongs[3]],
    color: 'from-blue-500 to-cyan-500',
    icon: '🌊'
  },
  {
    id: 'mood-2',
    name: 'Energy Boost',
    mood: 'energetic',
    description: 'Get pumped up with these high-energy tracks',
    songs: [mockSongs[2], mockSongs[4]],
    color: 'from-orange-500 to-red-500',
    icon: '⚡'
  },
  {
    id: 'mood-3',
    name: 'Focus Flow',
    mood: 'focused',
    description: 'Instrumental tracks to help you concentrate',
    songs: [mockSongs[0], mockSongs[1]],
    color: 'from-green-500 to-emerald-500',
    icon: '🎯'
  },
  {
    id: 'mood-4',
    name: 'Happy Vibes',
    mood: 'happy',
    description: 'Uplifting songs to brighten your day',
    songs: [mockSongs[2], mockSongs[0]],
    color: 'from-yellow-500 to-orange-500',
    icon: '😊'
  }
];