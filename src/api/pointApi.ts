import type { PageResult } from "../types/board";
import api from "./axios";

export const pointApi = {
  getMyPoint: () =>
    api.get<{ totalPoint: number; grade: string }>("/points/me").then((res) => res.data),

<<<<<<< HEAD
  getHistory: (params: { page: number; size: number; filter?: string }) =>
    api.get<PageResult<PointHistoryDto>>("/api/points/history", { params }).then((res) => res.data),
=======
  getHistory: (params: { page: number; size: number }) =>
    api.get<PageResult<PointHistoryDto>>("/points/history", { params }).then((res) => res.data),
>>>>>>> d2ef0f87159588a80ec266cf3bce1def7ba156a3

  deductPoint: (amount: number) => api.post("/points/deduct", { amount }),

  addQuizPoint: (amount: number, quizType: string) =>
    api.post("/points/quiz", { amount, quizType }),
};

export interface PointHistoryDto {
  id: number;
  pointType: string;
  amount: number;
  createdAt: string;
}
