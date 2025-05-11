"use client";

import  { useState, useEffect, useRef } from 'react';
import './app.css';
import { Calendar, Moon, BarChart2, Feather, Sun, Volume2, VolumeX, Music } from 'lucide-react';
import { ProtectedRoute ,useAuth} from '@/contexts/authContext';
import { useRouter } from 'next/navigation';

export default function PersonalPage() {
  const [thought, setThought] = useState('');
  const [mood, setMood] = useState(3); // 1-5 scale
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('journal');
  const [quote, setQuote] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
//   const {loading,accessToken}= useAuth();
//   const router= useRouter();


  // Daily quotes with Japanese philosophy themes
  const quotes = [
    { text: "In the silence between thoughts, find peace.", author: "Zen Proverb" },
    { text: "The world is but a canvas to our imagination.", author: "Wabi-sabi Philosophy" },
    { text: "Imperfection is the essence of everything.", author: "Wabi-sabi Teaching" },
    { text: "True beauty is found in what is fleeting.", author: "Mono no aware" },
    { text: "The space between things gives them meaning.", author: "Ma Philosophy" },
    { text: "Even in our smallness, we contain universes.", author: "Zen Wisdom" },
    { text: "The broken piece completes the whole.", author: "Kintsugi Philosophy" }
  ];

  // Set a random quote on load and when date changes
  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    
    // Load entries from localStorage
    const savedEntries = localStorage.getItem('murasakiEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }

    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('murasakiTheme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Save entries to localStorage when updated
  useEffect(() => {
    localStorage.setItem('murasakiEntries', JSON.stringify(entries));
  }, [entries]);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('murasakiTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Handle music playback
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("sounds/Suzume.mp3"); // This is a placeholder - in a real app, you'd use a real audio file path
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }

    if (isMusicPlaying) {
      audioRef.current.play().catch(e => console.log("Audio playback failed:", e));
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isMusicPlaying]);

  // Particle animation setup
  useEffect(() => {
    if(!canvasRef) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    
    const particles = [];
    const particleCount = Math.min(50, Math.floor(window.innerWidth / 30)); // Responsive particle count
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 1;
        this.minSize = Math.random() * 0.5 + 0.5; // Minimum size before respawning
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.fadeRate = Math.random() * 0.01 + 0.005; // How quickly particles shrink
        this.respawnChance = 0.001; // Chance to respawn each frame even if not tiny
        // Use different color ranges for dark/light modes
        this.baseColor = isDarkMode ? [180, 120, 255] : [138, 43, 226]; // RGB values
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Decrease size gradually but not below minimum
        if (this.size > this.minSize) {
          this.size -= this.fadeRate;
        } else if (Math.random() < 0.05) {
          // 5% chance to reset particle if it's at minimum size
          this.reset();
        }
        
        // Small chance to respawn even if not tiny
        if (Math.random() < this.respawnChance) {
          this.reset();
        }
        
        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      
      reset() {
        // Respawn the particle
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 1;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      
      draw() {
        const [r, g, b] = this.baseColor;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    function init() {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      requestAnimationFrame(animate);
    }
    
    init();
    animate();
    
    window.addEventListener('resize', () => {
      resizeCanvas();
      init();
    });
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isDarkMode,canvasRef]);

  // Handle journal entry submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!thought.trim()) return;
    
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      thought,
      mood
    };
    
    setEntries([newEntry, ...entries]);
    setThought('');
    setMood(3);
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Toggle music
  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying);
  };

  // Generate color based on mood and theme
  const getMoodColor = (moodValue) => {
    const lightColors = {
      1: '#564872', // Dark purple (sad)
      2: '#6e5c9c', // Medium-dark purple
      3: '#8a6bc1', // Medium purple (neutral)
      4: '#b292e3', // Light purple
      5: '#d8c3ff'  // Very light purple (happy)
    };
    
    const darkColors = {
      1: '#2d2440', // Very dark purple (sad)
      2: '#3a2b5e', // Dark purple
      3: '#4e3b80', // Medium-dark purple (neutral)
      4: '#6347a7', // Medium purple
      5: '#7d5ec5'  // Light purple (happy)
    };
    
    return isDarkMode ? darkColors[moodValue] || darkColors[3] : lightColors[moodValue] || lightColors[3];
  };

  // Format date to display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <ProtectedRoute>
        <div className={`min-h-screen font-sans relative overflow-hidden transition-colors duration-300 ${
      isDarkMode ? 'bg-purple-950 text-purple-100' : 'bg-purple-50 text-purple-900'
    }`}>
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-end space-x-2 mb-4">
          <button 
            onClick={toggleMusic}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-purple-800 hover:bg-purple-700' : 'bg-purple-200 hover:bg-purple-300'} transition-colors`}
            aria-label={isMusicPlaying ? "Pause music" : "Play music"}
          >
            {isMusicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-purple-800 hover:bg-purple-700' : 'bg-purple-200 hover:bg-purple-300'} transition-colors`}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-2">紫</h1>
          <h2 className={`text-xl ${isDarkMode ? 'text-purple-300' : 'text-purple-700'} font-light`}>Murasaki</h2>
          <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} mt-2`}>A moment of reflection, a breath of peace</p>
        </header>
        
        <nav className="flex flex-wrap justify-center mb-8">
          <button 
            onClick={() => setActiveTab('journal')}
            className={`flex items-center px-4 py-2 m-1 md:mx-2 rounded-full transition-colors ${
              activeTab === 'journal' 
                ? isDarkMode ? 'bg-purple-800 text-purple-100' : 'bg-purple-200 text-purple-900' 
                : isDarkMode ? 'text-purple-300 hover:bg-purple-900' : 'text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Feather size={16} className="mr-2" />
            Journal
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center px-4 py-2 m-1 md:mx-2 rounded-full transition-colors ${
              activeTab === 'history' 
                ? isDarkMode ? 'bg-purple-800 text-purple-100' : 'bg-purple-200 text-purple-900' 
                : isDarkMode ? 'text-purple-300 hover:bg-purple-900' : 'text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Calendar size={16} className="mr-2" />
            History
          </button>
          <button 
            onClick={() => setActiveTab('trends')}
            className={`flex items-center px-4 py-2 m-1 md:mx-2 rounded-full transition-colors ${
              activeTab === 'trends' 
                ? isDarkMode ? 'bg-purple-800 text-purple-100' : 'bg-purple-200 text-purple-900' 
                : isDarkMode ? 'text-purple-300 hover:bg-purple-900' : 'text-purple-700 hover:bg-purple-100'
            }`}
          >
            <BarChart2 size={16} className="mr-2" />
            Trends
          </button>
        </nav>
        
        <div className={`max-w-md mx-auto ${
          isDarkMode 
            ? 'bg-purple-900 bg-opacity-80 shadow-lg' 
            : 'bg-white bg-opacity-80 shadow-lg'
          } backdrop-blur-sm rounded-lg p-4 md:p-6 mb-8`}>
          {activeTab === 'journal' && (
            <>
              <div className="mb-6 text-center">
                <div className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'} mb-2`}>Today's Wisdom</div>
                <div className="italic text-base md:text-lg">"{quote.text}"</div>
                <div className={`text-sm mt-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>— {quote.author}</div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className={`block text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'} mb-2`}>Today's reflection</label>
                  <textarea
                    value={thought}
                    onChange={(e) => setThought(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none transition-colors ${
                      isDarkMode ? 'bg-purple-800 text-purple-100' : 'bg-purple-50 text-purple-900'
                    }`}
                    placeholder="How are you feeling today? (1-3 lines)"
                    rows="3"
                  />
                </div>
                
                <div className="mb-6">
                  <label className={`block text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'} mb-2`}>Mood</label>
                  <div className="flex justify-between items-center">
                    <Moon size={16} />
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={mood}
                      onChange={(e) => setMood(parseInt(e.target.value))}
                      className={`w-full mx-2 ${isDarkMode ? 'accent-purple-400' : 'accent-purple-700'}`}
                    />
                    <Sun size={16} />
                  </div>
                  <div 
                    className="w-full h-2 mt-2 rounded-full transition-colors duration-300" 
                    style={{ backgroundColor: getMoodColor(mood) }}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={`w-full py-2 rounded-md transition-colors ${
                    isDarkMode 
                      ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  Save Moment
                </button>
              </form>
            </>
          )}
          
          {activeTab === 'history' && (
            <div>
              <h3 className={`text-xl mb-4 font-light ${isDarkMode ? 'text-purple-200' : ''}`}>Your Journey</h3>
              {entries.length === 0 ? (
                <p className={`text-center py-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  Your thoughts will appear here once you start journaling.
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {entries.map(entry => (
                    <div 
                      key={entry.id} 
                      className={`p-3 rounded-md border-l-4 shadow-sm ${
                        isDarkMode ? 'bg-purple-800' : 'bg-white'
                      }`}
                      style={{ borderLeftColor: getMoodColor(entry.mood) }}
                    >
                      <div className={`text-xs mb-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {formatDate(entry.date)}
                      </div>
                      <p>{entry.thought}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'trends' && (
            <div>
              <h3 className={`text-xl mb-4 font-light ${isDarkMode ? 'text-purple-200' : ''}`}>Mood Patterns</h3>
              {entries.length < 3 ? (
                <p className={`text-center py-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  Continue journaling to see your mood patterns emerge.
                </p>
              ) : (
                <div>
                  <div className="flex items-end h-48 mb-2">
                    {entries.slice(0, 14).reverse().map((entry, index) => (
                      <div 
                        key={entry.id}
                        className="flex-1 mx-1 rounded-t transition-all"
                        style={{ 
                          height: `${(entry.mood / 5) * 100}%`,
                          backgroundColor: getMoodColor(entry.mood)
                        }}
                        title={`${formatDate(entry.date)}: ${entry.thought}`}
                      />
                    ))}
                  </div>
                  <div className={`h-px w-full ${isDarkMode ? 'bg-purple-700' : 'bg-purple-200'}`} />
                  <div className={`text-xs text-center mt-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    Recent entries (newest on right)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <footer className={`text-center ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} mt-10`}>
  <div className="mb-4">
    <p>Murasaki - Find peace in small moments</p>
    {isMusicPlaying && (
      <div className="flex items-center justify-center mt-2">
        <Music size={14} className="mr-1" />
        <span>Ambient music playing</span>
      </div>
    )}
  </div>
  
  {/* Enhanced copyright footer */}
  <div className={`py-4 border-t ${isDarkMode ? 'border-purple-800' : 'border-purple-200'} flex flex-col items-center`}>
    <p className="font-light tracking-wide text-sm">
      Designed with <span className="text-purple-500">♥</span> by Sayantan Chowdhury
    </p>
    <p className={`mt-1 text-xs ${isDarkMode ? 'text-purple-500' : 'text-purple-400'}`}>
      © {currentYear} All rights reserved
    </p>
  </div>
</footer>
      </div>
    </div>
    </ProtectedRoute>
    
  );
}