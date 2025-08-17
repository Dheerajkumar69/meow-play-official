import React, { useState, useEffect } from 'react';
import { Music, Users, Heart, Play, Cat, Sparkles, ArrowRight } from 'lucide-react';
import ModernAuth from './ModernAuth';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const features = [
    {
      icon: <Cat className="w-8 h-8" />,
      title: "Purrfect Music",
      description: "Stream millions of songs that'll make you purr with delight"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Cat Colony",
      description: "Share playlists and discover music with fellow cat lovers"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Whisker AI",
      description: "Purrsonalized music suggestions powered by feline intelligence"
    },
    {
      icon: <Play className="w-8 h-8" />,
      title: "Meow Sessions",
      description: "Join live listening parties with music-loving cats worldwide"
    }
  ];

  const stats = [
    { number: "10M+", label: "Happy Cats" },
    { number: "50M+", label: "Purr-fect Songs" },
    { number: "1M+", label: "Cat Playlists" },
    { number: "99.9%", label: "Meow Uptime" }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-amber-900 to-yellow-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Music Notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <Cat className="w-6 h-6 text-white/20" />
          </div>
        ))}
        {[...Array(10)].map((_, i) => (
          <div
            key={`paw-${i}`}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <div className="w-3 h-3 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center p-6 md:p-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MeowPlay</span>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 border border-white/20"
          >
            Sign In
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-8">
          <div className={`text-center max-w-4xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white">Now with AI-powered recommendations!</span>
              </div>
            </div>

            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <Cat className="w-16 h-16 text-orange-400 mr-4 animate-pulse" />
                <h1 className="text-6xl md:text-8xl font-bold text-white animate-fade-in">
                  Meow<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">Play</span>
                </h1>
                <Sparkles className="w-12 h-12 text-yellow-400 ml-4 animate-spin" />
              </div>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                The purrfect music streaming experience for cat lovers! Stream, discover, and share your favorite tunes with fellow felines.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
                <button
                  onClick={() => setShowAuth(true)}
                  className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl mr-4"
                >
                  Start Purring Free
                  <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </button>
                <p className="text-sm text-gray-400">Join the cat colony - no credit card required!</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-orange-400/20">
                    <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">{stat.number}</div>
                    <div className="text-gray-300">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Features Showcase */}
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white mb-6">Why Choose MeowPlay?</h3>
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center transform transition-all duration-500 hover:scale-105 hover:bg-white/20 border border-orange-400/20 ${
                          currentFeature === index ? 'ring-2 ring-orange-400 bg-orange-500/10' : ''
                        }`}
                      >
                        <div className="text-orange-400 mb-4 flex justify-center animate-bounce">
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-300">{feature.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <div className="relative">
                      <div className="w-80 h-80 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-full blur-3xl"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl">
                          <Music className="w-32 h-32 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 md:p-8 text-center">
          <div className="flex items-center justify-center space-x-1 text-gray-400 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-400" />
            <span>for music lovers everywhere</span>
          </div>
        </footer>
        
        {/* Integrated Auth Modal */}
        {showAuth && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-md w-full">
              <button
                onClick={() => setShowAuth(false)}
                className="absolute -top-12 right-0 text-white hover:text-orange-400 transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
              <ModernAuth onBack={() => setShowAuth(false)} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
