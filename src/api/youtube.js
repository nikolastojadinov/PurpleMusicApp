// YouTube search helper: direct API call when key present, otherwise backend proxy fallback.
function getClientYouTubeKey() {
  try { if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_YOUTUBE_API_KEY) return import.meta.env.VITE_YOUTUBE_API_KEY; } catch(_) {}
  return process.env.REACT_APP_YOUTUBE_API_KEY;
}

export async function searchYouTube(query) {
  const q = (query || '').trim();
  if (!q) return { error: 'empty_query', results: [] };
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
        console.error('[YouTube] direct search error', resp.status, txt.slice(0,300));
      }
    } catch (e) {
      console.warn('[YouTube] direct search network error', e.message);
    }
  }
  // Fallback to backend proxy (no durations now, raw mapping done here)
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const proxyUrl = `${apiBase}/api/youtube/search?q=${encodeURIComponent(q)}`;
  try {
    const resp = await fetch(proxyUrl);
    if (!resp.ok) {
      const b = await resp.text();
      console.error('[YouTube] proxy search error', resp.status, b.slice(0,300));
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
    })).filter(r => !!r.videoId);
    return { results };
  } catch (e) {
    console.error('[YouTube] proxy network failure', e.message);
    return { error: 'network', results: [] };
  }
}

export default searchYouTube;
