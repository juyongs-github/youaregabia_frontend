import api from "./axios";

/**
 * [FIX]
 * - 기존에는 sms.ts만 axios를 따로 생성해서 씀.
 * - 그러면 나중에 JWT/인터셉터/공통 에러처리 붙일 때 SMS만 따로 놀게 됨.
 * - 그래서 api 인스턴스로 통일.
 */
export interface SmsSendResponse {
  success: boolean;
  message: string;
  mockCode?: string; // mock 단계에서만 내려옴
}

export interface SmsVerifyResponse {
  success: boolean;
  message: string;
}

// 인증번호 전송
export const sendSmsCode = async (phoneNumber: string) => {
  const res = await api.post<SmsSendResponse>("/api/auth/sms/send", { phoneNumber });
  return res.data;
};

// 인증번호 검증
export const verifySmsCode = async (phoneNumber: string, code: string) => {
  const res = await api.post<SmsVerifyResponse>("/api/auth/sms/verify", { phoneNumber, code });
  return res.data;
};
