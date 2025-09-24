import React from 'react';
import { useNavigate } from 'react-router-dom';
import SongItem from '../components/SongItem';

// Mock data for demonstration
const mockSongs = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    cover: '🎵',
  },
  {
    id: '2',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    cover: '🎶',
  },
  {
    id: '3',
    title: 'Levitating',
    artist: 'Dua Lipa',
    cover: '🎤',
  },
  {
    id: '4',
    title: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    cover: '🎸',
  },
  {
    id: '5',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    cover: '🎧',
  },
  {
    id: '6',
    title: 'Industry Baby',
    artist: 'Lil Nas X & Jack Harlow',
    cover: '🎼',
  },
  {
    id: '7',
    title: 'Bad Habits',
    artist: 'Ed Sheeran',
    cover: '🎺',
  },
  {
    id: '8',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    cover: '🎹',
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