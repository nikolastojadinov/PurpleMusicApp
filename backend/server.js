const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
// Supabase setup
const SUPABASE_URL = 'https://ofkfygqrfenctzitigae.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('[BOOT] Missing SUPABASE_SERVICE_KEY environment variable. Set it in Render -> Environment.');
}
const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;
const verifyLogin = require('./api/verify-login');

// Pi API key presence log
if (!process.env.PI_API_KEY) {
  console.error('[BOOT] Missing PI_API_KEY environment variable. Set PI_API_KEY in Render Environment (Server API Key from Pi Developer dashboard).');
}

const app = express();

app.use(cors());
app.use(bodyParser.json());


app.post('/api/verify-login', verifyLogin);

// Premium reset endpoint (admin/debug)
app.post('/api/premium/reset', async (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ success:false, error:'Missing user_id' });
  if (!supabase) return res.status(500).json({ success:false, error:'Supabase not initialized' });
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_premium: false, premium_until: null, premium_plan: null })
      .eq('id', user_id)
      .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, premium_plan, created_at')
      .single();
    if (error) return res.status(500).json({ success:false, error:error.message });
    return res.json({ success:true, user:data });
  } catch (e) {
    return res.status(500).json({ success:false, error:e.message });
  }
});

// Pi Network payment verification endpoint
app.post('/api/verify-payment', async (req, res) => {
  const startedAt = Date.now();
  // Debug: ulazni payload (sanitized)
  console.log('[verify-payment] incoming body =', JSON.stringify(req.body));
  const { paymentId, pi_user_uid } = req.body || {};
  if (!paymentId) {
    console.warn('[verify-payment] Missing paymentId field');
    return res.status(400).json({ success: false, error: 'Missing paymentId' });
  }
  if (!pi_user_uid) {
    console.warn('[verify-payment] Missing pi_user_uid field');
    return res.status(400).json({ success: false, error: 'Missing pi_user_uid' });
  }
  try {
    const piApiKey = process.env.PI_API_KEY; // Server-side Pi API key
    if (!piApiKey) {
      console.error('[verify-payment] PI_API_KEY not set in environment');
      return res.status(500).json({ success: false, error: 'PI_API_KEY not configured on server' });
    }
    const piPaymentUrl = `https://api.minepi.com/v2/payments/${paymentId}`;
    console.log('[verify-payment] Fetching from Pi API:', piPaymentUrl);
    let payment;
    try {
      const piResponse = await axios.get(piPaymentUrl, {
        headers: { Authorization: `Key ${piApiKey}` }
      });
      payment = piResponse.data;
    } catch (piErr) {
      const status = piErr?.response?.status;
      const data = piErr?.response?.data;
      console.error('[verify-payment] Pi API request failed', { status, data });
      if (status === 401) {
        return res.status(502).json({ success: false, error: 'Pi API authentication failed (401). Check PI_API_KEY.' });
      }
      if (status === 404) {
        return res.status(400).json({ success: false, error: 'Unknown paymentId (404 from Pi API)' });
      }
      return res.status(502).json({ success: false, error: 'Pi API error', details: data });
    }

    // Log kratak rezime payment objekta (bez potencijalno osetljivih polja)
    try {
      console.log('[verify-payment] payment summary =', JSON.stringify({
        id: payment.identifier || payment.id || payment.payment_id || paymentId,
        status: payment.status,
        amount: payment.amount,
        metadata: payment.metadata,
        created_at: payment.created_at
      }));
    } catch (_) {}

    if (!(payment && payment.status)) {
      console.warn('[verify-payment] Payment response missing status');
      return res.status(502).json({ success: false, error: 'Invalid payment response from Pi API' });
    }

    if (payment.status === 'completed' && payment.metadata?.type === 'premium') {
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized (missing SUPABASE_SERVICE_KEY)' });
      }
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('pi_user_uid', pi_user_uid);
      if (error) {
        console.error('[verify-payment] Supabase update error:', error.message);
        return res.status(500).json({ success: false, error: 'Supabase update error: ' + error.message });
      }
      console.log('[verify-payment] PREMIUM ACTIVATED for', pi_user_uid, 'in', Date.now() - startedAt, 'ms');
      return res.json({ success: true, paymentStatus: payment.status });
    }

    console.warn('[verify-payment] Payment not completed or invalid metadata', {
      status: payment.status,
      metadata: payment.metadata
    });
    return res.status(400).json({ success: false, error: 'Payment not completed or invalid metadata.type', status: payment.status });
  } catch (err) {
    console.error('[verify-payment] Unhandled error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// --- New Pi Payments Flow Endpoints (approve & complete) ---
// Approve payment (server side) when client notifies onReadyForServerApproval
async function approveHandler(req, res) {
  const { paymentId, pi_user_uid } = req.body || {};
  const debug = process.env.NODE_ENV !== 'production';
  if (debug) console.log('[approve] incoming body:', req.body);
  if (!paymentId) {
    console.warn('[approve] early exit: missing paymentId');
    return res.status(400).json({ success: false, error: 'Missing paymentId', code: 'NO_PAYMENT_ID' });
  }
  const piApiKey = process.env.PI_API_KEY;
  if (!piApiKey) {
    console.error('[approve] PI_API_KEY not set');
    return res.status(500).json({ success: false, error: 'PI_API_KEY not configured', code: 'NO_PI_KEY' });
  }
  try {
    const paymentUrl = `https://api.minepi.com/v2/payments/${paymentId}`;
    const fetchResp = await axios.get(paymentUrl, { headers: { Authorization: `Key ${piApiKey}` } });
    const payment = fetchResp.data;
    // Log a sanitized snapshot for debugging
    try {
      console.log('[approve] fetched payment snapshot:', JSON.stringify({
        id: payment.identifier || payment.id || payment.payment_id || paymentId,
        status: payment.status,
        amount: payment.amount,
        memo: payment.memo,
        metadata: payment.metadata,
        created_at: payment.created_at
      }));
    } catch (_) {}

    // Some Pi API versions return status as string, newer return an object with flags.
    const rawStatus = payment.status;
    const statusIsString = typeof rawStatus === 'string';
    const statusObj = (!statusIsString && rawStatus && typeof rawStatus === 'object') ? rawStatus : null;

    // Derive normalized states
    let isPendingOrCreated = false;
    let isAlreadyApproved = false;
    let isAlreadyCompleted = false;

    if (statusIsString) {
      const s = rawStatus;
      if (['pending', 'created'].includes(s)) isPendingOrCreated = true;
      else if (s === 'approved') isAlreadyApproved = true;
      else if (s === 'completed') isAlreadyCompleted = true;
    } else if (statusObj) {
      // Object form: determine from flags
      if (statusObj.developer_completed) isAlreadyCompleted = true;
      else if (statusObj.developer_approved) isAlreadyApproved = true;
      else if (!statusObj.cancelled && !statusObj.user_cancelled && !statusObj.developer_approved && !statusObj.developer_completed) {
        // Not approved yet, not completed, no cancellations
        isPendingOrCreated = true;
      }
    }

    // Metadata/type validation (be tolerant): allow if metadata.type==='premium' OR memo contains 'Premium'
    const metaType = payment?.metadata?.type;
    const memo = payment?.memo || '';
    if (!payment || (!metaType && !/premium/i.test(memo))) {
      console.warn('[approve] metadata/type check failed', { metaType, memo });
      return res.status(400).json({ success: false, error: 'Missing or invalid metadata.type (expected premium)', code: 'NO_METADATA_OR_TYPE', paymentStatus: payment?.status });
    }
    if (metaType && metaType !== 'premium') {
      console.warn('[approve] unexpected metadata.type', metaType);
      return res.status(400).json({ success: false, error: 'Unexpected payment metadata.type', expected: 'premium', got: metaType, code: 'BAD_TYPE', paymentStatus: payment.status });
    }
    if (isAlreadyCompleted) {
      console.log('[approve] payment already completed', paymentId);
      return res.json({ success: true, status: 'completed', already: true });
    }
    if (isAlreadyApproved) {
      console.log('[approve] payment already approved', paymentId);
      return res.json({ success: true, status: 'approved', already: true });
    }
    if (!isPendingOrCreated) {
      console.warn('[approve] rejecting due to status shape', rawStatus);
      return res.status(400).json({ success: false, error: 'Payment not in approvable state', status: rawStatus, code: 'BAD_STATUS_SHAPE' });
    }
    const approveUrl = `https://api.minepi.com/v2/payments/${paymentId}/approve`;
    await axios.post(approveUrl, {}, { headers: { Authorization: `Key ${piApiKey}` } });
    if (debug) console.log('[approve] OK approve sent for', paymentId);
    return res.json({ success: true, status: 'approved', paymentId });
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('[approve] error', { status, data });
    return res.status(502).json({ success: false, error: 'Approve failed', status, details: data || err.message, code: 'APPROVE_EXCEPTION' });
  }
}

async function completeHandler(req, res) {
  const { paymentId, pi_user_uid, txid } = req.body || {};
  const debug = process.env.NODE_ENV !== 'production';
  if (debug) console.log('[complete] incoming body:', req.body);
  if (!paymentId) {
    console.warn('[complete] missing paymentId');
    return res.status(400).json({ success: false, error: 'Missing paymentId', code: 'NO_PAYMENT_ID' });
  }
  if (!txid) {
    console.warn('[complete] missing txid');
    return res.status(400).json({ success: false, error: 'Missing txid', code: 'NO_TXID' });
  }
  if (!pi_user_uid) {
    console.warn('[complete] missing pi_user_uid');
    return res.status(400).json({ success: false, error: 'Missing pi_user_uid', code: 'NO_PI_UID' });
  }
  const piApiKey = process.env.PI_API_KEY;
  if (!piApiKey) {
    console.error('[complete] PI_API_KEY not set');
    return res.status(500).json({ success: false, error: 'PI_API_KEY not configured', code: 'NO_PI_KEY' });
  }
  try {
    const completeUrl = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
    await axios.post(completeUrl, { txid }, { headers: { Authorization: `Key ${piApiKey}` } });
    const paymentUrl = `https://api.minepi.com/v2/payments/${paymentId}`;
    const fetchResp = await axios.get(paymentUrl, { headers: { Authorization: `Key ${piApiKey}` } });
    const payment = fetchResp.data;
    let isCompleted = false;
    if (typeof payment.status === 'string') {
      isCompleted = payment.status === 'completed';
    } else if (payment.status && typeof payment.status === 'object') {
      isCompleted = !!payment.status.developer_completed;
    }
    if (!isCompleted) {
      console.warn('[complete] still not completed, raw status=', payment.status);
      return res.status(400).json({ success: false, error: 'Payment not completed after complete call', status: payment.status, code: 'NOT_COMPLETED' });
    }
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Supabase client not initialized (missing SUPABASE_SERVICE_KEY)', code: 'NO_SUPABASE' });
    }
    const { error } = await supabase
      .from('users')
      .update({ is_premium: true })
      .eq('pi_user_uid', pi_user_uid);
    if (error) {
      return res.status(500).json({ success: false, error: 'Supabase update error: ' + error.message, code: 'SUPABASE_UPDATE' });
    }
    if (debug) console.log('[complete] premium activated for', pi_user_uid, 'paymentId=', paymentId);
    return res.json({ success: true, status: 'completed', paymentId, txid });
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('[complete] error', { status, data });
    return res.status(502).json({ success: false, error: 'Complete failed', status, details: data || err.message, code: 'COMPLETE_EXCEPTION' });
  }
}

// Original routes
app.post('/api/payments/approve', approveHandler);
app.post('/api/payments/complete', completeHandler);
// Alias routes (Pi demo naming)
app.post('/api/approve-payment', approveHandler);
app.post('/api/complete-payment', completeHandler);

// Inspect endpoint za ručno debugovanje payment objekta
app.get('/api/payments/inspect/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const piApiKey = process.env.PI_API_KEY;
  if (!piApiKey) return res.status(500).json({ success: false, error: 'PI_API_KEY not configured', code: 'NO_PI_KEY' });
  try {
    const url = `https://api.minepi.com/v2/payments/${paymentId}`;
    const r = await axios.get(url, { headers: { Authorization: `Key ${piApiKey}` } });
    return res.json({ success: true, payment: r.data });
  } catch (err) {
    return res.status(502).json({ success: false, error: 'Inspect failed', status: err?.response?.status, details: err?.response?.data || err.message });
  }
});

app.get('/', (req, res) => {
  res.send('PurpleMusic Pi Network backend is running!');
});

// Health check endpoint (Render / monitoring eszközök számára)
app.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    status: 'up',
    uptime: process.uptime(),
    timestamp: Date.now(),
    node: process.version
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
