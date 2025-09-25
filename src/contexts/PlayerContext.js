import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

// Demo audio URLs (using copyright-free sources)
const demoAudioSources = {
  1: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Blinding Lights
  2: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Watermelon Sugar
  3: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Levitating
  4: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Good 4 U
  5: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Stay
  6: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Anti-Hero
  7: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Flowers
  8: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // As It Was
  9: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // unholy
  10: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Shivers
};

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all') {
        nextSong();
      } else {
        // Check if we're at the end of playlist
        if (currentIndex >= playlist.length - 1) {
          setIsPlaying(false);
        } else {
          nextSong();
        }
      }
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Set initial volume
    audio.volume = volume;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeatMode, currentIndex, playlist.length, volume]);

  // Update volume when changed
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const playSong = async (song, newPlaylist = null, index = 0) => {
    const audio = audioRef.current;
    
    setCurrentSong(song);
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      setCurrentIndex(index);
    }
    
    // Load audio source (using demo source or fallback)
    const audioSource = demoAudioSources[song.id] || demoAudioSources[1];
    if (audio.src !== audioSource) {
      audio.src = audioSource;
    }
    
    setProgress(0);
    
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      }
    }
  };

  const nextSong = () => {
    if (playlist.length === 0) return;
    
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      // Don't wrap around if repeat is off and we're at the end
      if (repeatMode === 'off' && currentIndex >= playlist.length - 1) {
        setIsPlaying(false);
        return;
      }
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    
    setCurrentIndex(nextIndex);
    const nextSong = playlist[nextIndex];
    playSong(nextSong, playlist, nextIndex);
  };

  const previousSong = () => {
    if (playlist.length === 0) return;
    
    const audio = audioRef.current;
    
    // If more than 3 seconds played, restart current song
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    
    let prevIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    }
    
    setCurrentIndex(prevIndex);
    const prevSong = playlist[prevIndex];
    playSong(prevSong, playlist, prevIndex);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextModeIndex = (currentModeIndex + 1) % modes.length;
    setRepeatMode(modes[nextModeIndex]);
  };

  const seekTo = (newProgress) => {
    const audio = audioRef.current;
    if (audio.duration) {
      audio.currentTime = newProgress;
      setProgress(newProgress);
    }
  };

  const openFullScreen = () => {
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
  };

  const setVolumeLevel = (newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    audioRef.current.volume = clampedVolume;
  };

  const value = {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffle,
    repeatMode,
    isFullScreen,
    playlist,
    currentIndex,
    isLoading,
    playSong,
    togglePlay,
    nextSong,
    previousSong,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    setVolume: setVolumeLevel,
    openFullScreen,
    closeFullScreen
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};