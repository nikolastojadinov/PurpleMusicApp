import React from 'react';
import { useNavigate } from 'react-router-dom';
import SongItem from '../components/SongItem';

// Mock data with sample audio files
const mockSongs = [
  {
    id: '1',
    title: 'Sample Track 1',
    artist: 'Demo Artist',
    cover: '🎵',
    audioUrl: 'https://www.soundjay.com/misc/sounds-mp3/beep-07a.mp3',
    duration: 10
  },
  {
    id: '2',
    title: 'Sample Track 2',
    artist: 'Demo Band',
    cover: '🎶',
    audioUrl: 'https://www.soundjay.com/misc/sounds-mp3/beep-10a.mp3',
    duration: 8
  },
  {
    id: '3',
    title: 'Sample Track 3',
    artist: 'Test Artist',
    cover: '🎤',
    audioUrl: 'https://www.soundjay.com/misc/sounds-mp3/beep-28a.mp3',
    duration: 12
  },
  {
    id: '4',
    title: 'Sample Track 4',
    artist: 'Music Demo',
    cover: '🎸',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/Tada.wav',
    duration: 15
  },
  {
    id: '5',
    title: 'Sample Track 5',
    artist: 'Audio Test',
    cover: '🎧',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    duration: 20
  },
  {
    id: '6',
    title: 'Sample Track 6',
    artist: 'Sound Demo',
    cover: '🎼',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther30.wav',
    duration: 30
  },
  {
    id: '7',
    title: 'Sample Track 7',
    artist: 'Test Music',
    cover: '🎺',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/Fanfare60.wav',
    duration: 25
  },
  {
    id: '8',
    title: 'Sample Track 8',
    artist: 'Demo Songs',
    cover: '🎹',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
    duration: 28
  },
];

export default function HomeScreen() {
  const navigate = useNavigate();

  const handleSongPress = (song) => {
    navigate('/player', { state: { song } });
  };

  return (
    <div className="home-container">
      <div className="header">
        <h1 className="header-title">MobileBeats</h1>
      </div>
      
      <div className="home-header">
        <p className="home-subtitle">Your Music Library</p>
      </div>
      
      <div className="song-list">
        {mockSongs.map((song) => (
          <SongItem 
            key={song.id} 
            song={song} 
            onPress={() => handleSongPress(song)} 
          />
        ))}
      </div>
    </div>
  );
}