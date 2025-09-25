import React, { useRef, useState } from 'react';

const demoSong = {
  title: 'Night Owl',
  artist: 'Annie Walker',
  cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=64&h=64',
  src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  duration: 205
};

export default function ModernAudioPlayer({ song = demoSong }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(song.duration);
  const [volume, setVolume] = useState(0.8);
  const [dragOffset, setDragOffset] = useState(0);
  const [playerBottom, setPlayerBottom] = useState(64); // default offset from bottom
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Mute/Unmute
  const toggleMute = () => {
    setIsMuted((prev) => {
      if (audioRef.current) audioRef.current.muted = !prev;
      return !prev;
    });
  };

  // Progress
  const handleTimeUpdate = () => {
    setProgress(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };
  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.nativeEvent.clientX - rect.left;
    const percent = x / rect.width;
    const seekTime = percent * duration;
    audioRef.current.currentTime = seekTime;
    setProgress(seekTime);
  };

  // Volume
  const handleVolumeChange = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.nativeEvent.clientX - rect.left;
    const percent = Math.min(Math.max(x / rect.width, 0), 1);
    setVolume(percent);
    if (audioRef.current) audioRef.current.volume = percent;
  };

  // Mouse Drag & Drop
  const handleDragStart = (e) => {
    setDragging(true);
    setStartY(e.clientY);
  };
  const handleDrag = (e) => {
    if (!dragging) return;
    const offset = e.clientY - startY;
    // Ograniči pomeranje da ne ode van ekrana
    const maxOffset = window.innerHeight - 180; // visina playera + footer
    const newBottom = Math.max(0, Math.min(playerBottom + offset, maxOffset));
    setDragOffset(offset);
    setPlayerBottom(newBottom);
  };
  const handleDragEnd = () => {
    if (!dragging) return;
    const offset = dragOffset;
    const maxOffset = window.innerHeight - 180;
    const newBottom = Math.max(0, Math.min(playerBottom + offset, maxOffset));
    setPlayerBottom(newBottom);
    setDragging(false);
    setStartY(null);
    setDragOffset(0);
  };

  // Touch Drag & Drop
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setTouchStartY(e.touches[0].clientY);
    }
  };
  const handleTouchMove = (e) => {
    if (!dragging || e.touches.length !== 1) return;
    const offset = e.touches[0].clientY - touchStartY;
    const maxOffset = window.innerHeight - 180;
    const newBottom = Math.max(0, Math.min(playerBottom + offset, maxOffset));
    setDragOffset(offset);
    setPlayerBottom(newBottom);
  };
  const handleTouchEnd = () => {
    if (!dragging) return;
    const offset = dragOffset;
    const maxOffset = window.innerHeight - 180;
    const newBottom = Math.max(0, Math.min(playerBottom + offset, maxOffset));
    setPlayerBottom(newBottom);
    setDragging(false);
    setTouchStartY(null);
    setDragOffset(0);
  };

  // Format time
  const formatTime = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Dummy next/prev
  const handlePrev = () => {
    audioRef.current.currentTime = 0;
    setProgress(0);
  };
  const handleNext = () => {
    audioRef.current.currentTime = duration;
    setProgress(duration);
  };

  // Attach drag listeners
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragging, startY, touchStartY]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{
        bottom: `${playerBottom}px`,
        transition: dragging ? 'none' : 'bottom 0.2s',
        maxWidth: 420,
        width: '96vw',
        cursor: dragging ? 'grabbing' : 'grab',
        boxSizing: 'border-box',
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleTouchStart}
    >
      <audio
        ref={audioRef}
        src={song.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        volume={volume}
      />
      <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a]/80 to-[#2d0036]/80 rounded-2xl shadow-lg border border-white/10 flex flex-col px-4 py-3 select-none w-full" style={{minWidth:'0'}}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <img src={song.cover} alt="cover" className="w-12 h-12 rounded-md object-cover shadow" />
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold truncate text-base leading-tight">{song.title}</span>
              <span className="text-white/60 text-sm truncate">{song.artist}</span>
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); toggleMute(); }} className="p-2 group">
            {isMuted ? (
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition"><path d="M4 9V15H8L13 19V5L8 9H4Z"/><line x1="18" y1="8" x2="8" y2="18" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="8" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/></svg>
            ) : (
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition"><path d="M4 9V15H8L13 19V5L8 9H4Z"/></svg>
            )}
          </button>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-white/60 w-10 text-left">{formatTime(progress)}</span>
          <div className="relative flex-1 h-2 group cursor-pointer" onClick={e => { e.stopPropagation(); handleSeek(e); }}>
            <div className="absolute w-full h-1 bg-white/20 rounded-full" />
            <div className="absolute h-1 bg-white rounded-full" style={{ width: `${(progress / duration) * 100}%` }} />
          </div>
          <span className="text-xs text-white/60 w-10 text-right">{formatTime(duration)}</span>
        </div>
        {/* Controls */}
        <div className="flex items-center justify-center gap-8 mt-1">
          <button onClick={e => { e.stopPropagation(); handlePrev(); }} className="p-2 group">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition"><path d="M22 26L10 16L22 6V26Z"/><path d="M10 6V26"/></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); togglePlay(); }} className="p-2 group">
            {isPlaying ? (
              <svg width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition"><rect x="11" y="9" width="6" height="20" rx="2"/><rect x="21" y="9" width="6" height="20" rx="2"/></svg>
            ) : (
              <svg width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition"><polygon points="12,9 32,19 12,29"/></svg>
            )}
          </button>
          <button onClick={e => { e.stopPropagation(); handleNext(); }} className="p-2 group">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition"><path d="M10 6L22 16L10 26V6Z"/><path d="M22 6V26"/></svg>
          </button>
        </div>
        {/* Volume slider */}
        <div className="flex items-center justify-end gap-2 mt-2">
          <div className="relative w-20 h-2 flex items-center group cursor-pointer" onClick={e => { e.stopPropagation(); handleVolumeChange(e); }}>
            <div className="absolute w-full h-1 bg-white/20 rounded-full" />
            <div className="absolute h-1 bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
