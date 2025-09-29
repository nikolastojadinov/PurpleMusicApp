import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// ...existing code...
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LikedSongsScreen from './screens/LikedSongsScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import PlaylistDetailScreen from './screens/PlaylistDetailScreen';
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
  // HomeScreen mindig látható, login prompt csak a ProfileDropdown-ban

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
            <Route path="/playlist/:id" element={<PlaylistDetailScreen />} />
            <Route path="/profile" element={<ViewProfileScreen />} />
          </Routes>
        </main>
        <BottomNavigation />
      </Router>
    </div>
  );
}

export default App;