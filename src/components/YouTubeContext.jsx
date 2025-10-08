import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// Extended YouTube context: supports single video or playlist playback.
// State shape:
// mode: 'video' | 'playlist' | null
// currentVideo: { videoId, title, thumbnailUrl, channelTitle }
// playlist: { id, title, thumbnailUrl, items: [video objects], index }
const YouTubeContext = createContext(null);

export function YouTubeProvider({ children }) {
  const [mode, setMode] = useState(null); // 'video' | 'playlist' | null
  const [playbackMode, setPlaybackMode] = useState('audio'); // 'audio' | 'video'
  const [currentVideo, setCurrentVideo] = useState(null);
  const [playlist, setPlaylist] = useState(null); // { id, title, thumbnailUrl, items, index }
  const [lyrics, setLyrics] = useState({ lines: [], synced: false });
  const [rawLyrics, setRawLyrics] = useState('');
  const [lyricsVisible, setLyricsVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false); // fullscreen player
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // off | one | all
  const playerRef = useRef(null); // underlying YT.Player instance

  // Persistence
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yt_player_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.playbackMode) setPlaybackMode(parsed.playbackMode);
      }
    } catch(_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('yt_player_state', JSON.stringify({ playbackMode }));
    } catch(_) {}
  }, [playbackMode]);

  const play = useCallback((item) => { // backward compat (single video)
    if (!item) return;
    setMode('video');
    setPlaylist(null);
    setCurrentVideo(item);
  }, []);

  const playVideo = play; // alias

  const openPlaylist = useCallback((meta) => {
    // meta: { id, title, thumbnailUrl, items? }
    if (!meta?.id) return;
    setMode('playlist');
    setPlaylist({ id: meta.id, title: meta.title, thumbnailUrl: meta.thumbnailUrl || null, items: meta.items || [], index: 0 });
    if (meta.items && meta.items[0]) {
      setCurrentVideo(meta.items[0]);
    } else {
      setCurrentVideo(null);
    }
  }, []);

  const loadPlaylistItems = useCallback((items) => {
    setPlaylist(p => {
      if (!p) return p;
      const next = { ...p, items };
      // If nothing playing yet, start with first item
      if (!currentVideo && items[0]) setCurrentVideo(items[0]);
      return next;
    });
  }, [currentVideo]);

  const playFromPlaylist = useCallback((index) => {
    setPlaylist(p => {
      if (!p) return p;
      const item = p.items[index];
      if (item) {
        setCurrentVideo(item);
        return { ...p, index };
      }
      return p;
    });
  }, []);

  const next = useCallback(() => {
    setPlaylist(p => {
      if (!p || !p.items?.length) return p;
      const nextIndex = (p.index + 1);
      if (nextIndex < p.items.length) {
        const item = p.items[nextIndex];
        setCurrentVideo(item);
        return { ...p, index: nextIndex };
      }
      return p; // no wrap for now
    });
  }, []);

  const prev = useCallback(() => {
    setPlaylist(p => {
      if (!p || !p.items?.length) return p;
      const prevIndex = p.index - 1;
      if (prevIndex >= 0) {
        const item = p.items[prevIndex];
        setCurrentVideo(item);
        return { ...p, index: prevIndex };
      }
      return p;
    });
  }, []);

  const clear = useCallback(() => {
    setMode(null);
    setPlaybackMode('audio');
    setPlaylist(null);
    setCurrentVideo(null);
  setLyrics({ lines: [], synced: false });
  setRawLyrics('');
    setLyricsVisible(false);
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  const toggleVideoMode = useCallback(() => {
    setPlaybackMode(m => m === 'audio' ? 'video' : 'audio');
  }, []);

  const toggleLyricsView = useCallback(() => setLyricsVisible(v => !v), []);

  const setLyricsData = useCallback((data) => {
    if (!data) return;
    setLyrics({ lines: Array.isArray(data.lines) ? data.lines : [], synced: !!data.synced });
  }, []);

  // Parsing LRC into structured lines { time:number, text:string }
  const parseLrc = useCallback((raw) => {
    if (!raw || typeof raw !== 'string') return { lines: [], synced:false };
    const out = [];
    const lineRegex = /^(\s*\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?])+(.*)$/; // supports multiple tags per line
    const timeTag = /(\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?])/g;
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      if (!lineRegex.test(line)) continue; // skip metadata or invalid lines
      const text = line.replace(timeTag, '').trim();
      let match;
      while ((match = timeTag.exec(line)) !== null) {
        const m = parseInt(match[2],10) || 0;
        const s = parseInt(match[3],10) || 0;
        const fracRaw = match[4] || '0';
        // normalize fractional part to milliseconds length 2 or 3 -> seconds fraction
        let fraction = 0;
        if (fracRaw) {
          if (fracRaw.length === 2) fraction = parseInt(fracRaw,10) / 100; else fraction = parseInt(fracRaw,10) / 1000;
        }
        const total = m * 60 + s + fraction;
        out.push({ time: total, text });
      }
    }
    out.sort((a,b)=> a.time - b.time);
    return { lines: out, synced: out.length > 0 };
  }, []);

  const setLyricsRaw = useCallback((raw) => {
    setRawLyrics(raw || '');
    const parsed = parseLrc(raw || '');
    setLyrics(parsed);
  }, [parseLrc]);

  const clearLyrics = useCallback(() => {
    setRawLyrics('');
    setLyrics({ lines: [], synced:false });
  }, []);

  const syncLyrics = useCallback((currentTime) => {
    // Placeholder – real implementation would update active index based on timestamps.
    return currentTime;
  }, []);

  // Player control helpers (backed by iframe API when available)
  const playCurrent = useCallback(() => {
    try { playerRef.current?.playVideo?.(); } catch(_) {}
    setPlaying(true);
  }, []);
  const pauseCurrent = useCallback(() => {
    try { playerRef.current?.pauseVideo?.(); } catch(_) {}
    setPlaying(false);
  }, []);
  const seekTo = useCallback((sec) => {
    try { playerRef.current?.seekTo?.(sec, true); setProgress(sec); } catch(_) {}
  }, []);
  const toggleExpanded = useCallback(()=> setExpanded(e=>!e), []);
  const cycleRepeat = useCallback(()=> setRepeat(r => r === 'off' ? 'one' : r === 'one' ? 'all' : 'off'), []);
  const toggleShuffle = useCallback(()=> setShuffle(s=>!s), []);

  const hasLyrics = lyrics.lines.length > 0;

  return (
    <YouTubeContext.Provider value={{ mode, playbackMode, current: currentVideo, playlist, play, playVideo, openPlaylist, loadPlaylistItems, playFromPlaylist, next, prev, clear, toggleVideoMode, lyrics, rawLyrics, hasLyrics, setLyricsData, setLyricsRaw, clearLyrics, lyricsVisible, toggleLyricsView, syncLyrics, playing, playCurrent, pauseCurrent, progress, setProgress, duration, setDuration, seekTo, expanded, toggleExpanded, shuffle, toggleShuffle, repeat, cycleRepeat, playerRef }}>
      {children}
    </YouTubeContext.Provider>
  );
}

export function useYouTube() { return useContext(YouTubeContext); }
