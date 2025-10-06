// Music service with Pixabay primary source and FreeSound fallback.
// Returns a normalized array of track objects: { id, title, url, duration, preview, author, source }
// Implemented per requirement: attempt Pixabay first, fallback to FreeSound when unavailable or empty.

const PIXABAY_API_KEY = process.env.REACT_APP_PIXABAY_MUSIC_KEY || process.env.PIXABAY_MUSIC_KEY || 'YOUR_PIXABAY_API_KEY';
const FREESOUND_API_KEY = process.env.REACT_APP_FREESOUND_API_KEY || process.env.FREESOUND_API_KEY || 'YOUR_FREESOUND_API_KEY';

// Helper to safely fetch JSON with timeout
async function safeFetchJson(url, { timeoutMs = 12000, headers = {} } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { headers, signal: controller.signal });
    const status = resp.status;
    let data = null;
    try { data = await resp.json(); } catch (e) { /* ignore parse error */ }
    return { ok: resp.ok, status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err };
  } finally {
    clearTimeout(t);
  }
}

function normalizePixabayTrack(item) {
  return {
    id: `pixabay_${item.id}`,
    title: item.name || item.title || item.tags || 'Untitled',
    url: item.url || item.pageURL || '',
    duration: typeof item.duration === 'number' ? item.duration : null,
    preview: item.audio || item.previewURL || item.download_url || '',
    author: item.user || item.artist || item.username || 'Unknown',
    source: 'pixabay'
  };
}

function normalizeFreeSoundTrack(item) {
  return {
    id: `freesound_${item.id}`,
    title: item.name || item.title || item.tag || 'Untitled',
    url: item.url || (item.id ? `https://freesound.org/s/${item.id}/` : ''),
    duration: typeof item.duration === 'number' ? item.duration : null,
    preview: (item.previews && (item.previews['preview-hq-mp3'] || item.previews['preview-lq-mp3'])) || '',
    author: (item.username || (item.user && item.user.username)) || 'Unknown',
    source: 'freesound'
  };
}

export async function fetchMusic(query) {
  const q = encodeURIComponent(query || '');
  // 1. Try Pixabay first
  try {
    const pixabayUrl = `https://pixabay.com/api/music/?key=${PIXABAY_API_KEY}&q=${q}`;
    const pixabayResp = await safeFetchJson(pixabayUrl);
    if (pixabayResp.ok && pixabayResp.status === 200 && pixabayResp.data) {
      const { totalHits, hits } = pixabayResp.data;
      if (Array.isArray(hits) && hits.length > 0 && totalHits !== 0) {
        const tracks = hits.map(normalizePixabayTrack).filter(t => t.preview);
        if (tracks.length > 0) {
          console.log('[MusicAPI] Using Pixabay source');
          return tracks;
        }
      }
    }
    // If we reach here Pixabay produced no usable results - fall through
  } catch (e) {
    // Failure triggers fallback below
  }

  // 2. Fallback to FreeSound
  try {
    const freeSoundUrl = `https://freesound.org/apiv2/search/text/?query=${q}&token=${FREESOUND_API_KEY}`;
    const fsResp = await safeFetchJson(freeSoundUrl);
    if (fsResp.ok && fsResp.status === 200 && fsResp.data && Array.isArray(fsResp.data.results)) {
      const results = fsResp.data.results;
      const tracks = results.map(normalizeFreeSoundTrack).filter(t => t.preview);
      if (tracks.length > 0) {
        console.log('[MusicAPI] Using FreeSound fallback');
        return tracks;
      }
    }
  } catch (e) {
    // ignore final error
  }

  // Final: return empty array for consistency
  return [];
}

export default { fetchMusic };
