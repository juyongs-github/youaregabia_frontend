import api from "./axios";
import type { CollaboPlaylist } from "../types/playlist";

export const playlistApi = {
  createPlaylist: (formData: FormData) => {
    return api.post("/api/playlist", formData);
  },

  getAllPlaylist: () => {
    return api.get("/api/playlist/all");
  },

  getPlaylist: (playlistId: string) => {
    return api.get(`/api/playlist/${playlistId}`);
  },

  updatePlaylist: (playlistId: number, data: FormData) => {
    return api.put(`/api/playlist/${playlistId}`, data);
  },

  deletePlaylist: (playlistId: number) => {
    return api.delete(`/api/playlist/${playlistId}`);
  },

  getAllCollaborativePlaylist: () => {
    return api.get<CollaboPlaylist[]>("/api/playlist/collabo/all");
  },

  getCollaborativePlaylist: (playlistId: number) => {
    return api.get<CollaboPlaylist>(`/api/playlist/collabo/${playlistId}`);
  },

  likeCollabo: (playlistId: number) => {
    return api.post(`/api/playlist/collabo/${playlistId}/like`);
  },

  unlikeCollabo: (playlistId: number) => {
    return api.delete(`/api/playlist/collabo/${playlistId}/like`);
  },

  reopenCollabo: (playlistId: number, newDeadline: string) => {
    return api.put(`/api/playlist/collabo/${playlistId}/reopen`, null, { params: { newDeadline } });
  },

  importCollabo: (playlistId: number) => {
    return api.post(`/api/playlist/collabo/${playlistId}/import`);
  },

  getPlaylistSongs: (playlistId: number) => {
    return api.get(`/api/playlist/${playlistId}/songs`);
  },

  addSongToPlaylist: (playlistId: number, songId: number) => {
    return api.post(`/api/playlist/${playlistId}/songs/${songId}`);
  },

  removeSongFromPlaylist: (playlistSongId: number) => {
    return api.delete(`/api/playlist/songs/${playlistSongId}`);
  },
};
