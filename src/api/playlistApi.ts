import api from "./axios";

export const playlistApi = {
  createPlaylist: (formData: FormData) => {
    return api.post("/playlist", formData);
  },

  getAllPlaylist: () => {
    return api.get("/playlist/all");
  },

  getPlaylist: (playlistId: string | undefined) => {
    return api.get(`/playlist/${playlistId}`);
  },

    updatePlaylist: (playlistId:number , formData:FormData) => {
      return api.put(`/playlist/${playlistId}`);
    },

    deletePlaylist: (playlistId:number) => {
      return api.delete(`/playlist/${playlistId}`)
    },
};
