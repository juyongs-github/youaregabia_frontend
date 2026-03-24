import axios from "axios";
import { store } from "../store";

const api = axios.create({
  baseURL: "/api", // nginx proxy 기준 baseURL
  // headers: {
  //   "Content-Type": "application/json; charset=UTF-8",
  // },
  timeout: 60000,
});

// 요청마다 토큰 자동 첨부 (localStorage 폴백 포함)
api.interceptors.request.use((config) => {
  const token = store.getState().auth.user?.token ?? localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// response interceptor — Rate limit 공통 처리
let rateLimitHandler: ((message: string, remainSeconds: number) => void) | null = null;

export function setRateLimitHandler(handler: (message: string, remainSeconds: number) => void) {
  rateLimitHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const { message, remainSeconds } = error.response.data;
      if (rateLimitHandler) {
        rateLimitHandler(message, remainSeconds);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
