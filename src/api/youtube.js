// YouTube Data API helper (search)
// Uses environment variable VITE_YOUTUBE_API_KEY (provided via build env)
// Do NOT hardcode keys.

export async function searchYouTube(query, type = 'video') {
  // Create React App environment variable naming.
  const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('[YouTube] Missing VITE_YOUTUBE_API_KEY');
    return { error: 'missing_key', results: [] };
  }
  const trimmed = (query || '').trim();
  if (!trimmed) return { error: 'empty_query', results: [] };
  const params = new URLSearchParams({
    part: 'snippet',
    q: trimmed,
    maxResults: '15',
    type,
    key: apiKey
  });
  const endpoint = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      const text = await res.text();
      console.error('[YouTube] API error', res.status, text.slice(0,300));
      return { error: 'api_error', status: res.status, results: [] };
    }
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const results = items.map(it => {
      const { id = {}, snippet = {} } = it;
      return {
        videoId: id.videoId,
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        thumbnailUrl: snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url || null,
        description: snippet.description
      };
    }).filter(r => !!r.videoId);
    return { results };
  } catch (e) {
    console.error('[YouTube] fetch failed', e);
    return { error: 'network', results: [] };
  }
}

export default searchYouTube;
