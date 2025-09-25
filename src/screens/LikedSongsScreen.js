import React from 'react';
// ...existing code...

export default function LikedSongsScreen() {
  // ...existing code...
  
  const [likedSongs, setLikedSongs] = React.useState([]);
  React.useEffect(() => {
    import('../supabaseClient').then(({ supabase }) => {
      supabase
        .from('liked_songs')
        .select('*')
        .then(({ data, error }) => {
          if (error) {
            alert('Error loading liked songs: ' + error.message);
          } else {
            setLikedSongs(data || []);
          }
        });
    });
  }, []);

  const handlePlaySong = (song, index) => {
    alert('Play: ' + song.title);
  };

  const handlePlayAll = () => {
    alert('Play all liked songs');
  };

  return (
    <div className="liked-songs-screen">
      <div className="liked-header">
        <div className="liked-cover">
          <span className="liked-icon">💚</span>
        </div>
        <div className="liked-info">
          <p className="liked-type">Playlist</p>
          <h1 className="liked-title">Liked Songs</h1>
          <p className="liked-count">{likedSongs.length} songs</p>
        </div>
      </div>

      <div className="liked-controls">
        <button className="play-all-btn" onClick={handlePlayAll}>
          <span>▶</span>
          Play
        </button>
        <button className="shuffle-btn">
          🔀
        </button>
      </div>

      <div className="songs-list">
        {likedSongs.map((song, index) => (
          <div key={song.id} className="song-item" onClick={() => handlePlaySong(song, index)}>
            <div className="song-number">{index + 1}</div>
            <div className="song-cover">
              <span>{song.cover}</span>
            </div>
            <div className="song-details">
              <h3 className="song-title">{song.title}</h3>
              <p className="song-artist">{song.artist}</p>
            </div>
            <div className="song-duration">{song.duration}</div>
            <button 
              className="song-menu"
              onClick={(e) => e.stopPropagation()}
            >
              ⋯
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}