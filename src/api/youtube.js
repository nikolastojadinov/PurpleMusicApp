// Unified YouTube search helper supporting both CRA (process.env.REACT_APP_YOUTUBE_API_KEY)
// and Vite (import.meta.env.VITE_YOUTUBE_API_KEY). If no client key available, falls
// back to backend proxy /api/youtube/search (which uses YOUTUBE_API_KEY server-side).
// Adds video duration via secondary videos API call when direct API usage is possible.

const getClientKey = () => {
  try {
    // Vite style
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_YOUTUBE_API_KEY) {
      return import.meta.env.VITE_YOUTUBE_API_KEY;
    }
  } catch(_) {}
  // CRA style
  return process.env.REACT_APP_YOUTUBE_API_KEY;
};

function parseIsoDuration(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1]||'0',10), mn = parseInt(m[2]||'0',10), s = parseInt(m[3]||'0',10);
  const total = h*3600 + mn*60 + s;
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  if (mm >= 60) {
    const HH = Math.floor(mm/60);
    const MM = mm % 60;
    return `${HH}:${MM.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
  }
  return `${mm}:${ss.toString().padStart(2,'0')}`;
}

export async function searchYouTube(query, type = 'video') {
  const trimmed = (query || '').trim();
  if (!trimmed) return { error: 'empty_query', results: [] };
  const key = getClientKey();
  if (!key) {
    // Use backend proxy fallback
    try {
      const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(trimmed)}`);
      const data = await resp.json();
      if (!resp.ok) {
        return { error: data?.error || 'proxy_error', results: [] };
      }
      return { results: data.results || [] };
    } catch (e) {
      console.error('[YouTube] proxy fallback failed', e);
      return { error: 'proxy_network', results: [] };
    }
  }
  // Direct client call with key (better latency; add durations)
  const params = new URLSearchParams({ part: 'snippet', q: trimmed, maxResults: '15', type, key });
  const endpoint = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      const text = await res.text();
      console.error('[YouTube] API error', res.status, text.slice(0,300));
      if (res.status === 400 || res.status === 403) {
        // fallback to proxy if available
        try {
          const prox = await fetch(`/api/youtube/search?q=${encodeURIComponent(trimmed)}`);
            const pdata = await prox.json();
          if (prox.ok) return { results: pdata.results || [] };
        } catch(_){}
        return { error: 'api_error', status: res.status, results: [] };
      }
      return { error: 'api_error', status: res.status, results: [] };
    }
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const base = items.map(it => ({
      videoId: it?.id?.videoId,
      title: it?.snippet?.title,
      channelTitle: it?.snippet?.channelTitle,
      thumbnailUrl: it?.snippet?.thumbnails?.medium?.url || it?.snippet?.thumbnails?.default?.url || null,
      description: it?.snippet?.description
    })).filter(r => !!r.videoId);
    // Fetch durations
    let durationMap = {};
    if (base.length) {
      try {
        const ids = base.map(b => b.videoId).join(',');
        const durParams = new URLSearchParams({ part: 'contentDetails', id: ids, key });
        const vids = await fetch(`https://www.googleapis.com/youtube/v3/videos?${durParams.toString()}`);
        if (vids.ok) {
          const vjson = await vids.json();
          for (const v of vjson.items || []) {
            if (v?.id && v?.contentDetails?.duration) durationMap[v.id] = parseIsoDuration(v.contentDetails.duration);
          }
        }
      } catch (e) {
        console.warn('[YouTube] duration fetch failed', e.message);
      }
    }
    const results = base.map(b => ({ ...b, duration: durationMap[b.videoId] }));
    return { results };
  } catch (e) {
    console.error('[YouTube] fetch failed', e);
    return { error: 'network', results: [] };
  }
}

export default searchYouTube;
