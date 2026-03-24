import api from "./axios";
import type { Song } from "../components/ui/SongListItem";

// 공동 플레이리스트 곡 (투표 정보 포함)
export interface CollaboSong extends Song {
  playlistSongId: number;
  suggestedByEmail?: string;
  suggestedByName?: string;
  voteCount?: number;
  hasVoted?: boolean;
  reason?: string;
}

export const playlistSongApi = {

  // 일반 수록곡 목록 조회 (내 플레이리스트, 리뷰 페이지 등)
  getSongsByPlaylist: (playlistId: number) =>
    api.get<Song[]>(`/playlist/${playlistId}/songs`),

  // 공동 플레이리스트 곡 목록 (투표수 + 내 투표 여부 포함)
  getCollaborativeSongs: (playlistId: number) =>
    api.get<CollaboSong[]>(`/playlist/${playlistId}/collabo/songs`),

  // 곡 제안 (유저당 최대 5곡)
  suggestSong: (playlistId: number, songId: number, reason?: string) =>
    api.post(`/playlist/${playlistId}/songs/suggest`, null, { params: { songId, ...(reason ? { reason } : {}) } }),

  // 곡 삭제 (작성자 or 등록자)
  removeSongFromPlaylist: (playlistSongId: number) =>
    api.delete(`/playlist/songs/${playlistSongId}`),

  // 투표
  vote: (playlistId: number, playlistSongId: number) =>
    api.post(`/playlist/${playlistId}/songs/${playlistSongId}/vote`),

  // 투표 취소
  cancelVote: (playlistId: number, playlistSongId: number) =>
    api.delete(`/playlist/${playlistId}/songs/${playlistSongId}/vote`),

  // 추가 이유 수정
  updateReason: (playlistSongId: number, reason: string) =>
    api.patch(`/playlist/songs/${playlistSongId}/reason`, null, { params: { reason } }),

};
