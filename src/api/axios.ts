import axios from "axios";
import { store } from "../store";

const api = axios.create({
  baseURL: "http://localhost:8080", // 스프링 부트 서버의 baseURL
  // headers: {
  //   "Content-Type": "application/json; charset=UTF-8", // 인코딩 설정 추가
  // },
  timeout: 10000, // timeout 10초
});
// 요청마다 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = store.getState().auth.user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

<<<<<<< HEAD
// axios.ts
api.interceptors.request.use((config) => {
  const token = store.getState().auth.user?.token; // user 안에 있음
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
=======
// response interceptor — 에러 공통 처리
// App.tsx에서 등록한 핸들러를 저장
let rateLimitHandler: ((message: string, remainSeconds: number) => void) | null = null;

export function setRateLimitHandler(handler: (message: string, remainSeconds: number) => void) {
  rateLimitHandler = handler;
}

// response interceptor
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
>>>>>>> origin/deploy/test4-yks
  }
);

// axios.ts - localStorage 폴백 추가
api.interceptors.request.use((config) => {
  const token = store.getState().auth.user?.token ?? localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
