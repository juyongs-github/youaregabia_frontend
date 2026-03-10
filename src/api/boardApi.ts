// src/api/boardApi.ts
import type { Board, PageResult, PageRequest } from "../types/board";
import api from "./axios";

export const boardApi = {
  // 전체 조회
  getBoards: (params: PageRequest & { keyword?: string; genre?: string }) =>
    api.get<PageResult<Board>>("/community/share", { params }).then((res) => res.data),

  // 상세 조회
  getBoardDetail: (boardId: number, pageRequest: PageRequest = { page: 1, size: 10 }) =>
    api
      .get<Board>(`/community/share/${boardId}`, {
        params: { ...pageRequest },
      })
      .then((res) => res.data),

  // 게시글 추가
  createBoard: async (data: {
    title: string;
    content: string;
    boardType: string;
    boardGenre: string;
  }): Promise<number> => {
    const res = await api.post("/community/share/add", data);
    return res.data;
  },

  // 게시글 수정
  updateBoard: (boardId: number, data: { title: string; content: string; boardGenre: string }) =>
    api.put(`/community/share/update/${boardId}`, data),

  // 게시글 삭제
  deleteBoard: (boardId: number) => api.delete(`/community/share/delete/${boardId}`),
};
