import axios from "./axios"; // 기존 axios 인스턴스 경로에 맞게 수정

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
}

export interface ArtistRankingDto {
  artistName: string;
  shareCount: number;
}

export const rankingApi = {
  getLikeUsers: () => axios.get<UserRankingDto[]>("/api/ranking/like-users").then((r) => r.data),

  getPointUsers: () => axios.get<UserRankingDto[]>("/api/ranking/point-users").then((r) => r.data),
  getTopSharedSongs: () => axios.get<SongRankingDto[]>("/api/ranking/songs").then((r) => r.data),
  getTopArtists: () => axios.get<ArtistRankingDto[]>("/api/ranking/artists").then((r) => r.data),
};
