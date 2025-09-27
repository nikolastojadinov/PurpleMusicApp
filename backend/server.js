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

app.get('/', (req, res) => {
  res.send('PurpleMusic Pi Network backend is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
