import axios from "axios";
import { store } from "../store";

const api = axios.create({
  baseURL: "http://localhost:8080", // 스프링 부트 서버의 baseURL
  // headers: {
  //   "Content-Type": "application/json; charset=UTF-8", // 인코딩 설정 추가
  // },
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
});

// axios.ts - localStorage 폴백 추가
api.interceptors.request.use((config) => {
  const token = store.getState().auth.user?.token ?? localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
