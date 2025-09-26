
import { apiKey } from './config';
import axios from 'axios';

const apiAxios = axios.create({
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

export default apiAxios;
