import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LikedSongsScreen from './screens/LikedSongsScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import './index.css';

function App() {
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