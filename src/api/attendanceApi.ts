import api from "./axios";

export interface AttendanceResponse {
  isAlreadyChecked: boolean;
  streak: number;
  point: number;
  bonusPoint: number;
}

export interface AttendanceStatusResponse {
  checked: boolean;
  streak: number;
}

export const attendanceApi = {
  // 출석 체크
  check: async (): Promise<AttendanceResponse> => {
    const res = await api.post("/api/attendance");
    return res.data;
  },

  // 오늘 출석 여부 + streak 조회
  getStatus: async (): Promise<AttendanceStatusResponse> => {
    const res = await api.get("/api/attendance/status");
    return res.data;
  },

  // 이번 달 출석 달력
  getCalendar: async (year: number, month: number): Promise<string[]> => {
    const res = await api.get("/api/attendance/calendar", {
      params: { year, month },
    });
    return res.data; // ["2025-03-01", "2025-03-02", ...]
  },
};
