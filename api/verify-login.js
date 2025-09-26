// Express handler for /api/verify-login
// Pi Network backend validation (see https://github.com/pi-apps/demo/blob/main/backend/README.md)

const axios = require('axios');

module.exports = async function (req, res) {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing accessToken' });
  }

  try {
    // Validate token with Pi Network
    const piApiUrl = 'https://api.minepi.com/v2/me';
    const piRes = await axios.get(piApiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    // piRes.data: { username, ... }
    if (piRes.data && piRes.data.username) {
      return res.json({ username: piRes.data.username });
    } else {
      return res.status(401).json({ error: 'Invalid token or no username' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Pi Network validation failed' });
  }
};
