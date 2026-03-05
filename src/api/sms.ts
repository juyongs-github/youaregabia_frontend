import api from "./axios";

// src/api/sms.ts
export interface SmsSendResponse {
  success: boolean;
  message: string;
  mockCode?: string; // mock 단계에서만 내려옴
}

export interface SmsVerifyResponse {
  success: boolean;
  message: string;
}

export async function sendSmsCode(phoneNumber: string): Promise<SmsSendResponse> {
  const res = await fetch("/api/auth/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });

  // ✅ 백엔드에서 JSON이 아닐 가능성 방지(에러 디버깅에 도움)
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || "인증번호 요청 실패");
  }

  return data as SmsSendResponse;
}

export async function verifySmsCode(phoneNumber: string, code: string): Promise<SmsVerifyResponse> {
  const res = await fetch("/api/auth/sms/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, code }),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || "인증 실패");
  }

  return data as SmsVerifyResponse;
};
