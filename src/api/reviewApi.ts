import api from "./axios";

export const reviewApi = {
  createReview: (data: { playlistId: number; userEmail: string; rating: number; content: string }) => {
  return api.post('/api/review', data);
},

  getAllReview: () => {
    return api.get("/api/review/all");
  },

  getReviewByPlaylist: (playlistId: number) => {
    return api.get(`/api/review/playlist/${playlistId}`);
  },

  getReviewByUser: (email: string) => {
    return api.get(`/api/review/user/${email}`);
  },

  updateReview: (reviewId: number , data: {
      rating: string;
      content: string;
  }) => {
      return api.put(`/api/review/${reviewId}`, data);
  },

  deleteReview: (reviewId: number) => {
      return api.delete(`/api/review/${reviewId}`);
  },
};
