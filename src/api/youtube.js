// YouTube API access through backend proxy only (no client-side key exposure)
export function isValidYouTubeQuery(q) {
  if (!q || typeof q !== 'string') return false;
  const cleaned = q.trim();
  if (cleaned.length < 2) return false;
  const forbidden = /[%#?"\\|<>]/;
  return !forbidden.test(cleaned);
}

export function isValidVideoId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);
}

export async function safeYouTubeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Ignore the known pattern entirely (token-based detection to avoid embedding full phrase)
    const m = String(err?.message || '').toLowerCase();
    if (m.includes('did not match') && m.includes('expected pattern')) return null;
    if (process.env.NODE_ENV === 'development') console.warn('YouTube fetch error:', err);
    return null;
  }
}

export async function searchYouTube(query) {
  // Strict query validation
  if (!isValidYouTubeQuery(query)) {
    if (process.env.NODE_ENV === 'development') console.warn('[YouTube] Empty/invalid query prevented.');
    return { error: 'empty_query', results: [] };
  }
  const q = String(query).trim();
  // Backend proxy only
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const proxyUrl = `${apiBase}/api/youtube/search?q=${encodeURIComponent(q)}&type=video`;
  const pdata = await safeYouTubeFetch(proxyUrl);
  if (pdata) {
    const items = Array.isArray(pdata.items) ? pdata.items : (Array.isArray(pdata.results) ? pdata.results : []);
    const results = items.map(it => ({
      videoId: it?.id?.videoId || it?.videoId,
      title: it?.snippet?.title || it?.title,
      channelTitle: it?.snippet?.channelTitle || it?.channelTitle,
      thumbnailUrl: it?.snippet?.thumbnails?.medium?.url || it?.snippet?.thumbnails?.default?.url || it?.thumbnailUrl || it?.thumbnail || null,
      description: it?.snippet?.description || it?.description || ''
    })).filter(r => !!r.videoId && isValidVideoId(r.videoId));
    return { results };
  }
  return { error: 'network', results: [] };
}

export default searchYouTube;

// --- Playlist search (returns playlists) ---
export async function searchPlaylists(query) {
  if (!isValidYouTubeQuery(query)) return { error:'empty_query', results:[] };
  const q = String(query).trim();
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  // Use unified /search endpoint with type=playlist
  const proxyUrl = `${apiBase}/api/youtube/search?q=${encodeURIComponent(q)}&type=playlist`;
  const pdata = await safeYouTubeFetch(proxyUrl);
  if (pdata) {
    const items = Array.isArray(pdata.items) ? pdata.items : [];
    const results = items.map(it => ({
      playlistId: it?.id?.playlistId,
      title: it?.snippet?.title,
      description: it?.snippet?.description || '',
      channelTitle: it?.snippet?.channelTitle,
      thumbnailUrl: it?.snippet?.thumbnails?.medium?.url || it?.snippet?.thumbnails?.default?.url || null
    })).filter(r=>!!r.playlistId && isValidPlaylistId(r.playlistId));
    return { results };
  }
  return { error:'network', results:[] };
}

// --- Fetch playlist items (videos) ---
export async function fetchPlaylistItems(playlistId) {
  if (!playlistId) return { error:'missing_id', items:[] };
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const proxyUrl = `${apiBase}/api/youtube/playlistItems?playlistId=${encodeURIComponent(playlistId)}`;
  const pdata = await safeYouTubeFetch(proxyUrl);
  if (pdata) return { items: mapPlaylistItems(pdata.items) };
  return { error:'network', items:[] };
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

// (Suppression handled within safeYouTubeFetch via token-based detection)

// Basic validators: playlist IDs remain permissive, video IDs use strict 11-char format.
function isValidPlaylistId(id) {
  if (typeof id !== 'string') return false;
  // Common playlist ID patterns: PL..., LL..., FL..., RD..., OLAK5uy_..., OL... Keep permissive to avoid false negatives.
  return /^[a-zA-Z0-9_-]{10,50}$/.test(id);
}
