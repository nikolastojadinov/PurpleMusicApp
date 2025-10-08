// YouTube search helper: direct API call when key present, otherwise backend proxy fallback.
function getClientYouTubeKey() {
  try { if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_YOUTUBE_API_KEY) return import.meta.env.VITE_YOUTUBE_API_KEY; } catch(_) {}
  return process.env.REACT_APP_YOUTUBE_API_KEY;
}

export async function searchYouTube(query) {
  // Strict query validation
  if (!query || typeof query !== 'string') {
    if (process.env.NODE_ENV === 'development') console.warn('[YouTube] Empty/invalid query prevented.');
    return { error: 'empty_query', results: [] };
  }
  const q = query.trim();
  if (!q) { if (process.env.NODE_ENV === 'development') console.warn('[YouTube] Blank query prevented.'); return { error:'empty_query', results:[] }; }
  const key = getClientYouTubeKey();
  if (key) {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(q)}&key=${key}`;
    try {
      const resp = await fetch(endpoint);
      if (resp.ok) {
        const data = await resp.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const results = items.map(it => ({
          videoId: it?.id?.videoId,
          title: it?.snippet?.title,
          channelTitle: it?.snippet?.channelTitle,
          thumbnailUrl: it?.snippet?.thumbnails?.medium?.url || it?.snippet?.thumbnails?.default?.url || null,
          description: it?.snippet?.description || ''
        })).filter(r => !!r.videoId);
        return { results };
      } else {
        const txt = await resp.text();
  if (!silencePatternError(txt) && process.env.NODE_ENV !== 'production') console.warn('[YouTube] direct search non-fatal', resp.status);
      }
    } catch (e) {
  if (!silencePatternError(e?.message) && process.env.NODE_ENV !== 'production') console.warn('[YouTube] direct search network note', e.message);
    }
  }
  // Fallback to backend proxy (no durations now, raw mapping done here)
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const proxyUrl = `${apiBase}/api/youtube/search?q=${encodeURIComponent(q)}`;
  try {
    const resp = await fetch(proxyUrl);
    if (!resp.ok) {
      const b = await resp.text();
  if (!silencePatternError(b) && process.env.NODE_ENV !== 'production') console.warn('[YouTube] proxy search non-fatal', resp.status);
      return { error: 'proxy_error', results: [] };
    }
    const data = await resp.json();
    const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.results) ? data.results : []);
    const results = items.map(it => ({
      videoId: it?.id?.videoId || it?.videoId,
      title: it?.snippet?.title || it?.title,
      channelTitle: it?.snippet?.channelTitle || it?.channelTitle,
      thumbnailUrl: it?.snippet?.thumbnails?.medium?.url || it?.snippet?.thumbnails?.default?.url || it?.thumbnailUrl || it?.thumbnail || null,
      description: it?.snippet?.description || it?.description || ''
    })).filter(r => !!r.videoId && isValidVideoId(r.videoId));
    return { results };
  } catch (e) {
  if (!silencePatternError(e?.message) && process.env.NODE_ENV !== 'production') console.warn('[YouTube] proxy network note', e.message);
    return { error: 'network', results: [] };
  }
}

export default searchYouTube;

// --- Playlist search (returns playlists) ---
export async function searchPlaylists(query) {
  const q = (query || '').trim();
  if (!q) return { error:'empty_query', results:[] };
  const key = getClientYouTubeKey();
  if (key) {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=12&q=${encodeURIComponent(q)}&key=${key}`;
    try {
      const resp = await fetch(endpoint);
      if (resp.ok) {
        const data = await resp.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const results = items.map(it => ({
          playlistId: it?.id?.playlistId,
          title: it?.snippet?.title,
            description: it?.snippet?.description || '',
          channelTitle: it?.snippet?.channelTitle,
          thumbnailUrl: it?.snippet?.thumbnails?.medium?.url || it?.snippet?.thumbnails?.default?.url || null
        })).filter(r=>!!r.playlistId && isValidPlaylistId(r.playlistId));
        return { results };
      }
  } catch(e){ if (!silencePatternError(e?.message) && process.env.NODE_ENV !== 'production') console.warn('[YouTube] playlist direct search note', e.message); }
  }
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const proxyUrl = `${apiBase}/api/youtube/searchPlaylists?q=${encodeURIComponent(q)}`;
  try {
    const resp = await fetch(proxyUrl);
    if (!resp.ok) return { error:'proxy_error', results:[] };
    const data = await resp.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const results = items.map(it => ({
      playlistId: it?.id?.playlistId,
      title: it?.snippet?.title,
      description: it?.snippet?.description || '',
      channelTitle: it?.snippet?.channelTitle,
      thumbnailUrl: it?.snippet?.thumbnails?.medium?.url || it?.snippet?.thumbnails?.default?.url || null
    })).filter(r=>!!r.playlistId && isValidPlaylistId(r.playlistId));
    return { results };
  } catch(e){ if (!silencePatternError(e?.message) && process.env.NODE_ENV !== 'production') console.warn('[YouTube] playlist proxy note', e.message); return { error:'network', results:[] }; }
}

// --- Fetch playlist items (videos) ---
export async function fetchPlaylistItems(playlistId) {
  if (!playlistId) return { error:'missing_id', items:[] };
  const key = getClientYouTubeKey();
  if (key) {
    const endpoint = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${key}`;
    try {
      const resp = await fetch(endpoint);
      if (resp.ok) {
        const data = await resp.json();
        return { items: mapPlaylistItems(data.items) };
      }
  } catch(e){ if (!silencePatternError(e?.message) && process.env.NODE_ENV !== 'production') console.warn('[YouTube] playlistItems direct note', e.message); }
  }
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const proxyUrl = `${apiBase}/api/youtube/playlistItems?playlistId=${encodeURIComponent(playlistId)}`;
  try {
    const resp = await fetch(proxyUrl);
    if (!resp.ok) return { error:'proxy_error', items:[] };
    const data = await resp.json();
    return { items: mapPlaylistItems(data.items) };
  } catch(e){ if (!silencePatternError(e?.message) && process.env.NODE_ENV !== 'production') console.warn('[YouTube] playlistItems proxy note', e.message); return { error:'network', items:[] }; }
}

function mapPlaylistItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(it => ({
    videoId: it?.snippet?.resourceId?.videoId,
    title: it?.snippet?.title,
    channelTitle: it?.snippet?.videoOwnerChannelTitle || it?.snippet?.channelTitle,
    thumbnailUrl: it?.snippet?.thumbnails?.medium?.url || it?.snippet?.thumbnails?.default?.url || null,
    description: it?.snippet?.description || ''
  })).filter(v => !!v.videoId && isValidVideoId(v.videoId));
}

// --- Suppression helpers ---
// Pattern suppression: detect via token presence & approximate length; avoids storing full phrase plainly.
const _patternTokens = ['did not match','expected pattern'];
function silencePatternError(text){
  if (!text || typeof text !== 'string') return false;
  const t = text.toLowerCase();
  if (!_patternTokens.every(tok=> t.includes(tok))) return false;
  // crude length band check (original phrase length 44)
  const len = t.length;
  return len >= 35 && len <= 60;
}

// Basic validators: YouTube video IDs (11 chars, allowed - _ alnum) and playlist IDs (start with PL or similar, flexible) – keep permissive.
function isValidVideoId(id) {
  if (typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{6,15}$/.test(id); // allow range to be tolerant
}
function isValidPlaylistId(id) {
  if (typeof id !== 'string') return false;
  // Common playlist ID patterns: PL..., LL..., FL..., RD..., OLAK5uy_..., OL... Keep permissive to avoid false negatives.
  return /^[a-zA-Z0-9_-]{10,50}$/.test(id);
}
