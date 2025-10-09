import React from 'react';
import YoutifyTopBar from './YoutifyTopBar';
import YoutifyLeftNav from './YoutifyLeftNav';
import YoutifyBottomPanel from './YoutifyBottomPanel';

export default function YoutifyShell({ children }) {
  return (
    <div className="y-shell">
      <YoutifyTopBar />
      <div className="y-body">
        <aside className="y-left">
          <YoutifyLeftNav />
        </aside>
        <main className="y-main" role="main">
          {children}
        </main>
      </div>
      <YoutifyBottomPanel />
    </div>
  );
}
