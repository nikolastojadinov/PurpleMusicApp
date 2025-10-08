// Secure-only YouTube search helper.
// Always proxies through backend (Render) or Netlify Function to avoid bundling API keys in client build.
// Tries backend Express /api/youtube/search (includes durations) then falls back to Netlify function /.netlify/functions/search (no durations).

export async function searchYouTube(query, type = 'video') {
  const trimmed = (query || '').trim();
  if (!trimmed) return { error: 'empty_query', results: [] };
  const backendBase = process.env.REACT_APP_API_URL || '';
  // Attempt backend first (Express server with durations)
  const primaryUrl = `${backendBase ? backendBase.replace(/\/$/,'') : ''}/api/youtube/search?q=${encodeURIComponent(trimmed)}&type=${encodeURIComponent(type)}`;
  try {
    const resp = await fetch(primaryUrl);
    if (resp.ok) {
      const data = await resp.json();
      return { results: data.results || [] };
    }
  } catch (e) {
    console.warn('[YouTube] primary backend search failed', e.message);
  }
  // Fallback: Netlify function (path differs)
  try {
    const fnUrl = `/.netlify/functions/search?q=${encodeURIComponent(trimmed)}`;
    const resp2 = await fetch(fnUrl);
    const data2 = await resp2.json();
    if (!resp2.ok) return { error: data2?.error || 'proxy_error', results: [] };
    // Normalize shape (Netlify returns thumbnail vs thumbnailUrl)
    const norm = (data2.results || []).map(r => ({
      videoId: r.videoId,
      title: r.title,
      channelTitle: r.channelTitle,
      thumbnailUrl: r.thumbnail,
      description: r.description,
      duration: r.duration // may be undefined
    })).filter(r => !!r.videoId);
    return { results: norm };
  } catch (e) {
    console.error('[YouTube] fallback function search failed', e);
    return { error: 'network', results: [] };
  }
}

export default searchYouTube;
