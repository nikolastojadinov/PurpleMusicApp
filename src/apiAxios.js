
import { apiKey } from './config';
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'https://purplemusicapp.onrender.com';

const apiAxios = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

export default apiAxios;
