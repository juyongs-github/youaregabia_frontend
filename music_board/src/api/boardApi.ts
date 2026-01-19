// src/api/boardApi.ts
import axiosInstance from './axios';
import type { Board } from '../types/board';

export const boardApi = {
  getBoards: () =>
    axiosInstance.get<Board[]>('/boards').then((res) => res.data),

  getBoardDetail: (boardId: number) =>
    axiosInstance.get<Board>(`/boards/${boardId}`).then((res) => res.data),

  createBoard: async (data: {
    title: string;
    content: string;
  }): Promise<number> => {
    const res = await axiosInstance.post('/boards', data, {
      params: { userId: 1 },
    });
    return res.data;
  },
  updateBoard: (boardId: number, data: { title: string; content: string }) =>
    axiosInstance.put(`/boards/${boardId}`, data, {
      params: { userId: 1 }, // 🔥 임시
    }),

  deleteBoard: (boardId: number) =>
    axiosInstance.delete(`/boards/${boardId}`, {
      params: { userId: 1 }, // 🔥 임시
    }),
};
