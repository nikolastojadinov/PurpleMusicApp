const { apiKey } = require('./config');
const axios = require('axios');

const apiAxios = axios.create({
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

module.exports = apiAxios;
