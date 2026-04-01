import api from "./axios";

export interface UserRankingDto {
  userId: number;
  name: string;
  grade: string;
  score: number;
}

export interface SongRankingDto {
  songId: number;
  trackName: string;
  artistName: string;
  imgUrl: string;
  shareCount: number;
  previewUrl: string;
}

export interface ArtistRankingDto {
  artistName: string;
  shareCount: number;
}

export const rankingApi = {
  getLikeUsers: () => api.get<UserRankingDto[]>("/api/ranking/like-users").then((r) => r.data),

  getPointUsers: () => api.get<UserRankingDto[]>("/api/ranking/point-users").then((r) => r.data),
  getTopSharedSongs: () => api.get<SongRankingDto[]>("/api/ranking/songs").then((r) => r.data),
  getTopArtists: () => api.get<ArtistRankingDto[]>("/api/ranking/artists").then((r) => r.data),
};
