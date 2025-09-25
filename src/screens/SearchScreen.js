import React, { useState } from 'react';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const recentSearches = [
    'Drake',
    'Billie Eilish',
    'The Weeknd',
    'Taylor Swift',
    'Dua Lipa'
  ];

  const trendingSearches = [
    'Anti-Hero - Taylor Swift',
    'Flowers - Miley Cyrus',
    'As It Was - Harry Styles',
    'unholy - Sam Smith',
    'Shivers - Ed Sheeran'
  ];

  return (
    <div className="search-screen">
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="Artists, songs, or podcasts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      {!searchQuery && (
        <>
          <section className="search-section">
            <h2 className="section-title">Recent searches</h2>
            <div className="search-list">
              {recentSearches.map((search, index) => (
                <div key={index} className="search-item">
                  <span className="search-text">{search}</span>
                  <span className="search-close">✕</span>
                </div>
              ))}
            </div>
          </section>

          <section className="search-section">
            <h2 className="section-title">Trending searches</h2>
            <div className="search-list">
              {trendingSearches.map((search, index) => (
                <div key={index} className="search-item">
                  <span className="trending-icon">📈</span>
                  <span className="search-text">{search}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {searchQuery && (
        <div className="search-results">
          <p className="search-results-text">Search results for "{searchQuery}"</p>
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <p>No results found</p>
          </div>
        </div>
      )}
    </div>
  );
}