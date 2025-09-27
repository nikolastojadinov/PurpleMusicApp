import { supabase } from '../supabaseClient';

// Egyszerű (nem rekurzív) listázás a bucket gyökerében – jelen igényhez elég.
async function listAllFiles(bucket, { extensions = null, limit = 1000 } = {}) {
  const { data, error } = await supabase.storage.from(bucket).list('', {
    limit,
    sortBy: { column: 'name', order: 'asc' }
  });
  if (error) throw new Error(`Greška pri listanju bucket-a ${bucket}: ${error.message}`);
  if (!data) return [];
  return data
    .filter(e => e && e.name)
    .map(e => e.name)
    .filter(name => {
      if (!extensions) return true;
      const ext = name.split('.').pop().toLowerCase();
      return extensions.includes(ext);
    });
}

function baseName(filename) {
  return filename.replace(/\.[^/.]+$/, '');
}

function formatTitle(raw) {
  if (/^[A-F0-9]{8,}$/i.test(raw)) return raw; // leave hash-looking IDs
  return raw
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function fetchMusicLibrary({ includeUnmatched = true, fallbackCover = '/fallback-cover.png', debug = false } = {}) {
  const [musicFiles, coverFiles] = await Promise.all([
    listAllFiles('Music', { extensions: ['mp3'] }),
    listAllFiles('Covers', { extensions: ['png', 'jpg', 'jpeg'] })
  ]);

  if (debug && typeof window !== 'undefined') {
    console.log('[MusicLibrary] Fetched raw lists', { musicFiles, coverFiles });
  }

  const musicMap = new Map(musicFiles.map(f => [baseName(f), f]));
  const coverMap = new Map(coverFiles.map(c => [baseName(c), c]));

  const songs = [];
  // Minden mp3-ból készítünk rekordot – cover optional
  for (const [id, musicFile] of musicMap.entries()) {
    const coverFile = coverMap.get(id);
    const { data: { publicUrl: musicUrl } } = supabase.storage.from('Music').getPublicUrl(musicFile);
    let coverUrl = fallbackCover;
    if (coverFile) {
      coverUrl = supabase.storage.from('Covers').getPublicUrl(coverFile).data.publicUrl;
    }
    songs.push({ title: formatTitle(id), url: musicUrl, cover: coverUrl });
  }

  songs.sort((a, b) => a.title.localeCompare(b.title));
  if (debug && typeof window !== 'undefined') console.log('[MusicLibrary] Final songs list', songs);
  return songs;
}

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function fetchMusicLibraryCached(force = false, options = {}) {
  const now = Date.now();
  if (!force && _cache && now - _cacheTime < CACHE_TTL_MS) return _cache;
  _cache = await fetchMusicLibrary(options);
  _cacheTime = now;
  return _cache;
}
