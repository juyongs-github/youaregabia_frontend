import axiosInstance from './axios';

export const replyApi = {
  createReply: (boardId: number, data: { content: string }): Promise<number> =>
    axiosInstance
      .post(`/boards/${boardId}/replies`, data, {
        params: { userId: 1 }, // 로그인 merge 전 임시
      })
      .then((res) => res.data),

  updateReply: (replyId: number, data: { content: string }) =>
    axiosInstance.put(`/boards/replies/${replyId}`, data, {
      params: { userId: 1 },
    }),

  deleteReply: (replyId: number) =>
    axiosInstance.delete(`/boards/replies/${replyId}`, {
      params: { userId: 1 },
    }),

  // 좋아요 , body 부분 null -> axios 문법
  toggleLike: (replyId: number, userId: number) =>
    axiosInstance
      .post<{
        likeCount: number;
        likedByMe: boolean;
      }>(`/replies/${replyId}/like`, null, {
        params: { userId },
      })
      .then((res) => res.data),
};
