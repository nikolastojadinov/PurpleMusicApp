import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PlayerScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { song } = location.state || { 
    song: { 
      title: 'Unknown', 
      artist: 'Unknown', 
      cover: '🎵',
      audioUrl: '',
      duration: 0
    } 
  };
  
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(song.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (song.audioUrl) {
      audioRef.current = new Audio(song.audioUrl);
      audioRef.current.preload = 'metadata';
      audioRef.current.volume = volume; // Set initial volume
      
      // Reset states for new track
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
      
      // Audio event listeners
      const audio = audioRef.current;
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlay = () => setIsLoading(false);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      const handleError = () => {
        setIsLoading(false);
        setIsPlaying(false);
        alert('Greška pri učitavanju audio fajla. Molimo pokušajte ponovo.');
      };
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.pause();
      };
    }
  }, [song.audioUrl]);

  // Sync volume changes to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = async () => {
    if (!audioRef.current || !song.audioUrl) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      alert('Greška pri puštanju muzike. Molimo pokušajte ponovo.');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;

  // Seek to specific time
  const handleSeek = (event) => {
    if (!audioRef.current || !duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Volume control
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Skip forward/backward
  const skipForward = () => {
    if (!audioRef.current) return;
    const newTime = Math.min(currentTime + 10, duration);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    const newTime = Math.max(currentTime - 10, 0);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="player-container">
      <div className="header">
        <button className="header-back" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h2 className="header-subtitle">Now Playing</h2>
        <div></div>
      </div>

      <div className="player-cover-section">
        <div className="player-cover">
          <span>{song.cover}</span>
        </div>
      </div>

      <div className="player-info">
        <h1 className="player-title">{song.title}</h1>
        <p className="player-artist">{song.artist}</p>
      </div>

      <div className="player-progress">
        <div className="progress-bar" onClick={handleSeek}>
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
          <div 
            className="progress-thumb" 
            style={{ left: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-time">
          <span className="time-text">{formatTime(currentTime)}</span>
          <span className="time-text">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-controls">
        <button className="control-button" onClick={skipBackward} title="Nazad 10s">
          ⏮
        </button>

        <button 
          className="play-button" 
          onClick={togglePlayPause}
          disabled={isLoading || !song.audioUrl}
          title={isPlaying ? 'Pauziraj' : 'Pusti'}
        >
          {isLoading ? '⌛' : (isPlaying ? '⏸' : '▶')}
        </button>

        <button className="control-button" onClick={skipForward} title="Napred 10s">
          ⏭
        </button>
      </div>

      <div className="player-bottom">
        <button 
          className="icon-button" 
          onClick={() => handleVolumeChange(volume === 0 ? 1 : 0)}
          title={volume === 0 ? 'Uključi zvuk' : 'Isključi zvuk'}
        >
          {volume === 0 ? '🔇' : '🔊'}
        </button>
        <div className="volume-control">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
        <button 
          className="icon-button"
          onClick={() => alert('Dodaj u favorite (funkcija u razvoju)')}
          title="Dodaj u favorite"
        >
          🤍
        </button>
      </div>

      {!song.audioUrl && (
        <div className="audio-warning">
          <p>⚠️ Audio fajl nije dostupan za ovu pesmu</p>
        </div>
      )}
    </div>
  );
}