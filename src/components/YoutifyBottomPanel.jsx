import React from 'react';

export default function YoutifyBottomPanel() {
  return (
    <div className="y-bottom" role="contentinfo" aria-label="Player">
      <div className="y-bottom-inner">
        <div className="y-bottom-info">
          <div className="y-bottom-title">Welcome to PurpleMusic</div>
          <div className="y-bottom-sub">Sign in with Pi to unlock premium</div>
        </div>
        <div className="y-bottom-controls">
          <button className="y-ctrl y-prev" title="Previous" aria-label="Previous" disabled>⏮</button>
          <button className="y-ctrl y-play" title="Play/Pause" aria-label="Play/Pause" disabled>▶</button>
          <button className="y-ctrl y-next" title="Next" aria-label="Next" disabled>⏭</button>
        </div>
      </div>
    </div>
  );
}
