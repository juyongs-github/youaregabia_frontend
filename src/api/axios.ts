import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080", // 스프링 부트 서버의 baseURL
  // headers: {
  //   "Content-Type": "application/json; charset=UTF-8", // 인코딩 설정 추가
  // },
  timeout: 10000, // timeout 10초
});

export default api;
