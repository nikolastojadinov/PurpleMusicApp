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
        <main className="main-content" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh'}}>
          <div style={{background:'#222',borderRadius:16,padding:'2rem 3rem',boxShadow:'0 2px 16px #000',textAlign:'center'}}>
            <h2 style={{color:'#fff',fontSize:'2rem',marginBottom:'1rem'}}>Login Required</h2>
            <p style={{color:'#fff',fontSize:'1.2rem',marginBottom:'2rem'}}>Click the profile icon (👤) in the top right to log in with Pi Network.</p>
            <div style={{display:'flex',justifyContent:'center'}}>
              <span style={{fontSize:'3rem',background:'#fff',borderRadius:'50%',padding:'1rem',boxShadow:'0 2px 8px #000'}}>👤</span>
            </div>
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