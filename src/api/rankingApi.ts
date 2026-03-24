import axios from "./axios"; // 기존 axios 인스턴스 경로에 맞게 수정

export interface UserRankingDto {
  userId: number;
  name: string;
  grade: string;
  score: number;
}

export const rankingApi = {
  getLikeUsers: () => axios.get<UserRankingDto[]>("/api/ranking/like-users").then((r) => r.data),

  getPointUsers: () => axios.get<UserRankingDto[]>("/api/ranking/point-users").then((r) => r.data),
};
