import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function PlaylistDetailScreen() {
  const { id: playlistId } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch playlist info
  useEffect(() => {
    async function fetchPlaylist() {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();
      if (error) {
        alert('Greška pri učitavanju plejliste.');
        navigate('/');
        return;
      }
      setPlaylist(data);
    }
    fetchPlaylist();
  }, [playlistId, navigate]);

  // Fetch playlist songs
  useEffect(() => {
    async function fetchPlaylistSongs() {
      const { data, error } = await supabase
        .from('playlist_items')
        .select('track_url, cover_url, title, artist, added_at')
        .eq('playlist_id', playlistId)
        .order('added_at', { ascending: false });
      setPlaylistSongs(data || []);
    }
    fetchPlaylistSongs();
  }, [playlistId]);

  // Fetch songs for search or recommendations
  useEffect(() => {
    async function fetchSongs() {
      setLoading(true);
      let query = supabase
        .from('Music')
        .select('track_url, cover_url, title, artist');
      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      } else {
        query = query.order('random()', { ascending: true }).limit(10);
      }
      const { data, error } = await query;
      setSongs(data || []);
      setLoading(false);
    }
    fetchSongs();
  }, [search]);

  // Add song to playlist
  async function handleAddSong(song) {
    const { error } = await supabase
      .from('playlist_items')
      .insert({
        playlist_id: playlistId,
        track_url: song.track_url,
        cover_url: song.cover_url,
        title: song.title,
        artist: song.artist
      });
    if (error) {
      alert('Greška pri dodavanju pesme: ' + error.message);
      return;
    }
    // Refresh playlist songs
    const { data } = await supabase
      .from('playlist_items')
      .select('track_url, cover_url, title, artist, added_at')
      .eq('playlist_id', playlistId)
      .order('added_at', { ascending: false });
    setPlaylistSongs(data || []);
  }

  // Play preview
  function handlePlaySong(song) {
    const audio = new Audio(song.track_url);
    audio.play();
  }

  if (!playlist) return <div className="playlist-detail-loading">Loading...</div>;

  return (
    <div className="playlist-detail-screen" style={{maxWidth:600,margin:'0 auto',padding:'2rem'}}>
      <h1 style={{fontSize:'2rem',fontWeight:'bold',marginBottom:'1rem'}}>{playlist.name}</h1>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search songs..."
        style={{width:'100%',padding:'0.5rem',fontSize:'1rem',marginBottom:'1.5rem',borderRadius:8,border:'1px solid #ccc'}}
      />
      <h2 style={{fontSize:'1.2rem',marginBottom:'1rem'}}>
        {search.trim() ? 'Search results' : 'Recommended songs'}
      </h2>
      {loading ? <div>Loading songs...</div> : (
        <div>
          {songs.map(song => (
            <div key={song.track_url} style={{display:'flex',alignItems:'center',marginBottom:'1rem',background:'#222',borderRadius:8,padding:'0.5rem'}}>
              <img src={song.cover_url} alt="cover" style={{width:48,height:48,borderRadius:8,marginRight:'1rem'}} />
              <div style={{flex:1}}>
                <div style={{fontWeight:'bold'}}>{song.title}</div>
                <div style={{color:'#aaa'}}>{song.artist}</div>
              </div>
              <button onClick={() => handlePlaySong(song)} style={{marginRight:8,padding:'0.5rem',borderRadius:8,background:'#444',color:'#fff',border:'none',cursor:'pointer'}}>▶️</button>
              <button onClick={() => handleAddSong(song)} style={{padding:'0.5rem',borderRadius:8,background:'#1db954',color:'#fff',border:'none',cursor:'pointer'}}>➕</button>
            </div>
          ))}
        </div>
      )}
      <h2 style={{fontSize:'1.2rem',margin:'2rem 0 1rem'}}>Songs in this playlist</h2>
      {playlistSongs.length === 0 ? <div>No songs yet.</div> : (
        <div>
          {playlistSongs.map(song => (
            <div key={song.track_url+song.added_at} style={{display:'flex',alignItems:'center',marginBottom:'1rem',background:'#333',borderRadius:8,padding:'0.5rem'}}>
              <img src={song.cover_url} alt="cover" style={{width:40,height:40,borderRadius:8,marginRight:'1rem'}} />
              <div style={{flex:1}}>
                <div style={{fontWeight:'bold'}}>{song.title}</div>
                <div style={{color:'#aaa'}}>{song.artist}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
