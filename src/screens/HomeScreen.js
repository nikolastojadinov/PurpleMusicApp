import React from 'react';

export default function HomeScreen() {
  const recentlyPlayed = [
    { id: 1, title: 'Liked Songs', type: 'playlist', cover: '💚' },
    { id: 2, title: 'Chill Mix', type: 'playlist', cover: '😌' },
    { id: 3, title: 'Discover Weekly', type: 'playlist', cover: '🔥' },
    { id: 4, title: 'Release Radar', type: 'playlist', cover: '📡' },
    { id: 5, title: 'Daily Mix 1', type: 'playlist', cover: '🎵' },
    { id: 6, title: 'Pop Mix', type: 'playlist', cover: '🎤' }
  ];

  const madeForYou = [
    { id: 1, title: 'Discover Weekly', subtitle: 'Your weekly mixtape of fresh music', cover: '🔍' },
    { id: 2, title: 'Release Radar', subtitle: 'Catch all the latest music', cover: '📡' },
    { id: 3, title: 'Daily Mix 1', subtitle: 'Taylor Swift, Olivia Rodrigo and more', cover: '🎵' },
    { id: 4, title: 'Daily Mix 2', subtitle: 'The Weeknd, Dua Lipa and more', cover: '🎶' }
  ];

  const trendingNow = [
    { id: 1, title: 'Today\'s Top Hits', subtitle: 'Dua Lipa is on top of the Hottest 50!', cover: '🔥' },
    { id: 2, title: 'RapCaviar', subtitle: 'New music from Drake, Travis Scott and more', cover: '🎤' },
    { id: 3, title: 'Global Top 50', subtitle: 'Your daily update of the most played tracks', cover: '🌍' },
    { id: 4, title: 'Viral 50', subtitle: 'The most viral tracks right now', cover: '📈' }
  ];

  return (
    <div className="home-screen">
      <div className="search-bar-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Artists, songs, or podcasts" 
            className="search-input"
            readOnly
          />
        </div>
      </div>

      <section className="home-section">
        <h2 className="section-title">Recently played</h2>
        <div className="horizontal-scroll">
          {recentlyPlayed.map((item) => (
            <div key={item.id} className="recent-item">
              <div className="recent-cover">
                <span>{item.cover}</span>
              </div>
              <h3 className="recent-title">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">Made for you</h2>
        <div className="horizontal-scroll">
          {madeForYou.map((item) => (
            <div key={item.id} className="made-item">
              <div className="made-cover">
                <span>{item.cover}</span>
              </div>
              <h3 className="made-title">{item.title}</h3>
              <p className="made-subtitle">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">Trending now</h2>
        <div className="horizontal-scroll">
          {trendingNow.map((item) => (
            <div key={item.id} className="trending-item">
              <div className="trending-cover">
                <span>{item.cover}</span>
              </div>
              <h3 className="trending-title">{item.title}</h3>
              <p className="trending-subtitle">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}