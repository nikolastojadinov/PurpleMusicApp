// Fetch lyrics from backend placeholder endpoint
export async function fetchLyrics(artist, title){
  const q = encodeURIComponent(`${artist||''} ${title||''}`.trim());
  if(!q) return { lines:[], synced:false };
  try {
    const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
    const resp = await fetch(`${apiBase}/api/lyrics?q=${q}`);
    if(!resp.ok) return { lines:[], synced:false };
    const data = await resp.json();
    return { lines: data.lines || [], synced: !!data.synced };
  } catch(e){
    console.warn('[Lyrics] fetch error', e.message);
    return { lines:[], synced:false };
  }
}
