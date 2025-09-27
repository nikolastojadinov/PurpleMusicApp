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

const app = express();

app.use(cors());
app.use(bodyParser.json());


app.post('/api/verify-login', verifyLogin);

// Pi Network payment verification endpoint
app.post('/api/verify-payment', async (req, res) => {
  const { paymentId, pi_user_uid } = req.body;
  if (!paymentId || !pi_user_uid) {
    return res.status(400).json({ success: false, error: 'Missing paymentId or pi_user_uid' });
  }
  try {
    // Verifikuj payment sa Pi backendom
    const piApiKey = process.env.PI_API_KEY; // Dodaj svoj API key u env
    const piPaymentUrl = `https://api.minepi.com/v2/payments/${paymentId}`;
    const piResponse = await axios.get(piPaymentUrl, {
      headers: { Authorization: `Key ${piApiKey}` }
    });
    const payment = piResponse.data;
    // Proveri status i podatke
    if (payment.status === 'completed' && payment.metadata.type === 'premium') {
      // Aktiviraj premium za korisnika na Supabase
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized (missing SUPABASE_SERVICE_KEY)' });
      }
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('pi_user_uid', pi_user_uid);
      if (error) {
        return res.status(500).json({ success: false, error: 'Supabase update error: ' + error.message });
      }
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, error: 'Payment not completed or invalid type' });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

app.get('/', (req, res) => {
  res.send('PurpleMusic Pi Network backend is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
