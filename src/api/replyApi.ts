import api from "./axios";


export const replyApi = {
  createReply: (boardId: number, data: { content: string },email: string): Promise<number> =>
    api
      .post(`/community/share/${boardId}/replies`, data, {
        params: { email }, // 로그인 merge 전 임시
      })
      .then((res) => res.data),

  updateReply: (replyId: number, data: { content: string },email: string) =>
    api.put(`/community/share/replies/${replyId}`, data, {
      params: { email},
    }),

  deleteReply: (replyId: number,email: string) =>
    api.delete(`/community/share/replies/${replyId}`, {
      params: { email },
    }),

  // 좋아요 , body 부분 null -> axios 문법
  toggleLike: (replyId: number,email: string) =>
    api
      .post<{
        likeCount: number;
        likedByMe: boolean;
      }>(`/replies/${replyId}/like`, null, {
        params: { email },
      })
      .then((res) => res.data),
};
