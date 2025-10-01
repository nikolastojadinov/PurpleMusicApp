import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  // Konstans za premium cenu
  const PREMIUM_AMOUNT = 3.14; // Pi
  const { user, loginWithPi, logout, updateUser } = useAuth();

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
    try {
      await loginWithPi();
    } catch (e) {
      // Error modal already handled in context
    } finally {
      setIsOpen(false);
    }
  };

  // Pi Network login callbacks
    // Nem szükséges, helyette loginOrRegisterUser-t használunk
  const onLoginFailure = (error) => {
    alert('Pi Network login failed: ' + error);
  };


  // Pi Network payment integration (Pi demo flow)

  const handleGoPremium = async () => {
    if (!window.Pi) return; // Could trigger a modal in future
    // Dohvati korisnika iz Supabase (pretpostavljamo da je login već urađen)
    // Use current user from state
    if (!user) return;
    const paymentData = {
      amount: PREMIUM_AMOUNT, // Pi iznos
      memo: `PurpleMusic Premium ${PREMIUM_AMOUNT} Pi`,
      metadata: { type: "premium", user: user.username, pi_user_uid: user.pi_user_uid },
    };

    // Callback: kada je payment spreman za server approval
    const onReadyForServerApproval = async (paymentId) => {
      try {
        const apiAxios = (await import('../apiAxios')).default;
        const response = await apiAxios.post('/api/payments/approve', { paymentId, pi_user_uid: user.pi_user_uid });
        if (!response.data.success) {
          console.warn('[APPROVE FAIL]', response.data);
          // Pokušaj inspect da prikupiš više podataka
            try {
              const inspect = await apiAxios.get(`/api/payments/inspect/${paymentId}`);
              console.warn('[INSPECT]', inspect.data);
            } catch (ie) {
              console.warn('[INSPECT ERROR]', ie?.response?.data || ie.message);
            }
          // TODO integrate modal feedback for payment approve failure
        } else {
          console.log('Payment approved na serveru');
        }
      } catch (err) {
        console.error('[APPROVE EXCEPTION]', err);
  // TODO modal approve exception
      }
    };

    // Callback: kada je payment završen (client dobije txid) => server complete
    const onReadyForServerCompletion = async (paymentId, txid) => {
      try {
        const apiAxios = (await import('../apiAxios')).default;
        const { supabase } = await import('../supabaseClient');
        const response = await apiAxios.post('/api/payments/complete', { paymentId, txid, pi_user_uid: user.pi_user_uid });
        if (response.data.success) {
          // Calculate premium_until (30 days from now)
          const now = new Date();
          const premiumUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const premiumUntilStr = premiumUntil.toISOString();
          // Update Supabase users table
          const { data, error } = await supabase
            .from('users')
            .update({ is_premium: true, premium_until: premiumUntilStr })
            .eq('pi_user_uid', user.pi_user_uid)
            .select()
            .single();
          if (!error) {
            // Save premium status in localStorage
            const updatedUser = { ...user, is_premium: true, premium_until: premiumUntilStr };
            window.localStorage.setItem('pm_user', JSON.stringify(updatedUser));
            // updateUser for context consistency
            updateUser({ is_premium: true, premium_until: premiumUntilStr });
          }
        } else {
          console.warn('[COMPLETE FAIL]', response.data);
        }
      } catch (err) {
        console.error('[COMPLETE EXCEPTION]', err);
      }
    };

    // Callback: otkazano
    const onCancel = (paymentId) => {};

    // Callback: greška
    const onError = (error, payment) => {};

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
    const handleLogout = () => {
      logout();
      setIsOpen(false);
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
                >
                  <div className="button-icon pi-icon">π</div>
                  <div className="button-text">
                    <div className="button-title">Login with Pi Network</div>
                    <div className="button-subtitle">Connect your Pi account</div>
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