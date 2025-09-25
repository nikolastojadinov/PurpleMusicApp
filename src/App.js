import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PlayerProvider } from './contexts/PlayerContext';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LikedSongsScreen from './screens/LikedSongsScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import MiniPlayer from './components/MiniPlayer';
import FullScreenPlayer from './components/FullScreenPlayer';
import CompleteMusicPlayer from './components/CompleteMusicPlayer';
import './index.css';

function App() {
  return (
    <PlayerProvider>
      <div className="app">
        <Router>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/liked" element={<LikedSongsScreen />} />
              <Route path="/playlists" element={<PlaylistsScreen />} />
            </Routes>
          </main>
          <CompleteMusicPlayer />
          <BottomNavigation />
          <FullScreenPlayer />
        </Router>
      </div>
    </PlayerProvider>
  );
}

export default App;