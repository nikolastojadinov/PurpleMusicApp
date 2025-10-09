const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

// Helper: safe update for users table that attempts to set updated_at if column exists
async function safeUserUpdate(filter, patch, selectCols = 'id, pi_user_uid, username, wallet_address, is_premium, premium_until, premium_plan, created_at, updated_at') {
  if (!supabase) return { data: null, error: new Error('Supabase not initialized') };
  const nowIso = new Date().toISOString();
  // Attempt with updated_at
  try {
    let query = supabase.from('users').update({ ...patch, updated_at: nowIso });
    Object.entries(filter).forEach(([k, v]) => { query = query.eq(k, v); });
    const { data, error } = await query.select(selectCols).maybeSingle();
    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    // If column missing, retry without it
    if (/updated_at/gi.test(e.message || '')) {
      try {
        let query2 = supabase.from('users').update(patch);
        Object.entries(filter).forEach(([k, v]) => { query2 = query2.eq(k, v); });
        const { data, error: e2 } = await query2.select(selectCols.replace(/,?\s*updated_at\b/g,'')).maybeSingle();
        if (e2) throw e2;
        return { data, error: null };
      } catch (inner) {
        return { data: null, error: inner };
      }
    }
    return { data: null, error: e };
  }
}


app.post('/api/verify-login', verifyLogin);

// --- YouTube Search Proxy (fallback for frontend when key unavailable client-side) ---
// Returns shape: { results: [ { videoId, title, channelTitle, thumbnailUrl, description, duration } ] }
app.get('/api/youtube/search', async (req, res) => {
  const { q } = req.query;
  const typeRaw = String(req.query.type || 'video').toLowerCase();
  const type = (typeRaw === 'playlist') ? 'playlist' : 'video';
  if (!q || !q.trim()) return res.status(400).json({ error: 'Missing query' });
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'backend_missing_key' });
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=${type}&maxResults=12&q=${encodeURIComponent(q.trim())}&key=${apiKey}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[YouTube Proxy] YouTube search error', resp.status, body.slice(0,300));
      return res.status(resp.status).json({ error: 'upstream_error', status: resp.status });
    }
    const data = await resp.json();
    return res.json(data);
  } catch (e) {
    console.error('[YouTube Proxy] fetch failure', e.message);
    return res.status(500).json({ error: 'proxy_failure', message: e.message });
  }
});

// --- YouTube Playlists Search Proxy ---
// Returns raw YouTube API response for playlist search
app.get('/api/youtube/searchPlaylists', async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ error: 'Missing query' });
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'backend_missing_key' });
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=12&q=${encodeURIComponent(q.trim())}&key=${apiKey}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[YouTube Proxy] playlist search error', resp.status, body.slice(0,300));
      return res.status(resp.status).json({ error: 'upstream_error', status: resp.status });
    }
    const data = await resp.json();
    return res.json(data);
  } catch (e) {
    console.error('[YouTube Proxy] playlist search failure', e.message);
    return res.status(500).json({ error: 'proxy_failure', message: e.message });
  }
});

// --- YouTube Playlist Items Proxy ---
// Params: playlistId, pageToken (optional)
app.get('/api/youtube/playlistItems', async (req, res) => {
  const { playlistId, pageToken } = req.query;
  if (!playlistId) return res.status(400).json({ error: 'Missing playlistId' });
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'backend_missing_key' });
  const base = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(playlistId)}`;
  const url = base + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '') + `&key=${apiKey}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[YouTube Proxy] playlistItems error', resp.status, body.slice(0,300));
      return res.status(resp.status).json({ error: 'upstream_error', status: resp.status });
    }
    const data = await resp.json();
    return res.json(data);
  } catch (e) {
    console.error('[YouTube Proxy] playlistItems failure', e.message);
    return res.status(500).json({ error: 'proxy_failure', message: e.message });
  }
});

// --- YouTube Playlist Info Proxy ---
app.get('/api/youtube/playlistInfo', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'backend_missing_key' });
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(id)}&key=${apiKey}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[YouTube Proxy] playlistInfo error', resp.status, body.slice(0,300));
      return res.status(resp.status).json({ error: 'upstream_error', status: resp.status });
    }
    const data = await resp.json();
    return res.json(data);
  } catch (e) {
    console.error('[YouTube Proxy] playlistInfo failure', e.message);
    return res.status(500).json({ error: 'proxy_failure', message: e.message });
  }
});

// --- Lyrics endpoint placeholder ---
// GET /api/lyrics?q=artist+title
// For now returns a mocked response; replace with Musixmatch or other provider integration.
app.get('/api/lyrics', async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ error: 'missing_query' });
  try {
    // Mock lines – simulate unsynced lyrics
    const sample = [
      'Instrumental Intro',
      'First line of the song',
      'Second line follows soon',
      'Chorus comes in bright and strong',
      'Verse two builds on the theme',
      'Bridge shifts the mood a bit',
      'Final chorus lifts it higher',
      'Outro fades into the night'
    ];
    return res.json({ lines: sample.map(t => ({ text: t })), synced: false });
  } catch (e) {
    console.warn('[Lyrics] failed', e.message);
    return res.status(500).json({ error: 'lyrics_failed' });
  }
});

// =================== Spotify OAuth2 Integration ===================
// All secrets remain server-side. Frontend receives only short-lived access tokens.
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://purplemusicapp.onrender.com/api/auth/spotify/callback';
const SPOTIFY_STATE_SECRET = process.env.SPOTIFY_STATE_SECRET || (process.env.SUPABASE_SERVICE_KEY || 'dev_fallback_secret');

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function signStatePayload(payload) {
  const json = JSON.stringify(payload);
  const dataB64 = base64url(json);
  const sig = crypto.createHmac('sha256', SPOTIFY_STATE_SECRET).update(dataB64).digest('base64');
  const sigB64 = sig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${dataB64}.${sigB64}`;
}

function verifyState(state) {
  try {
    if (!state || !state.includes('.')) return { ok:false, error:'malformed_state' };
    const [dataB64, sigB64] = state.split('.', 2);
    const expected = crypto.createHmac('sha256', SPOTIFY_STATE_SECRET).update(dataB64).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
    if (expected !== sigB64) return { ok:false, error:'bad_signature' };
    const json = Buffer.from(dataB64.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8');
    const payload = JSON.parse(json);
    // Basic freshness check (10 minutes)
    if (!payload.ts || (Date.now() - payload.ts) > 10*60*1000) return { ok:false, error:'state_expired' };
    return { ok:true, payload };
  } catch (e) {
    return { ok:false, error:'state_invalid' };
  }
}

// GET /api/auth/spotify/login
// Redirects user to Spotify authorization with requested scopes.
app.get('/api/auth/spotify/login', async (req, res) => {
  try {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error:'spotify_not_configured' });
    }
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private'
    ];
    const { pi_uid, pi_user_uid, id } = req.query || {};
    const nonce = crypto.randomBytes(12).toString('hex');
    const payload = { ts: Date.now(), nonce };
    if (pi_uid) payload.pi_uid = String(pi_uid);
    if (pi_user_uid) payload.pi_user_uid = String(pi_user_uid);
    if (id) payload.id = String(id);
    const state = signStatePayload(payload);
    const q = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scopes.join(' '),
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state
    }).toString();
    const authUrl = `https://accounts.spotify.com/authorize?${q}`;
    return res.redirect(302, authUrl);
  } catch (e) {
    console.error('[Spotify][login] failed', e.message);
    return res.status(500).json({ error:'spotify_login_failed' });
  }
});

// GET /api/auth/spotify/callback
// Exchanges authorization code for tokens and stores refresh token in Supabase user profile.
app.get('/api/auth/spotify/callback', async (req, res) => {
  try {
    const { code, state } = req.query || {};
    if (!code || !state) return res.status(400).json({ error:'missing_code_or_state' });
    const vs = verifyState(state);
    if (!vs.ok) return res.status(400).json({ error: 'invalid_state', reason: vs.error });
    const who = vs.payload || {};
    // Exchange code for tokens
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    let tokenResp;
    try {
      tokenResp = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: SPOTIFY_REDIRECT_URI
      }).toString(), {
        headers: {
          'Authorization': `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error('[Spotify][callback] token exchange failed', status, data);
      return res.status(502).json({ error:'spotify_token_exchange_failed', status, data });
    }
    const { access_token, refresh_token, token_type, expires_in, scope } = tokenResp.data || {};
    if (!access_token) return res.status(502).json({ error:'no_access_token' });
    // Persist refresh_token if present
    if (refresh_token && supabase) {
      try {
        const filter = {};
        if (who.pi_uid) filter.pi_uid = who.pi_uid; else if (who.pi_user_uid) filter.pi_user_uid = who.pi_user_uid; else if (who.id) filter.id = who.id;
        if (Object.keys(filter).length === 0) {
          console.warn('[Spotify][callback] no user identifier in state; refresh token not saved');
        } else {
          const { error: updErr } = await safeUserUpdate(filter, { spotify_refresh_token: refresh_token }, 'id, pi_user_uid, pi_uid, username');
          if (updErr) console.error('[Spotify][callback] Supabase update failed', updErr.message);
        }
      } catch (e) {
        console.error('[Spotify][callback] refresh token save failed', e.message);
      }
    }
    // Return only short-lived access token to the frontend
    return res.json({ access_token, token_type, expires_in, scope });
  } catch (e) {
    console.error('[Spotify][callback] unhandled', e.message);
    return res.status(500).json({ error:'spotify_callback_failed' });
  }
});

// POST /api/auth/spotify/refresh
// Body: { pi_uid? | pi_user_uid? | id? }
// Exchanges stored refresh token for a new access token.
app.post('/api/auth/spotify/refresh', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error:'supabase_uninitialized' });
    const { pi_uid, pi_user_uid, id } = req.body || {};
    const filter = {};
    if (pi_uid) filter.pi_uid = String(pi_uid);
    else if (pi_user_uid) filter.pi_user_uid = String(pi_user_uid);
    else if (id) filter.id = id;
    else return res.status(400).json({ error:'missing_identifier' });
    // Load stored refresh token
    let query = supabase.from('users').select('spotify_refresh_token').limit(1);
    Object.entries(filter).forEach(([k,v]) => { query = query.eq(k, v); });
    const { data: rows, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    const row = Array.isArray(rows) ? rows[0] : null;
    const refreshToken = row?.spotify_refresh_token;
    if (!refreshToken) return res.status(400).json({ error:'no_refresh_token' });
    // Exchange refresh for access token
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    let tokenResp;
    try {
      tokenResp = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString(), {
        headers: {
          'Authorization': `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error('[Spotify][refresh] failed', status, data);
      return res.status(502).json({ error:'spotify_refresh_failed', status, data });
    }
    const { access_token, token_type, expires_in, scope } = tokenResp.data || {};
    if (!access_token) return res.status(502).json({ error:'no_access_token' });
    return res.json({ access_token, token_type, expires_in, scope });
  } catch (e) {
    console.error('[Spotify][refresh] unhandled', e.message);
    return res.status(500).json({ error:'spotify_refresh_unhandled' });
  }
});
// =================== End Spotify OAuth2 ===================

// --- Secure user sync endpoint (uses service role) to avoid client-side RLS insert failures ---
app.post('/api/users/sync', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'supabase_uninitialized' });
  const { pi_uid, username, access_token } = req.body || {};
  if (!pi_uid || !username) return res.status(400).json({ error: 'missing_fields' });
  try {
    // Attempt upsert using pi_uid schema first
    const { data, error } = await supabase
      .from('users')
      .upsert({ pi_uid, username, access_token }, { onConflict: 'pi_uid' })
      .select('*')
      .single();
    if (!error) return res.json({ user: data, schema: 'pi_uid' });
    // Fallback legacy schema
    const { data: legacy, error: legacyErr } = await supabase
      .from('users')
      .upsert({ pi_user_uid: pi_uid, username }, { onConflict: 'pi_user_uid' })
      .select('*')
      .single();
    if (legacyErr) return res.status(500).json({ error: legacyErr.message });
    return res.json({ user: legacy, schema: 'pi_user_uid' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Helper to compute premium expiration based on plan key
function computePremiumUntil(plan) {
  const now = new Date();
  switch (plan) {
    case 'weekly':
      now.setDate(now.getDate() + 7); break;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1); break;
    case 'monthly':
    default:
      now.setMonth(now.getMonth() + 1); break;
  }
  return now.toISOString();
}

// Validate payment metadata/memo/amount against expected plan pricing
const PLAN_AMOUNTS = { weekly: 1, monthly: 3.14, yearly: 31.4 };
function validatePaymentShape(payment) {
  if (!payment) return { ok:false, reason:'no payment object' };
  const plan = payment?.metadata?.plan || 'monthly';
  const amount = Number(payment.amount);
  if (!PLAN_AMOUNTS[plan]) return { ok:false, reason:'invalid plan metadata' };
  const expected = PLAN_AMOUNTS[plan];
  // allow tiny float variance
  if (Math.abs(amount - expected) > 0.0001) return { ok:false, reason:`amount mismatch expected ${expected} got ${amount}` };
  const memo = payment.memo || '';
  if (!/premium/i.test(memo)) return { ok:false, reason:'memo missing premium keyword' };
  return { ok:true, plan };
}

// Premium reset endpoint (admin/debug)
app.post('/api/premium/reset', async (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ success:false, error:'Missing user_id' });
  if (!supabase) return res.status(500).json({ success:false, error:'Supabase not initialized' });
  try {
    const { data, error } = await safeUserUpdate({ id: user_id }, { is_premium: false, premium_until: null, premium_plan: null });
    if (error) return res.status(500).json({ success:false, error:error.message });
    return res.json({ success:true, user:data });
  } catch (e) {
    return res.status(500).json({ success:false, error:e.message });
  }
});

// Premium refresh endpoint: resets expired premium server-side (idempotent)
app.post('/api/premium/refresh', async (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ success:false, error:'Missing user_id' });
  if (!supabase) return res.status(500).json({ success:false, error:'Supabase not initialized' });
  try {
    const { data: userRow, error: fetchErr } = await supabase
      .from('users')
      .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, premium_plan, created_at, updated_at')
      .eq('id', user_id)
      .single();
    if (fetchErr) return res.status(500).json({ success:false, error:fetchErr.message });
    if (userRow?.is_premium && userRow?.premium_until && new Date(userRow.premium_until) <= new Date()) {
      const { data: resetRow, error: updErr } = await safeUserUpdate({ id: user_id }, { is_premium:false, premium_plan:null, premium_until:null });
      if (updErr) return res.status(500).json({ success:false, error:updErr.message });
      return res.json({ success:true, user: resetRow, reset:true });
    }
    return res.json({ success:true, user: userRow, reset:false });
  } catch (e) {
    return res.status(500).json({ success:false, error:e.message });
  }
});

// Pi Network payment verification endpoint (legacy single-shot flow)
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
      const shape = validatePaymentShape(payment);
      if (!shape.ok) {
        console.warn('[verify-payment] validation failed', shape.reason);
        return res.status(400).json({ success:false, error:'Validation failed: '+shape.reason });
      }
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized (missing SUPABASE_SERVICE_KEY)' });
      }
      const plan = shape.plan;
      const premium_until = computePremiumUntil(plan);
      const { data: updatedUser, error: updErr } = await safeUserUpdate({ pi_user_uid }, { is_premium: true, premium_plan: plan, premium_until });
      if (updErr) {
        console.error('[verify-payment] Supabase update error:', updErr.message);
        return res.status(500).json({ success: false, error: 'Supabase update error: ' + updErr.message });
      }
      console.log('[verify-payment] PREMIUM ACTIVATED for', pi_user_uid, 'plan=', plan, 'until=', premium_until, 'in', Date.now() - startedAt, 'ms');
      return res.json({ success: true, paymentStatus: payment.status, plan, premium_until, user: updatedUser });
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

    // Insert pending payment row in payments table (if not exists) for tracking
    if (supabase) {
      try {
        const plan = payment?.metadata?.plan || 'monthly';
        // Find user id by pi_user_uid
        const { data: userRow, error: userErr } = await supabase
          .from('users')
          .select('id')
          .eq('pi_user_uid', pi_user_uid)
          .maybeSingle();
        if (!userErr && userRow) {
          const amount = Number(payment?.amount) || null;
          // Upsert style: try insert, ignore if conflict on pi_payment_id
          const { error: insErr } = await supabase.from('payments').insert({
            user_id: userRow.id,
            pi_payment_id: paymentId,
            amount,
            plan_type: plan,
            status: 'pending'
          }).select('id').maybeSingle();
          if (insErr && !/duplicate|unique/i.test(insErr.message)) {
            console.warn('[approve][payments.insert] error:', insErr.message);
          }
        }
      } catch (e) {
        console.warn('[approve][payments.insert] exception:', e.message);
      }
    }
    return res.json({ success: true, status: 'approved', paymentId });
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('[approve] error', { status, data });
    // Mark payment rejected if we already created row earlier (best effort)
    if (supabase && req.body?.paymentId) {
      await supabase.from('payments').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('pi_payment_id', req.body.paymentId);
    }
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
    const shape = validatePaymentShape(payment);
    if (!shape.ok) {
      // Mark as rejected so it doesn't stay pending forever
      try { await supabase.from('payments').update({ status:'rejected', updated_at: new Date().toISOString() }).eq('pi_payment_id', paymentId); } catch(_){}
      return res.status(400).json({ success:false, error:'Validation failed: '+shape.reason, code:'BAD_PAYMENT_SHAPE' });
    }
    const plan = shape.plan;
    const premium_until = computePremiumUntil(plan);
    const { data: updatedUser, error } = await safeUserUpdate({ pi_user_uid }, { is_premium: true, premium_plan: plan, premium_until }, 'id, pi_user_uid, username, wallet_address, is_premium, premium_plan, premium_until, created_at, updated_at');
    if (error) {
      return res.status(500).json({ success: false, error: 'Supabase update error: ' + error.message, code: 'SUPABASE_UPDATE' });
    }
    // Update payments row -> approved + store txid
    try {
      await supabase.from('payments').update({ status: 'approved', plan_type: plan, amount: payment.amount, txid, updated_at: new Date().toISOString() }).eq('pi_payment_id', paymentId);
    } catch (e) {
      console.warn('[complete][payments.update] failed:', e.message);
    }
    if (debug) console.log('[complete] premium activated for', pi_user_uid, 'plan=', plan, 'until=', premium_until, 'paymentId=', paymentId);
    return res.json({ success: true, status: 'completed', paymentId, txid, plan, premium_until, user: updatedUser });
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('[complete] error', { status, data });
    if (supabase && paymentId) {
      try { await supabase.from('payments').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('pi_payment_id', paymentId); } catch(_){}
    }
    return res.status(502).json({ success: false, error: 'Complete failed', status, details: data || err.message, code: 'COMPLETE_EXCEPTION' });
  }
}

// Original routes
app.post('/api/payments/approve', approveHandler);
app.post('/api/payments/complete', completeHandler);
// Alias routes (Pi demo naming)
app.post('/api/approve-payment', approveHandler);
app.post('/api/complete-payment', completeHandler);

// Manual / webhook alike endpoint to update payment status externally
app.post('/api/payments/update', async (req, res) => {
  const { pi_payment_id, status, plan_type } = req.body || {};
  if (!pi_payment_id) return res.status(400).json({ success:false, error:'Missing pi_payment_id' });
  if (!['approved','rejected','pending'].includes(status||'')) return res.status(400).json({ success:false, error:'Invalid status' });
  if (!supabase) return res.status(500).json({ success:false, error:'Supabase not initialized' });
  try {
    const { data: payRow, error: payErr } = await supabase.from('payments').select('id, user_id, status, plan_type').eq('pi_payment_id', pi_payment_id).maybeSingle();
    if (payErr || !payRow) return res.status(404).json({ success:false, error:'Payment not found' });
    const newPlan = plan_type || payRow.plan_type;
  const { error: updErr } = await supabase.from('payments').update({ status, plan_type: newPlan, updated_at: new Date().toISOString() }).eq('pi_payment_id', pi_payment_id);
    if (updErr) return res.status(500).json({ success:false, error:updErr.message });
    // If approved -> upgrade user
    if (status === 'approved') {
      const until = computePremiumUntil(newPlan || 'monthly');
      const { error: userErr } = await supabase.from('users').update({ is_premium:true, premium_plan:newPlan, premium_until:until }).eq('id', payRow.user_id);
      if (userErr) return res.status(500).json({ success:false, error:'User upgrade failed: '+userErr.message });
      return res.json({ success:true, upgraded:true, premium_until: until, plan: newPlan });
    }
    return res.json({ success:true, updated:true, status });
  } catch (e) {
    return res.status(500).json({ success:false, error:e.message });
  }
});

// Query latest payment state for a user (auto-upgrade if payment manually approved)
app.get('/api/payments/latest', async (req, res) => {
  const { pi_user_uid } = req.query;
  if (!pi_user_uid) return res.status(400).json({ success:false, error:'Missing pi_user_uid' });
  if (!supabase) return res.status(500).json({ success:false, error:'Supabase not initialized' });
  try {
    const { data: userRow, error: uErr } = await supabase
      .from('users')
      .select('id, is_premium, premium_plan, premium_until')
      .eq('pi_user_uid', pi_user_uid)
      .maybeSingle();
    if (uErr || !userRow) return res.status(404).json({ success:false, error:'User not found' });
    const { data: paymentsRows, error: pErr } = await supabase
      .from('payments')
      .select('id, pi_payment_id, amount, currency, plan_type, status, created_at, updated_at')
      .eq('user_id', userRow.id)
      .order('created_at', { ascending:false })
      .limit(1);
    if (pErr) return res.status(500).json({ success:false, error:pErr.message });
    const latest = paymentsRows?.[0] || null;
    let userUpgraded = false;
    let premiumUntil = null;
    if (latest && latest.status === 'approved') {
      const needsUpgrade = !userRow.is_premium || userRow.premium_plan !== latest.plan_type;
      if (needsUpgrade) {
        premiumUntil = computePremiumUntil(latest.plan_type || 'monthly');
        const { error: updErr } = await supabase.from('users').update({
          is_premium: true,
          premium_plan: latest.plan_type,
          premium_until: premiumUntil
        }).eq('id', userRow.id);
        if (!updErr) userUpgraded = true;
      }
    }
    // Auto-recovery: if latest is pending, check Pi API; if actually completed -> approve & upgrade
    if (latest && latest.status === 'pending' && latest.pi_payment_id) {
      try {
        const piApiKey = process.env.PI_API_KEY;
        if (piApiKey) {
          const url = `https://api.minepi.com/v2/payments/${latest.pi_payment_id}`;
          const r = await axios.get(url, { headers: { Authorization: `Key ${piApiKey}` } });
          const pay = r.data;
          let isCompleted = false;
          if (typeof pay.status === 'string') isCompleted = pay.status === 'completed';
          else if (pay.status && typeof pay.status === 'object') isCompleted = !!pay.status.developer_completed;
          if (isCompleted) {
            // Validate shape before upgrading
            const shape = validatePaymentShape(pay);
            if (shape.ok) {
              const plan = shape.plan || latest.plan_type || 'monthly';
              premiumUntil = computePremiumUntil(plan);
              const { error: upErr } = await supabase.from('users').update({
                is_premium: true,
                premium_plan: plan,
                premium_until: premiumUntil
              }).eq('id', userRow.id);
              if (!upErr) {
                userUpgraded = true;
                await supabase.from('payments').update({ status:'approved', plan_type: plan, txid: pay?.transaction?.txid || pay?.txid || null, updated_at: new Date().toISOString() }).eq('id', latest.id);
                // reflect approved status in response object
                latest.status = 'approved';
                latest.plan_type = plan;
              }
            } else {
              // Invalid shape -> mark rejected
              await supabase.from('payments').update({ status:'rejected', updated_at: new Date().toISOString() }).eq('id', latest.id);
              latest.status = 'rejected';
            }
          }
        }
      } catch(e) {
        console.warn('[latest][auto-recover] failed', e.message);
      }
    }
    return res.json({ success:true, payment: latest, userUpgraded, premium_until: premiumUntil });
  } catch (e) {
    return res.status(500).json({ success:false, error:e.message });
  }
});

// History endpoint: recent payments for a user (default limit=5)
app.get('/api/payments/history', async (req, res) => {
  const { pi_user_uid, limit } = req.query;
  if (!pi_user_uid) return res.status(400).json({ success:false, error:'Missing pi_user_uid' });
  if (!supabase) return res.status(500).json({ success:false, error:'Supabase not initialized' });
  const lim = Math.min(Math.max(parseInt(limit,10)||5,1),25); // clamp 1..25
  try {
    const { data: userRow, error: uErr } = await supabase
      .from('users')
      .select('id')
      .eq('pi_user_uid', pi_user_uid)
      .maybeSingle();
    if (uErr || !userRow) return res.status(404).json({ success:false, error:'User not found' });
    const { data: rows, error: pErr } = await supabase
      .from('payments')
      .select('id, plan_type, status, txid, created_at')
      .eq('user_id', userRow.id)
      .order('created_at', { ascending:false })
      .limit(lim);
    if (pErr) return res.status(500).json({ success:false, error:pErr.message });
    return res.json({ success:true, payments: rows || [] });
  } catch (e) {
    return res.status(500).json({ success:false, error:e.message });
  }
});

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

// Root route (Render expects a simple 200 OK text response) - updated per deployment requirements
// NOTE: Root route will be handled by React SPA (index.html) via catch-all below.

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

// ---- Static React build serving (robust detection) ----
// Preferred path (if a separate frontend dir existed)
const primaryBuildPath = path.join(__dirname, '../frontend/build');
// Actual path for current repo structure (build folder at root)
const secondaryBuildPath = path.join(__dirname, '..', 'build');
let activeBuildPath = null;
if (fs.existsSync(path.join(primaryBuildPath, 'index.html'))) {
  activeBuildPath = primaryBuildPath;
  console.log('[BOOT] Serving React build (primary):', activeBuildPath);
} else if (fs.existsSync(path.join(secondaryBuildPath, 'index.html'))) {
  activeBuildPath = secondaryBuildPath;
  console.log('[BOOT] Serving React build (secondary):', activeBuildPath);
} else {
  console.warn('[BOOT] No React build found. Expected one of:', primaryBuildPath, 'or', secondaryBuildPath);
}
if (activeBuildPath) {
  // Add explicit logging for each JS static asset request.
  app.use('/static/js', (req, res, next) => {
    const start = Date.now();
    const origSend = res.send;
    let bytes = 0;
    // Proactive existence check to detect fallthrough that would return index.html instead of JS.
    try {
      const requested = req.path.replace(/^\/+/, '');
      const full = path.join(activeBuildPath, 'static', 'js', requested);
      if (!fs.existsSync(full)) {
        console.warn('[ASSET:MISS]', requested, 'resolved=', full, '-> may fall through to SPA and serve HTML');
      }
    } catch(_e) {}
    res.send = function(chunk){
      try { if (chunk) bytes = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk); } catch(_){}
      return origSend.apply(this, arguments);
    };
    res.on('finish', () => {
      console.log(`[ASSET:JS] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${bytes}B ct=${res.get('Content-Type')} t=${Date.now()-start}ms`);
    });
    next();
  });
  app.use(express.static(activeBuildPath));
}

// Debug: log non-API GET requests to help diagnose black screen issues
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/static/')) {
    console.log('[REQ:SPA]', req.path);
  }
  next();
});

// Debug endpoint to inspect build status
app.get('/debug/build-info', (req, res) => {
  res.json({
    activeBuildPath,
    hasIndex: !!(activeBuildPath && fs.existsSync(path.join(activeBuildPath, 'index.html'))),
    timestamp: Date.now(),
    envPort: process.env.PORT,
  });
});

// Catch-all route (after APIs) -> only if build exists
app.get('*', (req, res, next) => {
  // Never treat API or static asset paths as SPA fallback targets.
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  if (req.path.startsWith('/static/')) {
    // If we reach here, express.static did not find the file -> return 404 (avoid returning index.html masquerading as JS/CSS)
    return res.status(404).send();
  }
  if (!activeBuildPath) {
    return res.status(503).json({ error: 'Frontend build not available' });
  }
  // Force no-cache for index.html so updated bundle hashes propagate quickly.
  if (req.path === '/' || /index\.html$/i.test(req.path)) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  console.log('[SPA:FALLBACK]', req.originalUrl);
  return res.sendFile(path.join(activeBuildPath, 'index.html'));
});

// Use Render-provided PORT or fallback to 10000 as specified
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  // Required startup log per instructions
  console.log('PurpleMusic full app is running ✅');
});
