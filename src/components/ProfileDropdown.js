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
        if (result && result.accessToken && result.user) {
          // Pošalji accessToken backendu na /api/verify-login
          const apiAxios = (await import('../apiAxios')).default;
          const response = await apiAxios.post('/api/verify-login', { accessToken: result.accessToken });
          if (response.data && response.data.username) {
            // Sačuvaj korisnika na Supabase
            const { supabase } = await import('../supabaseClient');
            const { username } = response.data;
            const { uid, wallet } = result.user;
            const { error } = await supabase
              .from('users')
              .upsert([
                {
                  pi_user_uid: uid,
                  username,
                  wallet_address: wallet,
                  is_premium: false,
                }
              ], { onConflict: ['pi_user_uid'] });
            if (error) {
              alert('Supabase save error: ' + error.message);
            } else {
              alert('Pi login successful! Username: ' + username);
            }
          } else {
            alert('Login failed: ' + (response.data?.error || 'Unknown error'));
          }
        } else {
          alert('No accessToken or user from Pi Network!');
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


  // Pi Network payment integration (Pi demo flow)

  const handleGoPremium = async () => {
    if (!window.Pi) {
      alert('Pi SDK nije učitan!');
      return;
    }
    // Dohvati korisnika iz Supabase (pretpostavljamo da je login već urađen)
    const { supabase } = await import('../supabaseClient');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('is_premium', false)
      .limit(1);
    if (userError || !userData || userData.length === 0) {
      alert('Nema korisnika za premium!');
      return;
    }
    const user = userData[0];
    const paymentData = {
      amount: 1, // Pi amount
      memo: "PurpleMusic Premium",
      metadata: { type: "premium", user: user.username, pi_user_uid: user.pi_user_uid },
    };

    // Callback: kada je payment spreman za server approval
    const onReadyForServerApproval = async (paymentId) => {
      try {
        const apiAxios = (await import('../apiAxios')).default;
        const response = await apiAxios.post('/api/payments/approve', { paymentId, pi_user_uid: user.pi_user_uid });
        if (!response.data.success) {
          alert('Greška pri approve: ' + (response.data.error || 'Nepoznata greška'));
        } else {
          console.log('Payment approved na serveru');
        }
      } catch (err) {
        alert('Greška (approve) komunikacija: ' + err.message);
      }
    };

    // Callback: kada je payment završen (client dobije txid) => server complete
    const onReadyForServerCompletion = async (paymentId, txid) => {
      try {
        const apiAxios = (await import('../apiAxios')).default;
        const response = await apiAxios.post('/api/payments/complete', { paymentId, txid, pi_user_uid: user.pi_user_uid });
        if (response.data.success) {
          // Ažuriraj korisnika lokalno
          const { error } = await supabase
            .from('users')
            .update({ is_premium: true })
            .eq('pi_user_uid', user.pi_user_uid);
          if (error) {
            alert('Greška pri lokalnom premium update-u: ' + error.message);
          } else {
            alert('Plaćanje uspešno! Premium aktiviran.');
          }
        } else {
          alert('Greška pri complete: ' + (response.data.error || 'Nepoznata greška'));
        }
      } catch (err) {
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