// src/api/boardApi.ts
import type { Board,PageResult, PageRequest } from '../types/board';
import api from './axios';

export const boardApi = {
  getBoards: (params: PageRequest) =>
    api.get<PageResult<Board>>('/community/share', { params }).then((res) => res.data),

  getBoardDetail: (boardId: number, userId: number, pageRequest: PageRequest = { page: 1, size: 10 }
  ) =>
    api.get<Board>(`/community/share/${boardId}`, {
      params: { userId, ...pageRequest }
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
      params: { userId: 1 }, // 임시
    }),

  deleteBoard: (boardId: number) =>
    api.delete(`/community/share/${boardId}`, {
      params: { userId: 1 }, // 임시
    }),
};
