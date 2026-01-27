import api from "./axios";

export const playlistApi = {
  createPlaylist: (formData: FormData) => {
    return api.post("/playlist", formData);
  },

  getAllPlaylist: () => {
    return api.get("/playlist/all");
  },

  getPlaylist: (playlistId: string | undefined) => {
    return api.get(`/playlist/me/${playlistId}`);
  },

  //   updatePlaylist: () => {
  //     return api.post("/");
  //   },

  //   deletePlaylist: () => {
  //     api.get("/").then((res) => res.data);
  //   },
};
