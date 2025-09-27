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
  if (!paymentId) return res.status(400).json({ success: false, error: 'Missing paymentId', code: 'NO_PAYMENT_ID' });
  const piApiKey = process.env.PI_API_KEY;
  if (!piApiKey) return res.status(500).json({ success: false, error: 'PI_API_KEY not configured', code: 'NO_PI_KEY' });
  try {
    const paymentUrl = `https://api.minepi.com/v2/payments/${paymentId}`;
    const fetchResp = await axios.get(paymentUrl, { headers: { Authorization: `Key ${piApiKey}` } });
    const payment = fetchResp.data;
    if (!payment || !payment.metadata) {
      return res.status(400).json({ success: false, error: 'Invalid payment object from Pi API', code: 'NO_METADATA' });
    }
    if (payment.metadata.type !== 'premium') {
      return res.status(400).json({ success: false, error: 'Unexpected payment metadata.type', expected: 'premium', got: payment.metadata.type, code: 'BAD_TYPE' });
    }
    if (payment.status !== 'pending') {
      if (['approved', 'completed'].includes(payment.status)) {
        return res.json({ success: true, status: payment.status, already: true });
      }
      return res.status(400).json({ success: false, error: 'Payment not in pending state', status: payment.status, code: 'BAD_STATUS' });
    }
    const approveUrl = `https://api.minepi.com/v2/payments/${paymentId}/approve`;
    await axios.post(approveUrl, {}, { headers: { Authorization: `Key ${piApiKey}` } });
    if (debug) console.log('[approve] OK', paymentId);
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
  if (!paymentId) return res.status(400).json({ success: false, error: 'Missing paymentId', code: 'NO_PAYMENT_ID' });
  if (!txid) return res.status(400).json({ success: false, error: 'Missing txid', code: 'NO_TXID' });
  if (!pi_user_uid) return res.status(400).json({ success: false, error: 'Missing pi_user_uid', code: 'NO_PI_UID' });
  const piApiKey = process.env.PI_API_KEY;
  if (!piApiKey) return res.status(500).json({ success: false, error: 'PI_API_KEY not configured', code: 'NO_PI_KEY' });
  try {
    const completeUrl = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
    await axios.post(completeUrl, { txid }, { headers: { Authorization: `Key ${piApiKey}` } });
    const paymentUrl = `https://api.minepi.com/v2/payments/${paymentId}`;
    const fetchResp = await axios.get(paymentUrl, { headers: { Authorization: `Key ${piApiKey}` } });
    const payment = fetchResp.data;
    if (payment.status !== 'completed') {
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
    if (debug) console.log('[complete] premium activated for', pi_user_uid);
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
