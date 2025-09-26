
import { apiKey } from './config';
import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://purplemusicapp.onrender.com' // Itt add meg a backend URL-t
  : '';

const apiAxios = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

export default apiAxios;
