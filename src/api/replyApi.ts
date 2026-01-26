import api from "./axios";


export const replyApi = {
  createReply: (boardId: number, data: { content: string }): Promise<number> =>
    api
      .post(`/community/share/${boardId}/replies`, data, {
        params: { userId: 1 }, // 로그인 merge 전 임시
      })
      .then((res) => res.data),

  updateReply: (replyId: number, data: { content: string }) =>
    api.put(`/community/share/replies/${replyId}`, data, {
      params: { userId: 1 },
    }),

  deleteReply: (replyId: number) =>
    api.delete(`/community/share/replies/${replyId}`, {
      params: { userId: 1 },
    }),

  // 좋아요 , body 부분 null -> axios 문법
  toggleLike: (replyId: number, userId: number) =>
    api
      .post<{
        likeCount: number;
        likedByMe: boolean;
      }>(`/replies/${replyId}/like`, null, {
        params: { userId },
      })
      .then((res) => res.data),
};
