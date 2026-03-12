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

  getAllCollaborativePlaylist: () => {
    return api.get<CollaboPlaylist[]>("/playlist/collabo/all");
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
