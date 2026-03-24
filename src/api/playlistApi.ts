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

  getCollaborativePlaylist: (playlistId: number) => {
    return api.get<CollaboPlaylist>(`/playlist/collabo/${playlistId}`);
  },

  likeCollabo: (playlistId: number) => {
    return api.post(`/playlist/collabo/${playlistId}/like`);
  },

  unlikeCollabo: (playlistId: number) => {
    return api.delete(`/playlist/collabo/${playlistId}/like`);
  },

  reopenCollabo: (playlistId: number, newDeadline: string) => {
    return api.put(`/playlist/collabo/${playlistId}/reopen`, null, { params: { newDeadline } });
  },

  importCollabo: (playlistId: number) => {
    return api.post(`/playlist/collabo/${playlistId}/import`);
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
