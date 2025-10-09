import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// ...existing code...
import HomeScreen from './screens/HomeScreen';
// Removed non-essential screens in minimal reset
import ViewProfileScreen from './screens/ViewProfileScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import YoutifyShell from './components/YoutifyShell';
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
// Removed YouTube context and player in minimal reset
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
              <YoutifyShell>
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/profile" element={<ViewProfileScreen />} />
                    <Route path="/privacy" element={<PrivacyPolicyScreen />} />
                    <Route path="/terms" element={<TermsOfServiceScreen />} />
                  </Routes>
                </main>
              </YoutifyShell>
              {/* Global overlays */}
              <AuthIntroOverlay />
              <AuthModal />
              <PremiumFeatureModalContainer />
              {/* YouTube player removed in minimal reset */}
            </Router>
          </div>
        </ErrorBoundary>
      </GlobalModalProvider>
    </AuthProvider>
  );
}

export default App;