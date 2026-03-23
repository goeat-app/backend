import axios from "axios";

export const api = axios.create({
  baseURL: `${process.env.RECOMMENDER_SYSTEM_URL}/recommender`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});