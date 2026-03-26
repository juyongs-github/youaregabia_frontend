import api from "./axios";

/* ===========================
회원가입 DTO
=========================== */
export interface RegisterRequest {
  email: string;
  name: string;
  birthDate: string;
  password: string;
  phoneNumber: string;
  address: string;
  addressDetail?: string;
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
/* ===========================
이메일 중복체크 API (백엔드 맞춤형)
=========================== */
export const checkEmailDuplicate = (email: string) => {
  return api.get("/api/auth/email-check", {
    params: { email },
    // 💡 백엔드가 application/json이 아닌 text/plain을 보내므로 responseType을 text로 고정합니다.
    responseType: "text",
  }).then(res => {
    // 💡 넘어온 데이터가 문자열 "true"면 중복(true), 아니면 사용가능(false)으로 변환해서 반환합니다.
    return { data: String(res.data).trim() === "true" };
  });
};

/* ===========================
로그아웃 API (JWT 도입 후)
=========================== */
// export const logout = () => api.post("/auth/logout");





// src/api/auth.ts
export interface CiVerifyResponse {
  success: boolean;
  ci: string | null;
  exists: boolean | null;
  message: string | null;
}

export async function verifyCiMock(payload: {
  name: string;
  birthDate: string; // "YYYY-MM-DD"
  phoneNumber: string;     // "010-xxxx-xxxx" or digits (백엔드 정규식이 하이픈 허용)
}): Promise<CiVerifyResponse> {
  const res = await fetch("/api/ci/mock/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  // CI verify는 exists 같은 결과를 바디로 내려주므로, 실패 시에도 메시지를 보여줘야 함
  if (!res.ok) {
    // 400일 때도 CiVerifyResponse 형태로 내려오게 컨트롤러를 이미 만들었음
    return data as CiVerifyResponse;
  }

  return data as CiVerifyResponse;
}
