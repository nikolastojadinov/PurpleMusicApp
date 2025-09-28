import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// ...existing code...
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LikedSongsScreen from './screens/LikedSongsScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import ModernAudioPlayer from './components/ModernAudioPlayer';
import { setUserId } from './services/likeService';
// ...existing code...
import './index.css';

function App() {
  // Set demo user on app start for testing like functionality
  useEffect(() => {
    if (!localStorage.getItem('user_id')) {
      setUserId('demo_user_' + Math.random().toString(36).substr(2, 9));
    }
  }, []);
  return (
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
  <BottomNavigation />
      </Router>
    </div>
  );
}

export default App;