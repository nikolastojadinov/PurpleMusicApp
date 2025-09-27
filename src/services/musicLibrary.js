import { supabase } from '../supabaseClient';

// List all files (non-recursive) from a bucket root, with optional extension filtering and pagination handling.
async function listAllFiles(bucket, { extensions = null, limit = 100 } = {}) {
  let offset = 0;
  const results = [];
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error) throw new Error(`Greška pri listanju bucket-a ${bucket}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const entry of data) {
      // Skip folders (metadata null)
      if (!entry || !entry.name || !entry.metadata) continue;
      if (extensions) {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (!extensions.includes(ext)) continue;
      }
      results.push(entry.name);
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return results;
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

export async function fetchMusicLibrary() {
  const [musicFiles, coverFiles] = await Promise.all([
    listAllFiles('Music', { extensions: ['mp3'] }),
    listAllFiles('Covers', { extensions: ['png', 'jpg', 'jpeg'] })
  ]);

  const musicMap = new Map();
  for (const f of musicFiles) musicMap.set(baseName(f), f);

  const songs = [];
  for (const cover of coverFiles) {
    const bn = baseName(cover);
    if (!musicMap.has(bn)) continue;
    const musicFile = musicMap.get(bn);
    const { data: { publicUrl: musicUrl } } = supabase.storage.from('Music').getPublicUrl(musicFile);
    const { data: { publicUrl: coverUrl } } = supabase.storage.from('Covers').getPublicUrl(cover);
    songs.push({
      title: formatTitle(bn),
      url: musicUrl,
      cover: coverUrl
    });
  }
  songs.sort((a, b) => a.title.localeCompare(b.title));
  return songs;
}

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function fetchMusicLibraryCached(force = false) {
  const now = Date.now();
  if (!force && _cache && now - _cacheTime < CACHE_TTL_MS) return _cache;
  _cache = await fetchMusicLibrary();
  _cacheTime = now;
  return _cache;
}
