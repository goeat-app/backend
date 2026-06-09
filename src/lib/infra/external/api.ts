import axios from 'axios';

export const apiInstance = (baseURL: string | undefined) =>
  axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });
