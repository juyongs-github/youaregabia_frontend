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

    updatePlaylist: (playlistId:number , data: {
      title:string;
      description:string;
    }) => {
      return api.put(`/playlist/${playlistId}`,data);
    },

    deletePlaylist: (playlistId:number) => {
      return api.delete(`/playlist/${playlistId}`)
    },
};
