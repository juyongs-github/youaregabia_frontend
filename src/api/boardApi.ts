// src/api/boardApi.ts
import type { Board, PageResult, PageRequest } from "../types/board";
import api from "./axios";

export const boardApi = {
  // 전체 조회
  getBoards: (
    params: PageRequest & { keyword?: string; genre?: string; boardType?: string; sort?: string }
  ) => api.get<PageResult<Board>>("/api/community/share", { params }).then((res) => res.data),

  // 상세 조회
  getBoardDetail: (boardId: number, pageRequest: PageRequest = { page: 1, size: 10 }) =>
    api
      .get<Board>(`/api/community/share/${boardId}`, {
        params: { ...pageRequest },
      })
      .then((res) => res.data),

  // 게시글 추가
  createBoard: async (data: {
    title: string;
    content: string;
    boardType: string;
    boardGenre: string;
    songIds?: number[];
  }): Promise<number> => {
    const res = await api.post("/api/community/share/add", data);
    return res.data;
  },

  // 게시글 수정
  updateBoard: (boardId: number, data: { title: string; content: string; boardGenre: string }) =>
    api.put(`/api/community/share/update/${boardId}`, data),

  // 게시글 삭제
  deleteBoard: (boardId: number) => api.delete(`/api/community/share/delete/${boardId}`),

  getCriticBoards: (songId: number, params: PageRequest) =>
    api
      .get<PageResult<Board>>("/api/community/share/critic", {
        params: { songId, ...params },
      })
      .then((res) => res.data),

  getCriticList: (params: PageRequest, keyword?: string) =>
    api
      .get<PageResult<Board>>("/api/community/share/critic/list", {
        params: { ...params, keyword },
      })
      .then((res) => res.data),

  toggleBoardLike: (boardId: number) =>
    api
      .post<{ likeCount: number; likedByMe: boolean }>(`/api/boards/${boardId}/like`, null)
      .then((res) => res.data),
};
