import api from "./axios";
import type { Song } from "../components/ui/SongListItem";

export interface SongSuggestion {
  id: number;
  songId: number;
  trackName: string;
  artistName: string;
  imgUrl?: string;
  suggestedByEmail: string;
  createdAt?: string;
}

export const playlistSongApi = {

  // 수록곡 목록 조회
  getSongsByPlaylist: (playlistId: number) =>
    api.get<Song[]>(`/playlist/${playlistId}/songs`),

  // 작성자 직접 곡 추가 (즉시 수록)
  addSongDirectly: (playlistId: number, songId: number, email: string) =>
    api.post(`/playlist/${playlistId}/songs/${songId}`, null, { params: { email } }),

  // 수록곡 삭제
  removeSongFromPlaylist: (playlistSongId: number) =>
    api.delete(`/playlist/songs/${playlistSongId}`),

  // 곡 제안 (ACCEPTED 참여자)
  suggestSong: (playlistId: number, songId: number, email: string) =>
    api.post(`/playlist/${playlistId}/songs/suggest`, null, { params: { songId, email } }),

  // 대기 중인 곡 제안 목록 (작성자만)
  getPendingSuggestions: (playlistId: number, email: string) =>
    api.get<SongSuggestion[]>(`/playlist/${playlistId}/songs/pending`, { params: { email } }),

  // 곡 제안 수락 (작성자만)
  acceptSuggestion: (playlistId: number, suggestionId: number, email: string) =>
    api.put(`/playlist/${playlistId}/songs/pending/${suggestionId}/accept`, null, { params: { email } }),

  // 곡 제안 거절 (작성자만)
  rejectSuggestion: (playlistId: number, suggestionId: number, email: string) =>
    api.delete(`/playlist/${playlistId}/songs/pending/${suggestionId}`, { params: { email } }),

};
