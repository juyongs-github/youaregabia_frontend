import axios from "axios";
import { store } from "../store";

const api = axios.create({
<<<<<<< HEAD
  baseURL: "http://localhost:8080",
=======
  baseURL: "/api", // nginx proxy 기준 baseURL
>>>>>>> d2ef0f87159588a80ec266cf3bce1def7ba156a3
  // headers: {
  //   "Content-Type": "application/json; charset=UTF-8",
  // },
<<<<<<< HEAD
  timeout: 10000,
=======
  timeout: 60000, // timeout 60초
});
// 요청마다 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = store.getState().auth.user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// axios.ts
api.interceptors.request.use((config) => {
  const token = store.getState().auth.user?.token; // user 안에 있음
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
>>>>>>> d2ef0f87159588a80ec266cf3bce1def7ba156a3
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
