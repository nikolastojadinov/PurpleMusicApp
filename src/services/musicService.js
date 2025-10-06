// Music service with Pixabay primary source, FreeSound secondary, and local Supabase dataset final fallback.
// Returns a normalized array of track objects: { id, title, url, duration, preview, author, source, cover }
// Flow: Pixabay -> FreeSound -> localTracks (PurpleMusic bundled samples)

const PIXABAY_API_KEY = process.env.REACT_APP_PIXABAY_MUSIC_KEY || process.env.PIXABAY_MUSIC_KEY || 'YOUR_PIXABAY_API_KEY';
const FREESOUND_API_KEY = process.env.REACT_APP_FREESOUND_API_KEY || process.env.FREESOUND_API_KEY || 'YOUR_FREESOUND_API_KEY';

// Local fallback dataset (11 tracks) — requested structure
// duration kept as placeholder "00:00"; preview will use `url` to stay consistent with consumer code mapping to `preview || url`
export const localTracks = [
  {
    id: 1,
    title: 'Retro Lounge',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/retro-lounge-389644.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/F6897AAD-9902-4F0C-95EA-FD213A783D92.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/retro-lounge-389644.mp3'
  },
  {
    id: 2,
    title: 'Deep Abstract Ambient',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/deep-abstract-ambient_snowcap-401656.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/621B279E-CA15-482E-849A-60D0774A9DD5.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/deep-abstract-ambient_snowcap-401656.mp3'
  },
  {
    id: 3,
    title: 'Running Night',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/running-night-393139%202.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/76DD6929-0A2A-4D7C-8E09-86124174600A.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/running-night-393139%202.mp3'
  },
  {
    id: 4,
    title: 'Vlog Beat Background',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/vlog-beat-background-349853.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/IMG_0596.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/vlog-beat-background-349853.mp3'
  },
  {
    id: 5,
    title: 'Neon Vibes',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/neon-vibes.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/neon-vibes.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/neon-vibes.mp3'
  },
  {
    id: 6,
    title: 'Midnight Drive',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/midnight-drive.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/midnight-drive.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/midnight-drive.mp3'
  },
  {
    id: 7,
    title: 'Chill Summer',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/chill-summer.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/chill-summer.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/chill-summer.mp3'
  },
  {
    id: 8,
    title: 'Lo-Fi Night',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/lo-fi-night.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/lo-fi-night.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/lo-fi-night.mp3'
  },
  {
    id: 9,
    title: 'Cosmic Dream',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/cosmic-dream.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/cosmic-dream.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/cosmic-dream.mp3'
  },
  {
    id: 10,
    title: 'City Groove',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/city-groove.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/city-groove.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/city-groove.mp3'
  },
  {
    id: 11,
    title: 'Synth Horizon',
    url: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/synth-horizon.mp3',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/synth-horizon.png',
    author: 'PurpleMusic',
    duration: '00:00',
    source: 'local',
    preview: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/synth-horizon.mp3'
  }
];

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

  // 3. Final: local fallback dataset
  console.log('[MusicAPI] Using local fallback dataset');
  return localTracks;
}

export default { fetchMusic };
