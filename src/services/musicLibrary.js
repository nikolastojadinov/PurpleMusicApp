import { supabase } from '../supabaseClient';

// Rekurzív listázás: bejár mappákat (ako postoje) i vraća sve fajlove.
async function listAllFiles(bucket, { extensions = null, limit = 100, prefix = '' } = {}) {
  let offset = 0;
  const collected = [];
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error) throw new Error(`Greška pri listanju bucket-a ${bucket} (${prefix}): ${error.message}`);
    if (!data || data.length === 0) break;
    for (const entry of data) {
      if (!entry || !entry.name) continue;
      // Folder detection: metadata === null ili entry.name ne sadrži '.' (heuristika)
      const isFolder = !entry.name.includes('.') || entry.metadata === null;
      if (isFolder) {
        // Recurse into subfolder (avoid infinite loops)
        const newPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
        const nested = await listAllFiles(bucket, { extensions, limit, prefix: newPrefix });
        collected.push(...nested);
      } else {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (extensions && !extensions.includes(ext)) continue;
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        collected.push(fullPath);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return collected;
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

export async function fetchMusicLibrary({ includeUnmatched = false, fallbackCover = '/fallback-cover.png', debug = false } = {}) {
  const [musicFiles, coverFiles] = await Promise.all([
    listAllFiles('Music', { extensions: ['mp3'] }),
    listAllFiles('Covers', { extensions: ['png', 'jpg', 'jpeg'] })
  ]);

  if (debug && typeof window !== 'undefined') {
    console.log('[MusicLibrary] Fetched raw lists', { musicFiles, coverFiles });
  }

  const musicMap = new Map();
  for (const f of musicFiles) musicMap.set(baseName(f), f);

  const coverMap = new Map();
  for (const c of coverFiles) coverMap.set(baseName(c), c);

  const matchedIds = [];
  for (const id of musicMap.keys()) {
    if (coverMap.has(id)) matchedIds.push(id);
  }

  const songs = matchedIds.map(id => {
    const musicFile = musicMap.get(id);
    const coverFile = coverMap.get(id);
    const { data: { publicUrl: musicUrl } } = supabase.storage.from('Music').getPublicUrl(musicFile);
    const { data: { publicUrl: coverUrl } } = supabase.storage.from('Covers').getPublicUrl(coverFile);
    return {
      title: formatTitle(id),
      url: musicUrl,
      cover: coverUrl
    };
  });

  if (includeUnmatched) {
    for (const id of musicMap.keys()) {
      if (coverMap.has(id)) continue;
      const musicFile = musicMap.get(id);
      const { data: { publicUrl: musicUrl } } = supabase.storage.from('Music').getPublicUrl(musicFile);
      songs.push({ title: formatTitle(id), url: musicUrl, cover: fallbackCover });
    }
  }

  songs.sort((a, b) => a.title.localeCompare(b.title));
  if (debug && typeof window !== 'undefined') {
    console.log('[MusicLibrary] Final songs list', songs);
  }
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
