import api from "./axios";
import type { CollaboPlaylist } from "../types/playlist";

// 플레이리스트
export const playlistApi = {
  createPlaylist: (formData: FormData) => {
    return api.post("/playlist", formData);
  },

  getAllPlaylist: (email?: string) => {
    return api.get("/playlist/all", {
      params: { email },
    });
  },

  getPlaylist: (playlistId: string, email: string) => {
    return api.get(`/playlist/${playlistId}`, { params: { email } });
  },

  updatePlaylist: (playlistId: number, data: FormData) => {
    return api.put(`/playlist/${playlistId}`, data);
  },

  deletePlaylist: (playlistId: number) => {
    return api.delete(`/playlist/${playlistId}`);
  },

  getAllCollaborativePlaylist: (email?: string) => {
    return api.get<CollaboPlaylist[]>("/playlist/collabo/all", { params: { email } });
  },

  getCollaborativePlaylist: (playlistId: number, email?: string) => {
    return api.get<CollaboPlaylist>(`/playlist/collabo/${playlistId}`, { params: { email } });
  },

  likeCollabo: (playlistId: number, email: string) => {
    return api.post(`/playlist/collabo/${playlistId}/like`, null, { params: { email } });
  },

  unlikeCollabo: (playlistId: number, email: string) => {
    return api.delete(`/playlist/collabo/${playlistId}/like`, { params: { email } });
  },

  reopenCollabo: (playlistId: number, email: string, newDeadline: string) => {
    return api.put(`/playlist/collabo/${playlistId}/reopen`, null, { params: { email, newDeadline } });
  },

  // 곡
  getPlaylistSongs: (playlistId: number) => {
    return api.get(`/playlist/${playlistId}/songs`);
  },

  addSongToPlaylist: (playlistId: number, songId: number, email: string) => {
    return api.post(`/playlist/${playlistId}/songs/${songId}`, null, { params: { email } });
  },

  removeSongFromPlaylist: (playlistSongId: number) => {
    return api.delete(`/playlist/songs/${playlistSongId}`);
  },
};
