import React, { createContext, useContext, useState, useCallback } from 'react';

// Holds currently selected YouTube track and simple controls.
const YouTubeContext = createContext(null);

export function YouTubeProvider({ children }) {
  const [current, setCurrent] = useState(null); // { videoId, title, thumbnailUrl }

  const play = useCallback((item) => {
    setCurrent(item);
  }, []);

  const clear = useCallback(() => setCurrent(null), []);

  return (
    <YouTubeContext.Provider value={{ current, play, clear }}>
      {children}
    </YouTubeContext.Provider>
  );
}

export function useYouTube() {
  return useContext(YouTubeContext);
}
