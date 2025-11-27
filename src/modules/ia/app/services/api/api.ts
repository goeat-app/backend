import axios from "axios";

export const api = axios.create({
  baseURL: 'http://localhost:8000/recommender',
  timeout: 10000,
});