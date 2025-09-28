import { supabase } from '../supabaseClient';

const MUSIC_BUCKET = 'Music';
const COVERS_BUCKET = 'Covers';
const PUBLIC_BASE = (path) => `${supabase.storageUrl || 'https://ofkfygqrfenctzitigae.supabase.co'}/storage/v1/object/public/${path}`;

function stripExt(name){
  return name.replace(/\.[^.]+$/,'');
}

export async function loadMusicLibrary() {
  const [{ data: musicFiles, error: musicErr }, { data: coverFiles, error: coverErr }] = await Promise.all([
    supabase.storage.from(MUSIC_BUCKET).list('', { limit: 500 }),
    supabase.storage.from(COVERS_BUCKET).list('', { limit: 500 })
  ]);
  if (musicErr) throw musicErr;
  if (coverErr) throw coverErr;
  const coverIndex = new Map();
  coverFiles.filter(f=>f.name.endsWith('.png')).forEach(f => {
    coverIndex.set(stripExt(f.name), f.name);
  });
  const songs = musicFiles
    .filter(f => f.name.endsWith('.mp3'))
    .map(f => {
      const base = stripExt(f.name);
      const coverFile = coverIndex.get(base);
      return {
        id: base,
        title: base,
        url: PUBLIC_BASE(`${MUSIC_BUCKET}/${f.name}`),
        cover: coverFile ? PUBLIC_BASE(`${COVERS_BUCKET}/${coverFile}`) : null
      };
    })
    .filter(s => s.cover); // only keep those with matching cover
  return songs;
}
