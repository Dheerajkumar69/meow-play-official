import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Heart, Share2, Download, Plus, TrendingUp, Clock, Users, Music, Headphones, Star, Sparkles, Zap, Flame } from 'lucide-react';
import { mockPlaylists } from '../utils/mockData';
import { Link } from 'react-router-dom';
import { useMusic } from '../contexts/MusicContext';
import Layout, { Section, Container, Grid, Flex } from '../components/ui/Layout';
import { NavItem } from '../components/ui/Navigation';
import AdvancedCard, { CardHeader, CardBody, CardFooter } from '../components/ui/AdvancedCard';
import PremiumButton from '../components/ui/PremiumButton';
import { Skeleton, Spinner, StaggerContainer } from '../components/ui/PremiumLoadingStates';
import { ResponsiveGrid, ResponsiveContainer } from '../components/ui/ResponsiveLayout';
import { FadeIn, Scale, Slide } from '../components/ui/AnimationSystem';
import SupabaseTest from '../components/SupabaseTest';
import { useTheme } from '../theme/ThemeContext';
import { transitions, glassMorphism } from '../theme/utils';

const Home: React.FC = () => {
  const { songs, setQueue, play } = useMusic();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Memoized expensive computations
  const recentSongs = useMemo(() => songs.slice(0, 12), [songs]);
  
  const popularSongs = useMemo(
    () => songs.slice().sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 12),
    [songs]
  );

  // Suggested artists based on user's library
  const suggestedArtists = useMemo(() => {
    const artistCount: Record<string, { count: number; songs: typeof songs }> = {};
    
    songs.forEach(song => {
      if (!artistCount[song.artist]) {
        artistCount[song.artist] = { count: 0, songs: [] };
      }
      artistCount[song.artist].count += (song.playCount || 0) + 1;
      artistCount[song.artist].songs.push(song);
    });

    return Object.entries(artistCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 12)
      .map(([artist, data]) => ({
        name: artist,
        songCount: data.songs.length,
        totalPlays: data.count,
        coverArt: data.songs[0]?.coverArt,
        topSong: data.songs.sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0]
      }));
  }, [songs]);

  // Memoized event handlers
  const handlePlayAll = useCallback((songList: typeof songs) => {
    if (songList.length > 0) {
      setQueue(songList);
      play(songList[0]);
    }
  }, [setQueue, play]);

  const handlePlayArtist = useCallback((artistName: string) => {
    const artistSongs = songs.filter(song => song.artist === artistName);
    if (artistSongs.length > 0) {
      setQueue(artistSongs);
      play(artistSongs[0]);
    }
  }, [songs, setQueue, play]);

  // Memoized mood playlists data
  const moodPlaylists = useMemo(() => [
    {
      id: 'mood-1',
      name: 'Chill Out',
      description: 'Perfect for unwinding',
      color: 'from-blue-500 to-cyan-500',
      icon: '🌊',
      songs: songs.filter(s => s.mood?.includes('chill')).slice(0, 20)
    },
    {
      id: 'mood-2',
      name: 'Energy Boost',
      description: 'High-energy tracks',
      color: 'from-orange-500 to-red-500',
      icon: '⚡',
      songs: songs.filter(s => s.mood?.includes('energetic')).slice(0, 20)
    },
    {
      id: 'mood-3',
      name: 'Focus Flow',
      description: 'Instrumental focus music',
      color: 'from-green-500 to-emerald-500',
      icon: '🎯',
      songs: songs.filter(s => s.genre === 'Ambient' || s.genre === 'Classical').slice(0, 20)
    },
    {
      id: 'mood-4',
      name: 'Happy Vibes',
      description: 'Uplifting songs',
      color: 'from-yellow-500 to-orange-500',
      icon: '😊',
      songs: songs.filter(s => s.mood?.includes('happy')).slice(0, 20)
    },
    {
      id: 'mood-5',
      name: 'Late Night',
      description: 'Perfect for evening',
      color: 'from-purple-500 to-indigo-500',
      icon: '🌙',
      songs: songs.filter(s => s.mood?.includes('dreamy')).slice(0, 20)
    },
    {
      id: 'mood-6',
      name: 'Workout',
      description: 'Pump up your exercise',
      color: 'from-red-500 to-pink-500',
      icon: '💪',
      songs: songs.filter(s => s.genre === 'Hip Hop' || s.genre === 'Electronic').slice(0, 20)
    }
  ], [songs]);

  const handlePlayMoodPlaylist = useCallback((playlist: typeof moodPlaylists[0]) => {
    if (playlist.songs.length > 0) {
      setQueue(playlist.songs);
      play(playlist.songs[0]);
    }
  }, [setQueue, play]);

  // Navigation configuration
  const navigationItems: NavItem[] = [
    { label: 'Home', href: '/', active: true },
    { label: 'Library', href: '/library' },
    { label: 'Community', href: '/community' },
    { label: 'Upload', href: '/upload' }
  ];

  const user = {
    name: 'Music Lover',
    email: 'user@meowplay.com'
  };

  return (
    <Layout
      navigation={{
        brand: (
          <Flex align="center" gap="sm">
            <span className="text-2xl" role="img" aria-label="cat emoji">🐱</span>
            <span className="text-xl font-bold text-purple-600">Meow-Play</span>
          </Flex>
        ),
        items: navigationItems,
        user,
        onSearch: (query) => console.log('Search:', query),
        notificationCount: 3
      }}
      background="gradient"
      maxWidth="2xl"
    >
      {/* Hero Section */}
      <Section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${
          isDark 
            ? 'from-blue-900/20 via-purple-900/20 to-pink-900/20' 
            : 'from-blue-50 via-purple-50 to-pink-50'
        }`} />
        <ResponsiveContainer className="relative z-10">
          <FadeIn className="text-center py-20">
            <Scale>
              <h1 className={`text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r ${
                isDark 
                  ? 'from-blue-400 via-purple-400 to-pink-400' 
                  : 'from-blue-600 via-purple-600 to-pink-600'
              } bg-clip-text text-transparent`}>
                Welcome to MeowPlay
                <Sparkles className="inline-block w-8 h-8 ml-4 text-yellow-400 animate-pulse" />
              </h1>
            </Scale>
            <Slide direction="up" delay={0.2}>
              <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Discover, create, and share amazing music with AI-powered recommendations
              </p>
            </Slide>
            <Slide direction="up" delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumButton 
                  variant="premium"
                  size="lg" 
                  glow
                  magnetic
                  leftIcon={<Play className="w-5 h-5" />}
                  onClick={() => handlePlayAll(recentSongs)}
                >
                  Start Listening
                </PremiumButton>
                <PremiumButton 
                  variant="glass"
                  size="lg"
                  leftIcon={<TrendingUp className="w-5 h-5" />}
                >
                  Explore Trending
                </PremiumButton>
              </div>
            </Slide>
          </FadeIn>
        </ResponsiveContainer>
      </Section>

      {/* Stats Section */}
      <Section background="gray" padding="lg">
        <Container>
          <Grid cols={3} gap="lg" responsive={{ sm: 1, md: 3 }}>
            <Card variant="elevated" className="text-center">
              <CardBody>
                <div className="text-3xl font-bold text-purple-600 mb-2">{songs.length}</div>
                <div className="text-gray-600">Songs Available</div>
              </CardBody>
            </Card>
            <Card variant="elevated" className="text-center">
              <CardBody>
                <div className="text-3xl font-bold text-purple-600 mb-2">{suggestedArtists.length}</div>
                <div className="text-gray-600">Artists</div>
              </CardBody>
            </Card>
            <Card variant="elevated" className="text-center">
              <CardBody>
                <div className="text-3xl font-bold text-purple-600 mb-2">{mockPlaylists.length}</div>
                <div className="text-gray-600">Playlists</div>
              </CardBody>
            </Card>
          </Grid>
        </Container>
      </Section>

      {/* Supabase Test */}
      <Section>
        <Container>
          <SupabaseTest />
        </Container>
      </Section>

      {/* Mood Playlists */}
      <Section title="Made for You" subtitle="Curated playlists based on your listening habits">
        <Container>
          <Grid cols={2} gap="lg" responsive={{ sm: 1, md: 2, lg: 3, xl: 4 }}>
            {moodPlaylists.map((playlist) => (
              <Card 
                key={playlist.id} 
                variant="elevated" 
                className="group cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => handlePlayMoodPlaylist(playlist)}
              >
                <CardBody>
                  <div className="relative mb-4">
                    <div className={`w-full aspect-square bg-gradient-to-br ${playlist.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-4xl">{playlist.icon}</span>
                    </div>
                    <Button
                      variant="success"
                      size="icon"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{playlist.name}</h3>
                  <p className="text-sm text-gray-600">{playlist.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{playlist.songs.length} songs</p>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Your Playlists */}
      <Section background="gray" title="Your Playlists" subtitle="Personal collections you've created">
        <Container>
          <Grid cols={2} gap="lg" responsive={{ sm: 1, md: 2, lg: 3, xl: 4 }}>
            {mockPlaylists.map((playlist) => (
              <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="block">
                <Card 
                  variant="elevated" 
                  className="group hover:scale-105 transition-transform duration-300"
                >
                  <CardBody>
                    <div className="relative mb-4">
                      {playlist.coverArt ? (
                        <img
                          src={playlist.coverArt}
                          alt={playlist.name}
                          className="w-full aspect-square object-cover rounded-xl shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg" style={{ display: playlist.coverArt ? 'none' : 'flex' }}>
                        <Music className="w-8 h-8 text-white" />
                      </div>
                      <Button
                        variant="success"
                        size="icon"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePlayAll(playlist.songs);
                        }}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{playlist.name}</h3>
                    <p className="text-sm text-gray-600">{playlist.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{playlist.songs.length} songs</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Your Top Artists */}
      {suggestedArtists.length > 0 && (
        <Section title="Your Top Artists" subtitle="Artists you listen to most">
          <Container>
            <Grid cols={2} gap="lg" responsive={{ sm: 1, md: 2, lg: 3, xl: 4 }}>
              {suggestedArtists.slice(0, 12).map((artist) => (
                <Card 
                  key={artist.name} 
                  variant="elevated" 
                  className="group cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => handlePlayArtist(artist.name)}
                >
                  <CardBody>
                    <div className="relative mb-4">
                      {artist.coverArt ? (
                        <img
                          src={artist.coverArt}
                          alt={artist.name}
                          className="w-full aspect-square object-cover rounded-full shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg" style={{ display: artist.coverArt ? 'none' : 'flex' }}>
                        <span className="text-2xl">🎤</span>
                      </div>
                      <Button
                        variant="success"
                        size="icon"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-center">{artist.name}</h3>
                    <p className="text-sm text-gray-600 text-center">
                      {artist.songCount} song{artist.songCount !== 1 ? 's' : ''}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </Container>
        </Section>
      )}

      {/* Recently Added */}
      <Section>
        <ResponsiveContainer>
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <Clock className="w-8 h-8 text-blue-500" />
                Recently Added
              </h2>
              <PremiumButton 
                variant="outline"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => handlePlayAll(recentSongs)}
              >
                Play All
              </PremiumButton>
            </div>
          </FadeIn>
          
          <ResponsiveGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 6 }} gap={6}>
            {recentSongs.map((song, index) => (
              <FadeIn key={song.id} delay={index * 0.1}>
                <AdvancedCard 
                  variant="elevated"
                  hoverable
                  pressable
                  tilt
                  className="group cursor-pointer"
                  onClick={() => play(song)}
                  onMouseEnter={() => setHoveredCard(song.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img 
                      src={song.coverArt} 
                      alt={song.title}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Scale>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </Scale>
                    </div>
                  </div>
                  <CardBody>
                    <h3 className={`font-semibold mb-1 truncate ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {song.title}
                    </h3>
                    <p className={`text-sm truncate mb-3 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {song.artist}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {song.duration}
                      </span>
                      <div className="flex items-center gap-1">
                        <PremiumButton
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className="w-4 h-4" />
                        </PremiumButton>
                        <PremiumButton
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Share2 className="w-4 h-4" />
                        </PremiumButton>
                      </div>
                    </div>
                  </CardBody>
                </AdvancedCard>
              </FadeIn>
            ))}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </Section>

      {/* Popular Songs */}
      {popularSongs.length > 0 && (
        <Section title="Trending Now" subtitle="Most popular tracks right now">
          <Container>
            <Flex justify="end" className="mb-6">
              <Button
                variant="primary"
                onClick={() => handlePlayAll(popularSongs)}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Play Trending
              </Button>
            </Flex>
            <Grid cols={2} gap="lg" responsive={{ sm: 1, md: 2, lg: 3, xl: 4 }}>
              {popularSongs.map((song) => (
                <Card 
                  key={song.id} 
                  variant="elevated" 
                  className="group hover:scale-105 transition-transform duration-300"
                >
                  <CardBody>
                    <div className="relative mb-4">
                      {song.coverArt ? (
                        <img
                          src={song.coverArt}
                          alt={song.title}
                          className="w-full aspect-square object-cover rounded-xl shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg" style={{ display: song.coverArt ? 'none' : 'flex' }}>
                        <div className="text-white text-2xl">
                          {song.uploadedBy === 'community' ? '🌍' : '🎵'}
                        </div>
                      </div>
                      <Button
                        variant="success"
                        size="icon"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                        onClick={() => play(song)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{song.title}</h3>
                    <p className="text-sm text-gray-600">{song.artist}</p>
                    {song.playCount && (
                      <p className="text-xs text-gray-500 mt-2">{song.playCount.toLocaleString()} plays</p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </Container>
        </Section>
      )}
    </Layout>
  );
};

export default React.memo(Home);
