import api from "./axios";
import type { Song } from "../components/ui/SongListItem";

export const playlistSongApi = {

  // 플레이리스트에 곡 추가
  addSongToPlaylist: (playlistId: number, songId: number) => {
    return api.post(`/api/playlists/${playlistId}/songs/${songId}`);
  },

  // 플레이리스트에서 곡 삭제
  removeSongFromPlaylist: (playlistSongId: number) => {
    return api.delete(`/api/playlists/songs/${playlistSongId}`);
  },

  // 플레이리스트 곡 목록 조회
  getSongsByPlaylist: (playlistId: number) => {
    return api.get<Song[]>(`/api/playlists/${playlistId}/songs`);
  },

};