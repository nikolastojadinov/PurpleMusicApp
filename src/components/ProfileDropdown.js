import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [paymentStatus, setPaymentStatus] = useState(null); // 'approving' | 'completing' | 'done' | 'error'
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
    if (processing) return;
    setProcessing(true);
    setPaymentStatus(null);
    if (!window.Pi) { show('Pi SDK not loaded', { type:'error', autoClose:2500 }); setProcessing(false); return; }
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
      setPaymentStatus('approving');
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
      setPaymentStatus('completing');
      try {
        const apiAxios = (await import('../apiAxios')).default;
        const response = await apiAxios.post('/api/payments/complete', { paymentId, txid, pi_user_uid: user.pi_user_uid });
        if (response.data.success) {
          // Prefer server-returned user row (already includes plan & until). Fallback to activatePremium if missing.
          try {
            let activated = response.data.user;
            if (!activated) {
              activated = await activatePremium({ userId: user.id, planKey: selectedPlan });
            }
            window.localStorage.setItem('pm_user', JSON.stringify(activated));
            updateUser(activated);
            show('Premium activated!', { type:'success', autoClose:2200 });
            setPaymentStatus('done');
            setTimeout(()=>{ setShowPremiumModal(false); }, 400);
          } catch (e) {
            console.error('Activation finalize failed:', e);
            setPaymentStatus('error');
            show('Activation save failed', { type:'error', autoClose:3200 });
          }
        } else {
          console.warn('[COMPLETE FAIL]', response.data);
          setPaymentStatus('error');
          setProcessing(false);
        }
      } catch (err) {
        console.error('[COMPLETE EXCEPTION]', err);
        setPaymentStatus('error');
        setProcessing(false);
      }
    };

    // Callback: otkazano
    const onCancel = (paymentId) => {
      setProcessing(false);
      setPaymentStatus(null);
    };

    // Callback: greška
    const onError = (error, payment) => {
      console.error('[PAYMENT ERROR]', error, payment);
      setProcessing(false);
      setPaymentStatus('error');
      show('Payment error. Please try again.', { type:'error', autoClose:3000 });
    };

    try {
      window.Pi.createPayment(paymentData, {
        onReadyForServerApproval,
        onReadyForServerCompletion,
        onCancel,
        onError,
      });
      // Keep modal open & processing state until callbacks advance.
      setIsOpen(false);
    } catch (e) {
      console.error('createPayment threw synchronously:', e);
      setProcessing(false);
      setPaymentStatus('error');
      show('Failed to start payment', { type:'error', autoClose:3000 });
    }
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
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{ setMounted(true); document.body.style.overflow='hidden'; return ()=>{ document.body.style.overflow=''; }; }, []);
  if (!mounted) return null;
  const root = document.getElementById('root') || document.body;
  return createPortal(
    <div
      role="dialog" aria-modal="true" onClick={onClose}
      style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', zIndex:100000}}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          position:'absolute', left:'50%', transform:'translateX(-50%)', top:'calc(env(safe-area-inset-top,0px) + 68px)',
          width:'min(90vw,400px)', maxWidth:400, display:'flex', flexDirection:'column',
          background:'linear-gradient(145deg,#141414,#1f1f23)', border:'1px solid #2e2e2e', borderRadius:24,
          boxShadow:'0 20px 50px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)',
          maxHeight:'calc(80vh - env(safe-area-inset-bottom,0px))', overflow:'hidden'
        }}
      >
        <button onClick={onClose} aria-label="Close" style={{position:'absolute', top:10, right:10, width:38, height:38, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#ddd', fontSize:22, borderRadius:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>×</button>
        <div style={{padding:'30px 26px 20px', overflowY:'auto', flex:1, minHeight:0}}>
          <h3 style={{margin:0, fontSize:24, fontWeight:700, textAlign:'center', letterSpacing:.5, background:'linear-gradient(90deg,#fff,#d1d1d1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>Choose Your Plan</h3>
          <div style={{marginTop:20, display:'flex', flexDirection:'column', gap:14}}>
            {Object.entries(PREMIUM_PLANS).map(([key, plan]) => {
              const active = key === selectedPlan;
              return (
                <button key={key} onClick={()=>setSelectedPlan(key)} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px 16px', borderRadius:16, border:active?'2px solid #1db954':'1px solid #2e2e2e', background: active ? 'linear-gradient(135deg,#1db95433,#1db95411)' : '#181818', cursor:'pointer', transition:'all .25s', boxShadow: active ? '0 0 0 1px #1db95455, 0 4px 18px -6px rgba(0,0,0,0.6)' : '0 2px 10px -4px rgba(0,0,0,0.5)'}}>
                  <div style={{textAlign:'left'}}>
                    <div style={{fontWeight:600,fontSize:15,textTransform:'capitalize'}}>{key} Plan</div>
                    <div style={{fontSize:12,opacity:.7}}>{key==='weekly'?'7 days access': key==='monthly'?'30 days access':'1 year access'}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:15}}>{plan.amount}π</div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{padding:'16px 24px 24px', borderTop:'1px solid #262626', display:'flex', flexDirection:'column', gap:12, background:'linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))'}}>
          <button disabled={processing} onClick={onConfirm} style={{width:'100%', background: processing ? '#1db95488' : 'linear-gradient(135deg,#1db954,#169943)', color:'#fff', padding:'14px 18px', border:'none', borderRadius:16, fontWeight:700, letterSpacing:.5, fontSize:15, cursor:processing?'wait':'pointer', boxShadow:'0 6px 18px -6px rgba(0,0,0,0.55)'}}>
            {processing ? (
              paymentStatus === 'approving' ? 'Authorizing…' :
              paymentStatus === 'completing' ? 'Finalizing…' :
              paymentStatus === 'done' ? 'Activated!' : 'Processing…'
            ) : `Activate ${selectedPlan.charAt(0).toUpperCase()+selectedPlan.slice(1)} Plan`}
          </button>
          {!processing && paymentStatus==='error' && (
            <div style={{fontSize:12, color:'#f88', textAlign:'center'}}>Payment failed. You can retry.</div>
          )}
          <div style={{fontSize:11, opacity:.55, textAlign:'center', lineHeight:1.4}}>Your Pi wallet will process a one-time payment. Premium auto-expires after the selected period.</div>
        </div>
      </div>
    </div>,
    root
  );
}