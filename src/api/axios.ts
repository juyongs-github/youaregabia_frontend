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

// response interceptor — 에러 공통 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const message =
        error.response.data?.message ?? "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      alert(message);
    }
    return Promise.reject(error);
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
