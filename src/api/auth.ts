import api from "./axios";

/* ===========================
회원가입 DTO
=========================== */
export interface RegisterRequest {
  email: string;
  name: string;
  birthDate: string; // ✅ 추가
  password: string;
  phoneNumber: string;
  address: string;

  // [추가 예정]
  // zipCode?: string;         // 주소 API 붙이면 같이 쓰는 걸 추천
  // detailAddress?: string;   // 분리 저장이면 백엔드 DTO도 맞춰야 함
}

/* ===========================
로그인 DTO
=========================== */
export interface LoginRequest {
  email: string;
  password: string;
}

/* ===========================
회원가입 API
=========================== */
export const register = (data: RegisterRequest) => {
  return api.post("/api/auth/register", data);
};

/* ===========================
로그인 API
=========================== */
export const login = (data: LoginRequest) => {
  return api.post("/api/auth/login", data);
};

/* ===========================
이메일 중복체크 API
- 백엔드에서 boolean(true=중복)으로 내려준다는 전제
=========================== */
export const checkEmailDuplicate = (email: string) => {
  return api.get<boolean>("/api/auth/email-check", {
    params: { email },
  });
};

/* ===========================
로그아웃 API (JWT 도입 후)
=========================== */
// export const logout = () => api.post("/api/auth/logout");
