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

  return (
    <YouTubeContext.Provider value={{ mode, playbackMode, current: currentVideo, playlist, play, playVideo, openPlaylist, loadPlaylistItems, playFromPlaylist, next, prev, clear, toggleVideoMode, lyrics, setLyricsData, lyricsVisible, toggleLyricsView, syncLyrics, playing, playCurrent, pauseCurrent, progress, setProgress, duration, setDuration, seekTo, expanded, toggleExpanded, shuffle, toggleShuffle, repeat, cycleRepeat, playerRef }}>
      {children}
    </YouTubeContext.Provider>
  );
}

export function useYouTube() { return useContext(YouTubeContext); }
