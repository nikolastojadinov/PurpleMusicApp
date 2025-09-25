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
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(null);

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

  // Drag & Drop
  const handleDragStart = (e) => {
    setDragging(true);
    setStartY(e.clientY);
  };
  const handleDrag = (e) => {
    if (!dragging) return;
    const offset = e.clientY - startY;
    setDragOffset(Math.max(0, offset));
  };
  const handleDragEnd = () => {
    setDragging(false);
    setStartY(null);
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
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragging, startY]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{
        bottom: `calc(32px + ${dragOffset}px)`,
        transition: dragging ? 'none' : 'bottom 0.2s',
        maxWidth: 420,
        width: '95vw',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleDragStart}
    >
      <audio
        ref={audioRef}
        src={song.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        volume={volume}
      />
      <div className="backdrop-blur-md bg-black/70 rounded-2xl shadow-lg border border-white/10 flex flex-col px-6 py-4 select-none">
        <div className="flex items-center gap-4">
          {/* Controls */}
          <button onClick={e => { e.stopPropagation(); handlePrev(); }} className="p-2 group">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/80 group-hover:text-white transition"><path d="M16 18L8.5 12L16 6V18Z"/><path d="M8 6V18"/></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); togglePlay(); }} className="p-2 group">
            {isPlaying ? (
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/80 group-hover:text-white transition"><rect x="6" y="5" width="5" height="14" rx="1.5"/><rect x="15" y="5" width="5" height="14" rx="1.5"/></svg>
            ) : (
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/80 group-hover:text-white transition"><polygon points="7,5 23,14 7,23"/></svg>
            )}
          </button>
          <button onClick={e => { e.stopPropagation(); handleNext(); }} className="p-2 group">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/80 group-hover:text-white transition"><path d="M8 6L15.5 12L8 18V6Z"/><path d="M16 6V18"/></svg>
          </button>
          {/* Cover & Info */}
          <img src={song.cover} alt="cover" className="w-12 h-12 rounded-md object-cover ml-4 shadow" />
          <div className="flex flex-col ml-3 flex-1 min-w-0">
            <span className="text-white font-medium truncate text-base leading-tight">{song.title}</span>
            <span className="text-white/60 text-sm truncate">{song.artist}</span>
          </div>
          {/* Volume */}
          <div className="flex items-center ml-4 gap-2 min-w-[60px]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/80"><path d="M4 9V15H8L13 19V5L8 9H4Z"/></svg>
            <div className="relative w-16 h-2 flex items-center group cursor-pointer" onClick={e => { e.stopPropagation(); handleVolumeChange(e); }}>
              <div className="absolute w-full h-1 bg-white/20 rounded-full" />
              <div className="absolute h-1 bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-white/60 w-10 text-left">{formatTime(progress)}</span>
          <div className="relative flex-1 h-2 group cursor-pointer" onClick={e => { e.stopPropagation(); handleSeek(e); }}>
            <div className="absolute w-full h-1 bg-white/20 rounded-full" />
            <div className="absolute h-1 bg-white rounded-full" style={{ width: `${(progress / duration) * 100}%` }} />
          </div>
          <span className="text-xs text-white/60 w-10 text-right">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
