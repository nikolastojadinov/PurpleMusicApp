import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';
import { PREMIUM_PLANS, activatePremium, resetPremium } from '../services/premiumService';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  // State for selecting plan
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const { user, loginWithPi, logout, updateUser } = useAuth();
  const { show } = useGlobalModal();

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
    show('Pi Network login failed: ' + error, { type: 'error', autoClose: 4000 });
  };


  // Pi Network payment integration (Pi demo flow)

  const handleGoPremium = async () => {
    setProcessing(true);
    if (!window.Pi) { show('Pi SDK not loaded', { type:'error', autoClose:2500 }); return; }
    if (!user) return;
    const plan = PREMIUM_PLANS[selectedPlan];
    if (!plan) { show('Invalid plan selected', { type:'error', autoClose:2500 }); return; }
    const paymentData = {
      amount: plan.amount,
      memo: `PurpleMusic Premium ${selectedPlan} ${plan.amount} Pi`,
      metadata: { type: 'premium', plan: selectedPlan, user: user.username, pi_user_uid: user.pi_user_uid },
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
        const response = await apiAxios.post('/api/payments/complete', { paymentId, txid, pi_user_uid: user.pi_user_uid });
        if (response.data.success) {
          // DB activation (includes premium_plan & premium_until)
          try {
            const activated = await activatePremium({ userId: user.id, planKey: selectedPlan });
            window.localStorage.setItem('pm_user', JSON.stringify(activated));
            updateUser(activated);
            show('Premium activated!', { type:'success', autoClose:2200 });
          } catch (e) {
            console.error('Activation failed:', e);
            show('Activation save failed', { type:'error', autoClose:3200 });
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
    setShowPremiumModal(false);
    setProcessing(false);
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
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <button
                  onClick={()=>{ if(user) { setShowPremiumModal(true);} }}
                  className={`dropdown-button premium${!user ? ' disabled' : ''}`}
                  disabled={!user}
                  title={!user ? 'Login required to upgrade to Premium' : ''}
                  style={!user ? {opacity:0.5, cursor:'not-allowed'} : {}}
                >
                  <div className="button-icon premium-icon">⭐</div>
                  <div className="button-text">
                    <div className="button-title">Go Premium</div>
                    <div className="button-subtitle">Unlock all features</div>
                  </div>
                </button>
                {user && (window.location.search.includes('pmDebug=1')) && (
                  <button
                    onClick={async ()=>{
                      try {
                        const updated = await resetPremium(user.id);
                        window.localStorage.setItem('pm_user', JSON.stringify(updated));
                        updateUser(updated);
                      } catch(e) { console.error('Reset failed', e); }
                    }}
                    style={{background:'transparent', border:'1px solid #933', color:'#f88', padding:'8px 12px', borderRadius:10, fontSize:12, cursor:'pointer'}}
                    title="Force reset premium status"
                  >Force Premium Reset</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {showPremiumModal && user && (
        <PremiumPlansModal
          onClose={()=>setShowPremiumModal(false)}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          onConfirm={handleGoPremium}
          processing={processing}
        />
      )}
    </div>
  );
}

// Inline modal component (simplified)
function PremiumPlansModal({ onClose, selectedPlan, setSelectedPlan, onConfirm, processing }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:99999,padding:'20px'}}>
      <div style={{background:'#111',border:'1px solid #333',borderRadius:20,padding:'28px 24px',width:'100%',maxWidth:420,position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:10,right:12,background:'transparent',border:'none',color:'#aaa',fontSize:24,cursor:'pointer'}}>×</button>
        <h3 style={{margin:'0 0 18px',fontSize:22,fontWeight:600,textAlign:'center'}}>Choose Your Plan</h3>
        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
          {Object.entries(PREMIUM_PLANS).map(([key, plan]) => {
            const active = key === selectedPlan;
            return (
              <button key={key} onClick={()=>setSelectedPlan(key)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderRadius:14,border:active?'2px solid #1db954':'1px solid #333',background:active?'#1db95422':'#1a1a1a',cursor:'pointer'}}>
                <div style={{textAlign:'left'}}>
                  <div style={{fontWeight:600,fontSize:15,textTransform:'capitalize'}}>{key} Plan</div>
                  <div style={{fontSize:12,opacity:.7}}>{key==='weekly'?'7 days access': key==='monthly'?'30 days access':'1 year access'}</div>
                </div>
                <div style={{fontWeight:700,fontSize:15}}>{plan.amount}π</div>
              </button>
            );
          })}
        </div>
        <button disabled={processing} onClick={onConfirm} style={{width:'100%',background:'#1db954',color:'#fff',padding:'14px 18px',border:'none',borderRadius:14,fontWeight:700,letterSpacing:.5,fontSize:15,cursor:processing?'wait':'pointer'}}>
          {processing ? 'Processing…' : `Activate ${selectedPlan.charAt(0).toUpperCase()+selectedPlan.slice(1)} Plan`}
        </button>
        <div style={{marginTop:14,fontSize:11,opacity:.55,textAlign:'center'}}>Your Pi wallet will be used for this one-time premium activation. Auto-expire applies.</div>
      </div>
    </div>
  );
}