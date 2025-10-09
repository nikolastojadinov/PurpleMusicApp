import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// ...existing code...
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LikedSongsScreen from './screens/LikedSongsScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import PlaylistDetailScreen from './screens/PlaylistDetailScreen';
import YTPlaylistScreen from './screens/YTPlaylistScreen.jsx';
import CreatePlaylistScreen from './screens/CreatePlaylistScreen.jsx';
import ViewProfileScreen from './screens/ViewProfileScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
// Removed legacy ModernAudioPlayer import (unused)
// Auth context (restored & improved)
import { AuthProvider } from './context/AuthProvider.jsx';
import { GlobalModalProvider } from './context/GlobalModalContext.jsx';
import AuthIntroOverlay from './components/AuthIntroOverlay';
import AuthModal from './components/AuthModal';
import PremiumFeatureModalContainer from './components/PremiumFeatureModalContainer.jsx';
// ...existing code...
import './index.css';
import './i18n/index.js';
import i18n from './i18n/index.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { YouTubeProvider } from './components/YouTubeContext.jsx';
import UnifiedPlayer from './components/UnifiedPlayer.jsx';
import LyricsView from './components/LyricsView.jsx';
import usePiAuth from './hooks/usePiAuth';

function App() {
  const { loading: piLoading, error: piError } = usePiAuth();
  // Auto-detect language once on mount
  useEffect(() => {
  // console debug removed for CI cleanliness
    try {
      // Respect new persisted key first, then legacy, else autodetect.
      const persisted = localStorage.getItem('preferredLanguage') || localStorage.getItem('appLanguage');
      if (persisted) {
        // i18n init may have already set this via lng option; only change if different
        if (i18n.language !== persisted) i18n.changeLanguage(persisted);
        return;
      }
      const detected = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
      const lang = (detected || 'en').split('-')[0];
      if (i18n.language !== lang) i18n.changeLanguage(lang);
    } catch (e) {
      console.warn('[DEBUG][App] language init failed, defaulting to en', e);
      if (i18n.language !== 'en') i18n.changeLanguage('en');
    }
  }, []);
  return (
    <AuthProvider>
      <GlobalModalProvider>
        <ErrorBoundary>
          <YouTubeProvider>
          <div className="app">
            <Router>
              {piLoading && (
                <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#000',color:'#fff',zIndex:9999,fontSize:16}}>
                  <div>Authenticating with Pi Network…</div>
                </div>
              )}
              {(!piLoading && piError) && (
                <div style={{position:'fixed',top:10,left:'50%',transform:'translateX(-50%)',background:'#2a2a2a',color:'#fff',padding:'8px 14px',borderRadius:12,fontSize:13,zIndex:9999,boxShadow:'0 4px 12px rgba(0,0,0,0.4)'}}>
                  {piError}
                </div>
              )}
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/search" element={<SearchScreen />} />
                  <Route path="/liked" element={<LikedSongsScreen />} />
                  <Route path="/playlists" element={<PlaylistsScreen />} />
                  <Route path="/playlist/:id" element={<PlaylistDetailScreen />} />
                  <Route path="/create-playlist" element={<CreatePlaylistScreen />} />
                  <Route path="/yt/playlist/:id" element={<YTPlaylistScreen />} />
                  <Route path="/profile" element={<ViewProfileScreen />} />
                  <Route path="/privacy" element={<PrivacyPolicyScreen />} />
                  <Route path="/terms" element={<TermsOfServiceScreen />} />
                </Routes>
              </main>
              <BottomNavigation />
              {/* Runtime YouTube key status indicator for Pi Browser diagnostics */}
              {(() => {
                const status = (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_YOUTUBE_API_KEY) ? 'LOADED' : 'MISSING';
                try { console.log('YT KEY STATUS:', status); } catch(_) {}
                const ok = (typeof window !== 'undefined' && window.__ENV__?.VITE_YOUTUBE_API_KEY !== 'MISSING');
                return (
                  <div style={{ position: 'fixed', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 12, pointerEvents:'none', zIndex: 2147483647 }}>
                    <span style={{ color: ok ? '#10B981' : '#EF4444' }}>{ok ? '✅ YouTube key loaded' : '❌ YouTube key missing'}</span>
                  </div>
                );
              })()}
              <footer style={{marginTop:'auto',padding:'14px 18px 90px',textAlign:'center',fontSize:12,opacity:.4}}>
                <span style={{display:'inline-flex',gap:14,flexWrap:'wrap'}}>
                  <span style={{color:'inherit'}}>© {new Date().getFullYear()} PurpleMusic</span>
                </span>
              </footer>
              {/* Global overlays */}
              <AuthIntroOverlay />
              <AuthModal />
              <PremiumFeatureModalContainer />
              <UnifiedPlayer />
              <LyricsView />
            </Router>
          </div>
          </YouTubeProvider>
        </ErrorBoundary>
      </GlobalModalProvider>
    </AuthProvider>
  );
}

export default App;