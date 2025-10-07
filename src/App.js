import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// ...existing code...
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LikedSongsScreen from './screens/LikedSongsScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import PlaylistDetailScreen from './screens/PlaylistDetailScreen';
import ViewProfileScreen from './screens/ViewProfileScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import ModernAudioPlayer from './components/ModernAudioPlayer';
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
import usePiAuth from './hooks/usePiAuth';

function App() {
  const { user: piUser, loading: piLoading, error: piError } = usePiAuth();
  // Auto-detect language once on mount
  useEffect(() => {
    console.log('[DEBUG][App] mount, current path =', window.location.pathname);
    try {
      // Respect new persisted key first, then legacy, else autodetect.
      const persisted = localStorage.getItem('preferredLanguage') || localStorage.getItem('appLanguage');
      if (persisted) {
        console.log('[DEBUG][App] skipping auto-detect; using persisted language', persisted);
        // i18n init may have already set this via lng option; only change if different
        if (i18n.language !== persisted) i18n.changeLanguage(persisted);
        return;
      }
      const detected = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
      const lang = (detected || 'en').split('-')[0];
      console.log('[DEBUG][App] no persisted language, detected ->', lang);
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
          <div className="app">
            <Router>
              {console.log('[DEBUG][App] rendering router with location', window.location.pathname)}
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
                  <Route path="/profile" element={<ViewProfileScreen />} />
                  <Route path="/privacy" element={<PrivacyPolicyScreen />} />
                  <Route path="/terms" element={<TermsOfServiceScreen />} />
                </Routes>
              </main>
              <BottomNavigation />
              <footer style={{marginTop:'auto',padding:'14px 18px 90px',textAlign:'center',fontSize:12,opacity:.4}}>
                <span style={{display:'inline-flex',gap:14,flexWrap:'wrap'}}>
                  <span style={{color:'inherit'}}>© {new Date().getFullYear()} PurpleMusic</span>
                </span>
              </footer>
              {/* Global overlays */}
              <AuthIntroOverlay />
              <AuthModal />
              <PremiumFeatureModalContainer />
            </Router>
          </div>
        </ErrorBoundary>
      </GlobalModalProvider>
    </AuthProvider>
  );
}

export default App;