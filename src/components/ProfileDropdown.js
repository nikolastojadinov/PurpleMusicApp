import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';

const PREMIUM_AMOUNT = 3.14; // Pi

const formatErrorMessage = (error) => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.error) {
    if (typeof error.error === 'string') return error.error;
    if (error.error.message) return error.error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, loading, loginWithPi, logout, refreshUser } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePiNetworkLogin = async () => {
    setIsOpen(false);
    try {
      await loginWithPi();
      alert('Pi login successful!');
    } catch (error) {
      console.error('Pi Network login failed:', error);
      alert('Login failed: ' + formatErrorMessage(error));
    }
  };


  // Pi Network payment integration (Pi demo flow)

  const handleGoPremium = async () => {
    if (!window.Pi) {
      alert('Pi SDK nije učitan!');
      return;
    }
    if (!user) {
      alert('Morate se prijaviti da biste kupili premium!');
      return;
    }
    const paymentData = {
      amount: PREMIUM_AMOUNT, // Pi iznos
      memo: `PurpleMusic Premium ${PREMIUM_AMOUNT} Pi`,
      metadata: { type: "premium", user: user.username, pi_user_uid: user.pi_user_uid },
    };

    // Callback: kada je payment spreman za server approval
    const onReadyForServerApproval = async (paymentId) => {
      try {
        const apiAxios = (await import('../apiAxios')).default;
  const response = await apiAxios.post('/api/payments/approve', { paymentId, pi_user_uid: user.pi_user_uid || null, user_id: user.id });
        if (!response.data.success) {
          console.warn('[APPROVE FAIL]', response.data);
          // Pokušaj inspect da prikupiš više podataka
            try {
              const inspect = await apiAxios.get(`/api/payments/inspect/${paymentId}`);
              console.warn('[INSPECT]', inspect.data);
            } catch (ie) {
              console.warn('[INSPECT ERROR]', ie?.response?.data || ie.message);
            }
          alert('Approve greška: ' + (response.data.error || 'Nepoznata greška') + (response.data.code ? (' [' + response.data.code + ']') : ''));
        } else {
          console.log('Payment approved na serveru');
        }
      } catch (err) {
        console.error('[APPROVE EXCEPTION]', err);
        alert('Greška (approve) komunikacija: ' + err.message);
      }
    };

    // Callback: kada je payment završen (client dobije txid) => server complete
    const onReadyForServerCompletion = async (paymentId, txid) => {
      try {
        const apiAxios = (await import('../apiAxios')).default;
        const { supabase } = await import('../supabaseClient');
          const response = await apiAxios.post('/api/payments/complete', { paymentId, txid, pi_user_uid: user.pi_user_uid || null, user_id: user.id });
        if (response.data.success) {
          // Calculate premium_until (30 days from now)
          const now = new Date();
          const premiumUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const premiumUntilStr = premiumUntil.toISOString();
          // Update Supabase users table
          const { data, error } = await supabase
            .from('users')
            .update({ is_premium: true, premium_until: premiumUntilStr })
            .eq('id', user.id)
            .select()
            .single();
          if (error) {
            alert('Premium aktiviran, de Supabase update error: ' + error.message);
          } else {
            await refreshUser();
            alert('Plaćanje završeno! Premium aktiviran.');
          }
        } else {
          console.warn('[COMPLETE FAIL]', response.data);
          alert('Complete greška: ' + (response.data.error || 'Nepoznata greška') + (response.data.code ? (' [' + response.data.code + ']') : ''));
        }
      } catch (err) {
        console.error('[COMPLETE EXCEPTION]', err);
        alert('Greška (complete) komunikacija: ' + err.message);
      }
    };

    // Callback: otkazano
    const onCancel = (paymentId) => {
      alert('Plaćanje otkazano.');
    };

    // Callback: greška
    const onError = (error, payment) => {
      alert('Greška u plaćanju: ' + error);
    };

    window.Pi.createPayment(paymentData, {
      onReadyForServerApproval,
      onReadyForServerCompletion,
      onCancel,
      onError,
    });
    setIsOpen(false);
  };

  const handleViewProfile = () => {
    navigate('/profile');
    setIsOpen(false);
    };

    // Logout function
    const handleLogout = async () => {
      setIsOpen(false);
      await logout();
      alert('Logged out!');
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      {/* Profile Icon */}
      <div 
        className="profile-icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>👤</span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="dropdown-arrow"></div>
          
          <div className="dropdown-content">
            {/* View Profile Button */}
            <button
              onClick={handleViewProfile}
              className="dropdown-button view-profile"
            >
              <div className="button-icon profile-icon">👤</div>
              <div className="button-text">
                <div className="button-title">View Profile{user && user.username ? ` – ${user.username}` : ''}</div>
                <div className="button-subtitle">{user && user.username ? user.username : 'Manage your account'}</div>
              </div>
            </button>

            {/* Divider */}
            <div className="dropdown-divider"></div>

              {/* Pi Network Login/Logout Button */}
              {!user ? (
                <button
                  onClick={handlePiNetworkLogin}
                  className="dropdown-button pi-network"
                  disabled={loading}
                >
                  <div className="button-icon pi-icon">π</div>
                  <div className="button-text">
                    <div className="button-title">Login with Pi Network</div>
                    <div className="button-subtitle">{loading ? 'Connecting…' : 'Connect your Pi account'}</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="dropdown-button logout"
                >
                  <div className="button-icon">🚪</div>
                  <div className="button-text">
                    <div className="button-title">Logout</div>
                    <div className="button-subtitle">Sign out of your account</div>
                  </div>
                </button>
              )}

            {/* Divider */}
            <div className="dropdown-divider"></div>

            {/* Go Premium Button / Premium Status */}
            {user && user.is_premium ? (
              <button
                className="dropdown-button premium"
                disabled
                style={{opacity:0.8, cursor:'default'}}
                title={user.premium_until ? `Premium until ${new Date(user.premium_until).toISOString().slice(0,10)}` : 'Premium Member'}
              >
                <div className="button-icon premium-icon">⭐</div>
                <div className="button-text">
                  <div className="button-title">Premium Member</div>
                  <div className="button-subtitle">Until {user.premium_until ? new Date(user.premium_until).toISOString().slice(0,10) : '-'}</div>
                </div>
              </button>
            ) : (
              <button
                onClick={user ? handleGoPremium : undefined}
                className={`dropdown-button premium${!user ? ' disabled' : ''}`}
                disabled={!user}
                title={!user ? 'Login required to upgrade to Premium' : ''}
                style={!user ? {opacity:0.5, cursor:'not-allowed'} : {}}
              >
                <div className="button-icon premium-icon">⭐</div>
                <div className="button-text">
                  <div className="button-title">Go Premium – {PREMIUM_AMOUNT}π</div>
                  <div className="button-subtitle">Full access for {PREMIUM_AMOUNT} Pi</div>
                  {!user && (
                    <div style={{color:'#ffb',fontSize:'12px',marginTop:'4px'}}>Login required to upgrade to Premium</div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}