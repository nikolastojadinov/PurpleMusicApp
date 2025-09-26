const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const verifyLogin = require('./api/verify-login');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/verify-login', verifyLogin);

app.get('/', (req, res) => {
  res.send('PurpleMusic Pi Network backend is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
