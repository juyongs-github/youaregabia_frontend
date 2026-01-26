// src/api/boardApi.ts
import type { Board } from '../types/board';
import api from './axios';

export const boardApi = {
  getBoards: () =>
    api.get<Board[]>('/community/share').then((res) => res.data),

  getBoardDetail: (boardId: number, userId: number) =>
    api
      .get<Board>(`/community/share/${boardId}`, {
        params: { userId },
      })
      .then((res) => res.data),

  createBoard: async (data: {
    title: string;
    content: string;
  }): Promise<number> => {
    const res = await api.post('/community/share', data, {
      params: { userId: 1 },
    });
    return res.data;
  },
  updateBoard: (boardId: number, data: { title: string; content: string }) =>
    api.put(`/community/share/${boardId}`, data, {
      params: { userId: 1 }, // 🔥 임시
    }),

  deleteBoard: (boardId: number) =>
    api.delete(`/community/share/${boardId}`, {
      params: { userId: 1 }, // 🔥 임시
    }),
};
