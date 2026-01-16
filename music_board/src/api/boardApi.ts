// src/api/boardApi.ts
import axiosInstance from './axios';
import type { Board } from '../types/board';

export const boardApi = {
  getBoards: () =>
    axiosInstance.get<Board[]>('/boards').then((res) => res.data),

  getBoardDetail: (boardId: number) =>
    axiosInstance.get<Board>(`/boards/${boardId}`).then((res) => res.data),
};
