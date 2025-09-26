const API_URL = process.env.REACT_APP_API_URL || 'https://purplemusicapp.onrender.com';

export async function getSongs() {
  const res = await fetch(`${API_URL}/songs`);
  if (!res.ok) throw new Error('Greška pri učitavanju pesama');
  return res.json();
}

export async function addSong(song) {
  const res = await fetch(`${API_URL}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song)
  });
  if (!res.ok) throw new Error('Greška pri dodavanju pesme');
  return res.json();
}

export async function deleteSong(id) {
  const res = await fetch(`${API_URL}/songs/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Greška pri brisanju pesme');
  return res.json();
}
