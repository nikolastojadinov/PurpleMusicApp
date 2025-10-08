import React, { createContext, useContext, useState, useCallback } from 'react';

// Extended YouTube context: supports single video or playlist playback.
// State shape:
// mode: 'video' | 'playlist' | null
// currentVideo: { videoId, title, thumbnailUrl, channelTitle }
// playlist: { id, title, thumbnailUrl, items: [video objects], index }
const YouTubeContext = createContext(null);

export function YouTubeProvider({ children }) {
  const [mode, setMode] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [playlist, setPlaylist] = useState(null); // { id, title, thumbnailUrl, items, index }

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
    setPlaylist(null);
    setCurrentVideo(null);
  }, []);

  return (
    <YouTubeContext.Provider value={{ mode, current: currentVideo, playlist, play, playVideo, openPlaylist, loadPlaylistItems, playFromPlaylist, next, prev, clear }}>
      {children}
    </YouTubeContext.Provider>
  );
}

export function useYouTube() { return useContext(YouTubeContext); }
