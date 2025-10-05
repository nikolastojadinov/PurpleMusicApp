import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';
import { resetPremium } from '../services/premiumService';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  // Premium modal logic moved to PremiumFeatureModalContainer (global)
  const { user, loginWithPi, logout, updateUser } = useAuth(); // updateUser still used for resetPremium force reset
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

  // Premium modal open listener removed (handled globally)

  const handlePiNetworkLogin = async () => {
    try {
      await loginWithPi();
    } catch (e) {
      // Error modal already handled in context
    } finally {
      setIsOpen(false);
    }
  };

  // Restore missing handler (was removed during premium refactor) to prevent runtime ReferenceError
  const handleViewProfile = () => {
    try {
      navigate('/profile');
    } catch (err) {
      console.error('ProfileDropdown crash (navigate profile):', err);
    } finally {
      setIsOpen(false);
    }
  };

  // Premium payment flow moved to global container

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
      {isOpen && (() => {
        try {
          return (
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
                  onClick={()=>{ if(!hasPendingPayment) { window.dispatchEvent(new CustomEvent('pm:openPremiumModal', { detail:{ source:'profileDropdownButton' } })); } }}
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
          );
        } catch (err) {
          console.error('ProfileDropdown crash (render menu):', err);
          return null;
        }
      })()}
      {/* PremiumPlansModal removed (now global) */}
      {showHistory && (
        <PaymentHistoryModal
          onClose={()=>setShowHistory(false)}
          rows={historyRows}
          loading={historyLoading}
          error={historyError}
        />
      )}
      {/* Payment overlay removed (handled in global component if needed) */}
    </div>
  );
}

// Inline modal component (simplified)
// PremiumPlansModal removed from this file

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
            {/* Legal Links */}
            <div className="dropdown-divider"></div>
            <a href="/privacy-policy.html" className="dropdown-button" style={{textDecoration:'none'}}>
              <div className="button-icon" role="img" aria-label="privacy">🔒</div>
              <div className="button-text">
                <div className="button-title">Privacy Policy</div>
                <div className="button-subtitle">How we handle data</div>
              </div>
            </a>
            <a href="/terms-of-service.html" className="dropdown-button" style={{textDecoration:'none'}}>
              <div className="button-icon" role="img" aria-label="terms">📄</div>
              <div className="button-text">
                <div className="button-title">Terms of Service</div>
                <div className="button-subtitle">Your usage agreement</div>
              </div>
            </a>
        </div>
    </div>,
    root
  );
}

// End of ProfileDropdown.js