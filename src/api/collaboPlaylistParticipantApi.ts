import api from "./axios";

export type ParticipantStatus = "NONE" | "PENDING" | "ACCEPTED";

export interface Participant {
  id: number;
  userEmail: string;
  status: "PENDING" | "ACCEPTED";
  createdAt?: string;
}

export const collaboPlaylistParticipantApi = {
  // 내 참여 상태 조회
  getMyStatus: (playlistId: number, email: string) =>
    api.get<{ status: ParticipantStatus }>(`/playlist/${playlistId}/participants/status`, {
      params: { email },
    }),

  // 참여 신청
  apply: (playlistId: number, email: string) =>
    api.post(`/playlist/${playlistId}/participants`, { email }),

  // 대기 중인 참가자 목록 (creator only)
  getPendingList: (playlistId: number) =>
    api.get<Participant[]>(`/playlist/${playlistId}/participants/pending`),

  // 참가자 수락 (creator only)
  accept: (playlistId: number, participantId: number) =>
    api.put(`/playlist/${playlistId}/participants/${participantId}/accept`),
};
