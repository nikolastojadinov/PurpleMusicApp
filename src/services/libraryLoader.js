const MUSIC_BUCKET = 'Music';
const COVERS_BUCKET = 'Covers';
const PUBLIC_BASE = (path) => `https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/${path}`;

export async function loadMusicLibrary() {
  // Loading local song metadata (static list)
  
  // Direct list of known files (exactly from user's screenshots)
  const knownSongs = [
    'deepabstractambient',
    'retro-lounge', 
    'running-night',
    'vlog-beat-background',
    'apocalypse-1-original-lyrics',
    '8039s-nostalgia',
    'retro-80s-sax',
    '80s-baby-original-lyrics',
    'apocalypse-original-lyrics',
    'lady-of-the-80',
    '80-cinematic-synthwave'
  ];

  // Format song titles nicely
  const formatTitle = (filename) => {
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/80s/gi, '80s')
      .replace(/1 /g, '1: ');
  };

  // Generate artist names based on song style
  const getArtist = (baseName) => {
    if (baseName.includes('80') || baseName.includes('retro')) {
      return 'Synthwave Artist';
    } else if (baseName.includes('ambient')) {
      return 'Ambient Artist';
    } else if (baseName.includes('lounge')) {
      return 'Lounge Artist';
    } else if (baseName.includes('vlog') || baseName.includes('beat')) {
      return 'Beat Artist';
    } else if (baseName.includes('cinematic')) {
      return 'Cinematic Artist';
    } else if (baseName.includes('apocalypse') || baseName.includes('lyrics')) {
      return 'Lyrical Artist';
    } else if (baseName.includes('running') || baseName.includes('night')) {
      return 'Electronic Artist';
    } else {
      return 'Unknown Artist';
    }
  };

  // Create songs array using known files
  const songs = knownSongs.map(baseName => {
    const musicUrl = PUBLIC_BASE(`${MUSIC_BUCKET}/${baseName}.mp3`);
    const coverUrl = PUBLIC_BASE(`${COVERS_BUCKET}/${baseName}.png`);
    
    return {
      id: baseName,
      title: formatTitle(baseName),
      artist: getArtist(baseName),
      url: musicUrl,
      cover: coverUrl
    };
  });

  return songs;
}
