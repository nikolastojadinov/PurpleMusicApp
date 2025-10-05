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
  const [paymentError, setPaymentError] = useState(null);
  const paymentMetaRef = useRef({ paymentId: null, txid: null, plan: null });
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const { user, loginWithPi, logout, updateUser } = useAuth();
  const { show } = useGlobalModal();

  // New state for latest payment polling
  const [latestPayment, setLatestPayment] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Payment history modal states
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyError, setHistoryError] = useState(null);

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

  // Polling for latest payment status
  useEffect(()=>{
    let pollId;
    async function pollLatest() {
      if (!user) return;
      try {
        setCheckingPayment(true);
        const apiAxios = (await import('../apiAxios')).default;
        const resp = await apiAxios.get('/api/payments/latest', { params: { pi_user_uid: user.pi_user_uid }});
        if (resp.data?.success) {
          setLatestPayment(resp.data.payment || null);
          if (resp.data.userUpgraded) {
            // refresh user state from local storage fetch or simply mark premium true
            const refreshed = { ...user, is_premium: true, premium_plan: resp.data.payment?.plan_type, premium_until: resp.data.premium_until };
            window.localStorage.setItem('pm_user', JSON.stringify(refreshed));
            updateUser(refreshed);
          }
        }
      } catch(e) {
        // ignore
      } finally { setCheckingPayment(false); }
    }
    if (user) {
      pollLatest();
      pollId = setInterval(()=>{ pollLatest(); }, 15000); // every 15s while dropdown mounted
    }
    return ()=>{ if (pollId) clearInterval(pollId); };
  }, [user]);

  // Global event listener to open premium modal from anywhere (guests OR non-premium users)
  useEffect(()=>{
    const handler = () => {
      const isPremium = !!user?.is_premium; // unify naming
      if (isPremium) return; // premium users never see modal
      setShowPremiumModal(true);
    };
    window.addEventListener('pm:openPremiumModal', handler);
    return ()=> window.removeEventListener('pm:openPremiumModal', handler);
  }, [user?.is_premium]);

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
    if (processing || hasPendingPayment) return;
    setProcessing(true);
    setPaymentStatus(null);
    setPaymentError(null);
    if (!window.Pi) { show('Pi SDK not loaded', { type:'error', autoClose:2500 }); setProcessing(false); return; }
    if (!user) return;

    // Ensure we have payments scope (if user logged in before adding it)
    try {
      if (window.Pi && window.Pi.authenticate) {
        // Lightweight re-auth only if payments scope missing
        // We can't directly introspect scopes; attempt a silent auth pattern
      }
    } catch(_) {}
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
      paymentMetaRef.current.paymentId = paymentId;
      paymentMetaRef.current.plan = selectedPlan;
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
        setPaymentError('Approval step failed');
      }
    };

    // Callback: kada je payment završen (client dobije txid) => server complete
    const onReadyForServerCompletion = async (paymentId, txid) => {
      setPaymentStatus('completing');
      paymentMetaRef.current.txid = txid;
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
            setTimeout(()=>{ setShowPremiumModal(false); setProcessing(false); }, 400);
          } catch (e) {
            console.error('Activation finalize failed:', e);
            setPaymentStatus('error');
            setPaymentError('Activation save failed');
            show('Activation save failed', { type:'error', autoClose:3200 });
          }
        } else {
          console.warn('[COMPLETE FAIL]', response.data);
          setPaymentStatus('error');
          setPaymentError(response.data.error || 'Completion failed');
          setProcessing(false);
        }
      } catch (err) {
        console.error('[COMPLETE EXCEPTION]', err);
        setPaymentStatus('error');
        setPaymentError('Completion exception');
        setProcessing(false);
      }
    };

    // Callback: otkazano
    const onCancel = (paymentId) => {
      setProcessing(false);
      setPaymentStatus(null);
      setPaymentError(null);
    };

    // Callback: greška
    const onError = (error, payment) => {
      console.error('[PAYMENT ERROR]', error, payment);
      setProcessing(false);
      setPaymentStatus('error');
      setPaymentError(error?.message || 'Unknown payment error');
      show('Payment error. Please try again.', { type:'error', autoClose:3000 });
    };

    try {
      let timeoutId;
      const startTs = Date.now();
      const RECOVERY_AFTER_MS = 45000; // fallback verify after 45s if no completion

      const recoveryCheck = async () => {
        const { paymentId } = paymentMetaRef.current;
        if (!paymentId) return; // nothing to recover
        try {
          const apiAxios = (await import('../apiAxios')).default;
            const inspect = await apiAxios.get(`/api/payments/inspect/${paymentId}`);
            const pay = inspect?.data?.payment;
            if (pay) {
              // If server shows completed but client missed callback -> trigger manual complete sequence
              let isCompleted = false;
              const st = pay.status;
              if (typeof st === 'string') isCompleted = st === 'completed';
              else if (st && typeof st === 'object') isCompleted = !!st.developer_completed;
              if (isCompleted) {
                console.log('[RECOVERY] payment completed remotely, invoking complete endpoint again for idempotency');
                setPaymentStatus('completing');
                const txid = pay?.transaction?.txid || pay?.txid || paymentMetaRef.current.txid;
                if (txid) {
                  const response = await apiAxios.post('/api/payments/complete', { paymentId, txid, pi_user_uid: user.pi_user_uid });
                  if (response.data.success) {
                    let activated = response.data.user;
                    if (activated) {
                      window.localStorage.setItem('pm_user', JSON.stringify(activated));
                      updateUser(activated);
                      show('Premium activated (recovered)!', { type:'success', autoClose:2600 });
                      setPaymentStatus('done');
                      setProcessing(false);
                      setTimeout(()=>{ setShowPremiumModal(false); }, 400);
                    }
                  }
                }
              }
            }
        } catch (e) {
          console.warn('[RECOVERY] inspect failed', e?.response?.data || e.message);
        }
      };

      window.Pi.createPayment(paymentData, {
        onReadyForServerApproval,
        onReadyForServerCompletion,
        onCancel,
        onError,
      });
      // Keep modal open & processing state until callbacks advance.
      setIsOpen(false);
      timeoutId = setTimeout(()=>{
        if (!['done'].includes(paymentStatus)) {
          console.log('[PAYMENT TIMEOUT] triggering recovery inspect after', Date.now()-startTs,'ms');
          recoveryCheck();
        }
      }, RECOVERY_AFTER_MS);
    } catch (e) {
      console.error('createPayment threw synchronously:', e);
      setProcessing(false);
      setPaymentStatus('error');
      setPaymentError('Failed to start payment');
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

  const hasPendingPayment = !!latestPayment && latestPayment.status === 'pending';
  const hasRejectedPayment = !!latestPayment && latestPayment.status === 'rejected';

  // Payment history fetch function
  async function openHistory() {
    if (!user) return;
    setShowHistory(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const apiAxios = (await import('../apiAxios')).default;
      const resp = await apiAxios.get('/api/payments/history', { params: { pi_user_uid: user.pi_user_uid, limit: 10 }});
      if (resp.data?.success) setHistoryRows(resp.data.payments || []);
      else setHistoryError(resp.data.error || 'Failed to load history');
    } catch(e) {
      setHistoryError(e.message || 'Failed to load history');
    } finally { setHistoryLoading(false); }
  }

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
                  onClick={()=>{ if(!hasPendingPayment) { setShowPremiumModal(true);} }}
                  className={`dropdown-button premium${hasPendingPayment ? ' disabled' : ''}`}
                  disabled={hasPendingPayment}
                  title={hasPendingPayment ? 'Payment pending confirmation' : hasRejectedPayment ? 'Previous payment failed, you can retry.' : ''}
                  style={hasPendingPayment ? {opacity:0.5, cursor:'not-allowed'} : hasRejectedPayment ? {borderColor:'#a33'} : {}}
                >
                  <div className="button-icon premium-icon">⭐</div>
                  <div className="button-text">
                    <div className="button-title">{hasPendingPayment ? 'Payment Pending…' : hasRejectedPayment ? 'Retry Premium Payment' : 'Go Premium'}</div>
                    <div className="button-subtitle">{hasPendingPayment ? 'Awaiting confirmation' : hasRejectedPayment ? 'Previous attempt failed' : 'Unlock all features'}</div>
                  </div>
                </button>
                {hasPendingPayment && (
                  <div style={{fontSize:11, color:'#ffa', textAlign:'center', lineHeight:1.4}}>
                    Your previous payment is still pending. Please wait or check Pi app.
                  </div>
                )}
                {hasRejectedPayment && (
                  <div style={{fontSize:11, color:'#f88', textAlign:'center', lineHeight:1.4}}>
                    Previous payment was rejected. You can try again now.
                  </div>
                )}
                {/* Payment History link */}
                {user && (
                  <button onClick={openHistory} style={{background:'transparent', border:'none', color:'#888', fontSize:11, textDecoration:'underline', cursor:'pointer', alignSelf:'center'}}>
                    Payment History
                  </button>
                )}
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
          paymentStatus={paymentStatus}
          paymentError={paymentError}
        />
      )}
      {showHistory && (
        <PaymentHistoryModal
          onClose={()=>setShowHistory(false)}
          rows={historyRows}
          loading={historyLoading}
          error={historyError}
        />
      )}
      {processing && showPremiumModal && (
        <div className="pm-payment-overlay" role="alert" aria-live="assertive">
          <div className="pm-spinner" />
          <div className="pm-payment-msg">
            {paymentStatus === 'approving' ? 'Authorizing payment…' : paymentStatus === 'completing' ? 'Finalizing transaction…' : paymentStatus === 'done' ? 'Activated!' : 'Starting payment…'}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline modal component (simplified)
function PremiumPlansModal({ onClose, selectedPlan, setSelectedPlan, onConfirm, processing, paymentStatus, paymentError }) {
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
            <div style={{fontSize:12, color:'#f88', textAlign:'center', lineHeight:1.4}}>
              {(paymentError || 'Payment failed.') + ' You can retry.'}
              {paymentError && /approval/i.test(paymentError) && (
                <><br/><span style={{opacity:.7}}>Tip: confirm the payment in the Pi app, then try again.</span></>
              )}
            </div>
          )}
          <div style={{fontSize:11, opacity:.55, textAlign:'center', lineHeight:1.4}}>Your Pi wallet will process a one-time payment. Premium auto-expires after the selected period.</div>
        </div>
      </div>
    </div>,
    root
  );
}

// Payment history modal component
function PaymentHistoryModal({ onClose, rows, loading, error }) {
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{ setMounted(true); document.body.style.overflow='hidden'; return ()=>{ document.body.style.overflow=''; }; }, []);
  if (!mounted) return null;
  const root = document.getElementById('root') || document.body;
  return createPortal(
    <div role="dialog" aria-modal="true" onClick={onClose} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(5px)', zIndex:100001}}>
      <div onClick={e=>e.stopPropagation()} style={{position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:'min(90vw,520px)', maxHeight:'80vh', display:'flex', flexDirection:'column', background:'#161616', border:'1px solid #2a2a2a', borderRadius:22, boxShadow:'0 18px 40px -10px rgba(0,0,0,.6)', overflow:'hidden'}}>
        <button onClick={onClose} aria-label="Close" style={{position:'absolute', top:10, right:10, width:38, height:38, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#ddd', fontSize:22, borderRadius:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>×</button>
        <div style={{padding:'26px 26px 14px'}}>
          <h3 style={{margin:0, fontSize:22, fontWeight:700, letterSpacing:.4, background:'linear-gradient(90deg,#fff,#ddd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>Payment History</h3>
          <p style={{margin:'10px 0 0', fontSize:12, opacity:.65}}>Recent premium payments (latest first).</p>
        </div>
        <div style={{flex:1, overflowY:'auto', padding:'0 20px 20px'}}>
          {loading && <div style={{padding:20, fontSize:13, opacity:.7}}>Loading…</div>}
          {error && !loading && <div style={{padding:20, fontSize:13, color:'#f77'}}>Error: {error}</div>}
          {!loading && !error && rows.length === 0 && (
            <div style={{padding:20, fontSize:13, opacity:.7}}>No payments yet.</div>
          )}
          {!loading && !error && rows.length > 0 && (
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
              <thead>
                <tr style={{textAlign:'left', borderBottom:'1px solid #2a2a2a'}}>
                  <th style={{padding:'8px 6px', fontWeight:600}}>Plan</th>
                  <th style={{padding:'8px 6px', fontWeight:600}}>Status</th>
                  <th style={{padding:'8px 6px', fontWeight:600}}>TxID</th>
                  <th style={{padding:'8px 6px', fontWeight:600}}>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{borderBottom:'1px solid #242424'}}>
                    <td style={{padding:'8px 6px', textTransform:'capitalize'}}>{r.plan_type || '-'}</td>
                    <td style={{padding:'8px 6px'}}>{r.status}</td>
                    <td style={{padding:'8px 6px', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis'}}>{r.txid || 'N/A'}</td>
                    <td style={{padding:'8px 6px'}}>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{padding:'12px 20px', borderTop:'1px solid #242424', display:'flex', justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{background:'#262626', color:'#eee', border:'1px solid #333', padding:'8px 16px', borderRadius:10, cursor:'pointer', fontSize:13}}>Close</button>
        </div>
      </div>
    </div>,
    root
  );
}