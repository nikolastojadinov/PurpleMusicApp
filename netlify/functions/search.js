// Netlify Function: /api/search -> netlify/functions/search.js
// Purpose: Proxy YouTube Data API v3 search for music videos (legal usage only)
// Usage: /api/search?q=ACDC
// Environment: requires YT_API_KEY in Netlify / local environment.

export const config = {
  runtime: 'edge'
};

/**
 * Edge-compatible fetch wrapper for YouTube Search.
 * We restrict to video results and music category when possible.
 */
export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) {
      return jsonResponse(400, { error: 'Missing required query parameter q' });
    }

    const apiKey = process.env.YT_API_KEY;
    if (!apiKey) {
      return jsonResponse(500, { error: 'Server missing YT_API_KEY configuration' });
    }

    // Build YouTube Data API v3 search request
    const ytEndpoint = 'https://www.googleapis.com/youtube/v3/search';
    const params = new URLSearchParams({
      key: apiKey,
      part: 'snippet',
      q,
      type: 'video',
      maxResults: '15',
      safeSearch: 'moderate',
      videoEmbeddable: 'true'
    });

    const ytRes = await fetch(`${ytEndpoint}?${params.toString()}`);
    if (!ytRes.ok) {
      const text = await ytRes.text();
      return jsonResponse(ytRes.status, { error: 'YouTube API error', details: text.slice(0, 400) });
    }
    const data = await ytRes.json();

    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) {
      return jsonResponse(200, { message: 'No results found', results: [] });
    }

    const results = items.map(it => {
      const id = it.id || {};
      const snippet = it.snippet || {};
      const videoId = id.videoId || null;
      const title = snippet.title || '';
      const channelTitle = snippet.channelTitle || '';
      const thumbObj = snippet.thumbnails || {};
      const thumb = thumbObj.high || thumbObj.medium || thumbObj.default || null;
      const thumbnail = thumb ? thumb.url : null;
      return {
        title,
        channelTitle,
        thumbnail,
        videoId,
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null
      };
    });

    return jsonResponse(200, { results });
  } catch (err) {
    return jsonResponse(500, { error: 'Unexpected server error', details: err.message || String(err) });
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}
