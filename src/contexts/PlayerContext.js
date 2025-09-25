import React, { createContext, useContext, useState } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes default
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const playSong = (song, newPlaylist = null, index = 0) => {
    setCurrentSong(song);
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      setCurrentIndex(index);
    }
    setIsPlaying(true);
    setProgress(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    if (playlist.length === 0) return;
    
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    
    setCurrentIndex(nextIndex);
    setCurrentSong(playlist[nextIndex]);
    setProgress(0);
  };

  const previousSong = () => {
    if (playlist.length === 0) return;
    
    let prevIndex;
    if (progress > 10) {
      // If more than 10 seconds played, restart current song
      setProgress(0);
      return;
    }
    
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    }
    
    setCurrentIndex(prevIndex);
    setCurrentSong(playlist[prevIndex]);
    setProgress(0);
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
    setProgress(newProgress);
  };

  const openFullScreen = () => {
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
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
    playSong,
    togglePlay,
    nextSong,
    previousSong,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    setVolume,
    openFullScreen,
    closeFullScreen
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};