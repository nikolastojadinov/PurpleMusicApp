import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import { PREMIUM_PLANS } from '../services/premiumService';
import { activatePremium, resetPremium } from '../services/premiumService';
// Passive pending-session checker (no Pi payment API calls)
import { logPendingPaymentSession } from '../services/paymentSessionWrapper';

// This container globalizes the Premium plans modal and payment flow.
// It reuses the previous logic that lived in ProfileDropdown.

export default function PremiumFeatureModalContainer() {
  const { user, updateUser } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'approving' | 'completing' | 'done' | 'error'
  const [paymentError, setPaymentError] = useState(null);
  const paymentMetaRef = useRef({ paymentId: null, txid: null, plan: null });

  // Passive (one-time) check for any heuristic pending payment session.
  // Requirements: no Pi.createPayment / P.Payment.* calls; console logging only.
  useEffect(() => {
    try {
      logPendingPaymentSession();
    } catch (e) {
      console.warn('[PremiumFeatureModalContainer] Pending payment check failed (passive):', e);
    }
  }, []);

  // Listener for global openPremiumModal events.
  useEffect(() => {
    console.log('[PremiumFeatureModalContainer] Modal listener active');
    const handler = (e) => {
      console.log('[PremiumFeatureModalContainer] Event received', e?.detail);
      if (user?.is_premium) return; // premium users shouldn't see it
      setShowPremiumModal(true);
    };
    window.addEventListener('pm:openPremiumModal', handler);
    return () => window.removeEventListener('pm:openPremiumModal', handler);
  }, [user?.is_premium]);

  const hasPending = false; // We keep global container minimal; pending state is still visible via dropdown logic.

  const handleGoPremium = async () => {
    if (processing) return;
    setProcessing(true);
    setPaymentStatus(null);
    setPaymentError(null);
    if (!window.Pi) { setProcessing(false); setPaymentError('Pi SDK not loaded'); return; }
    if (!user) { setProcessing(false); setPaymentError('Login required'); return; }
    const plan = PREMIUM_PLANS[selectedPlan];
    if (!plan) { setProcessing(false); setPaymentError('Invalid plan'); return; }
    const paymentData = {
      amount: plan.amount,
      memo: `PurpleMusic Premium ${selectedPlan} ${plan.amount} Pi`,
      metadata: { type: 'premium', plan: selectedPlan, user: user.username, pi_user_uid: user.pi_user_uid },
    };

    const onReadyForServerApproval = async (paymentId) => {
      setPaymentStatus('approving');
      paymentMetaRef.current.paymentId = paymentId;
      paymentMetaRef.current.plan = selectedPlan;
      try {
        const apiAxios = (await import('../apiAxios')).default;
        await apiAxios.post('/api/payments/approve', { paymentId, pi_user_uid: user.pi_user_uid });
      } catch (e) {
        setPaymentError('Approval failed');
      }
    };

    const onReadyForServerCompletion = async (paymentId, txid) => {
      setPaymentStatus('completing');
      paymentMetaRef.current.txid = txid;
      try {
        const apiAxios = (await import('../apiAxios')).default;
        const response = await apiAxios.post('/api/payments/complete', { paymentId, txid, pi_user_uid: user.pi_user_uid });
        if (response.data.success) {
          try {
            let activated = response.data.user;
            if (!activated) {
              activated = await activatePremium({ userId: user.id, planKey: selectedPlan });
            }
            window.localStorage.setItem('pm_user', JSON.stringify(activated));
            updateUser(activated);
            setPaymentStatus('done');
            setTimeout(()=>{ setShowPremiumModal(false); setProcessing(false); }, 400);
          } catch (e) {
            setPaymentStatus('error');
            setPaymentError('Activation failed');
          }
        } else {
          setPaymentStatus('error');
          setPaymentError(response.data.error || 'Completion failed');
          setProcessing(false);
        }
      } catch (err) {
        setPaymentStatus('error');
        setPaymentError('Completion error');
        setProcessing(false);
      }
    };

    const onCancel = () => {
      setProcessing(false);
      setPaymentStatus(null);
      setPaymentError(null);
    };
    const onError = (error) => {
      setProcessing(false);
      setPaymentStatus('error');
      setPaymentError(error?.message || 'Payment error');
    };

    try {
      window.Pi.createPayment(paymentData, {
        onReadyForServerApproval,
        onReadyForServerCompletion,
        onCancel,
        onError,
      });
    } catch (e) {
      setProcessing(false);
      setPaymentStatus('error');
      setPaymentError('Failed to start payment');
    }
  };

  // Allow guests (no user) to see modal. Only block for already premium.
  if (!showPremiumModal || user?.is_premium) return null;
  return (
    <PremiumPlansModal
      onClose={() => setShowPremiumModal(false)}
      selectedPlan={selectedPlan}
      setSelectedPlan={setSelectedPlan}
      onConfirm={handleGoPremium}
      processing={processing}
      paymentStatus={paymentStatus}
      paymentError={paymentError}
      hasPending={hasPending}
    />
  );
}

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
            </div>
          )}
          <div style={{fontSize:11, opacity:.55, textAlign:'center', lineHeight:1.4}}>Your Pi wallet will process a one-time payment. Premium auto-expires after the selected period.</div>
        </div>
      </div>
    </div>,
    root
  );
}
