import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// ...existing code...
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LikedSongsScreen from './screens/LikedSongsScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import ViewProfileScreen from './screens/ViewProfileScreen';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import ModernAudioPlayer from './components/ModernAudioPlayer';
import { isUserLoggedIn, getCurrentUser } from './services/userService';
// ...existing code...
import './index.css';

function App() {
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const handleStorage = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Ha nincs user, mutassuk a login képernyőt
  if (!user) {
    return (
      <div className="app">
        <Header />
        <main className="main-content">
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h2>Please log in with Pi Network to continue</h2>
            <p>Click the profile icon (👤) in the top right to log in.</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

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
            <Route path="/profile" element={<ViewProfileScreen />} />
          </Routes>
        </main>
        <BottomNavigation />
      </Router>
    </div>
  );
}

export default App;