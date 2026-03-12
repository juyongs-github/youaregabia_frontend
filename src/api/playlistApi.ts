import api from "./axios";
import type { CollaboPlaylist } from "../types/playlist";

export const playlistApi = {
  createPlaylist: (formData: FormData) => {
    return api.post("/playlist", formData);
  },

  getAllPlaylist: () => {
    return api.get("/playlist/all");
  },

  getPlaylist: (playlistId: string) => {
    return api.get(`/playlist/${playlistId}`);
  },

  updatePlaylist: (playlistId: number, data: FormData) => {
    return api.put(`/playlist/${playlistId}`, data);
  },

  deletePlaylist: (playlistId: number) => {
    return api.delete(`/playlist/${playlistId}`);
  },

  getAllCollaborativePlaylist: () => {
    return api.get<CollaboPlaylist[]>("/playlist/collabo/all");
  },

  getPlaylistSongs: (playlistId: number) => {
    return api.get(`/playlist/${playlistId}/songs`);
  },

  addSongToPlaylist: (playlistId: number, songId: number) => {
    return api.post(`/playlist/${playlistId}/songs/${songId}`);
  },

  removeSongFromPlaylist: (playlistSongId: number) => {
    return api.delete(`/playlist/songs/${playlistSongId}`);
  },
};
