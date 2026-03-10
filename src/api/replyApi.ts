import api from "./axios";

export const replyApi = {
  createReply: (
    boardId: number,
    data: { content: string; parentReplyId?: number }
  ): Promise<number> =>
    api.post(`/community/share/${boardId}/replies`, data).then((res) => res.data),

  updateReply: (replyId: number, data: { content: string }) =>
    api.put(`/community/share/replies/${replyId}`, data),

  deleteReply: (replyId: number) => api.delete(`/community/share/replies/${replyId}`),

  // 좋아요 , body 부분 null -> axios 문법
  toggleLike: (replyId: number) =>
    api
      .post<{
        likeCount: number;
        likedByMe: boolean;
      }>(`/replies/${replyId}/like`, null)
      .then((res) => res.data),
};
