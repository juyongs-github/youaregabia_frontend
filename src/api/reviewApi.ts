import api from "./axios";

export const reviewApi = {
  createReview: (data: { playlistId: number; userEmail: string; rating: number; content: string }) => {
  return api.post('/review', data);
},

  getAllReview: () => {
    return api.get("/review/all");
  },

  getReviewByPlaylist: (playlistId: number) => {
    return api.get(`/review/playlist/${playlistId}`);
  },

  getReviewByUser: (email: string) => {
    return api.get(`/review/user/${email}`);
  },

  updateReview: (reviewId: number , data: {
      rating: string;
      content: string;
  }) => {
      return api.put(`/review/${reviewId}`, data);
  },

  deleteReview: (reviewId: number) => {
      return api.delete(`/review/${reviewId}`);
  },
};
