import React, { useState, useRef, useEffect } from 'react';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    // Pi Network SDK login
    if (window.Pi) {
      const scopes = ['username', 'payments'];
      const onIncompletePaymentFound = (payment) => {
        console.log('Incomplete payment found:', payment);
      };
      try {
        const result = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        // result: { user, accessToken }
        if (result && result.accessToken) {
          // Pošalji accessToken backendu na /api/verify-login
          const { apiAxios } = await import('../apiAxios');
          const response = await apiAxios.post('/verify-login', { accessToken: result.accessToken });
          if (response.data && response.data.username) {
            alert('Pi login successful! Username: ' + response.data.username);
          } else {
            alert('Login failed: ' + (response.data?.error || 'Unknown error'));
          }
        } else {
          alert('No accessToken from Pi Network!');
        }
      } catch (err) {
        alert('Login failed: ' + err);
      }
    } else {
      alert('Pi SDK not loaded!');
    }
    setIsOpen(false);
  };

  // Pi Network login callbacks
  const onLoginSuccess = async (authResult) => {
    // Save user info to Supabase
    const { supabase } = await import('../supabaseClient');
    const { user } = authResult;
    if (user) {
      const { id, username } = user;
      // Upsert user into Supabase 'users' table
      const { error } = await supabase
        .from('users')
        .upsert([{ id, username }], { onConflict: ['id'] });
      if (error) {
        alert('Supabase save error: ' + error.message);
      } else {
        alert('Pi Network login successful! User: ' + JSON.stringify(user));
      }
    } else {
      alert('No user info from Pi Network!');
    }
  };
  const onLoginFailure = (error) => {
    alert('Pi Network login failed: ' + error);
  };

  const handleGoPremium = () => {
    // Pi Network payment integration
    import('../piSdkLoader').then(({ loadPiSDK }) => {
      loadPiSDK((Pi) => {
        Pi.createPayment({
          amount: 1, // 1 Pi
          memo: 'PurpleMusic Premium Upgrade',
          metadata: { type: 'premium' }
        }, onPaymentSuccess, onPaymentFailure);
      });
    });
    setIsOpen(false);
  };

  // Pi Network payment callbacks
  const onPaymentSuccess = async (paymentResult) => {
    // Save payment info to Supabase
    const { supabase } = await import('../supabaseClient');
    const { transaction } = paymentResult;
    if (transaction) {
      const { txid, amount, memo } = transaction;
      const { error } = await supabase
        .from('payments')
        .insert([{ txid, amount, memo }]);
      if (error) {
        alert('Supabase payment save error: ' + error.message);
      } else {
        alert('Payment successful! Transaction: ' + JSON.stringify(transaction));
      }
    } else {
      alert('No transaction info from Pi Network!');
    }
  };
  const onPaymentFailure = (error) => {
    alert('Payment failed: ' + error);
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
            {/* Pi Network Login Button */}
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

            {/* Divider */}
            <div className="dropdown-divider"></div>

            {/* Go Premium Button */}
            <button
              onClick={handleGoPremium}
              className="dropdown-button premium"
            >
              <div className="button-icon premium-icon">⭐</div>
              <div className="button-text">
                <div className="button-title">Go Premium</div>
                <div className="button-subtitle">Upgrade your experience</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}