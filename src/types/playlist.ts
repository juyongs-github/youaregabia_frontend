export interface Playlist {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  songCount: number;
  userName: string;
}

export interface CollaboPlaylist extends Playlist {
    creatorEmail?: string;
    participantCount?: number;
    createdAt?: string; // ISO 8601 형식 (e.g. "2025-03-10T12:34:56")
    deadline?: string;  // ISO 8601 형식 (e.g. "2025-04-01T23:59:59")
    likeCount?: number;
    hasLiked?: boolean;
}

// 생성
export interface PlaylistCreate {
  title: string;
  description?: string;
  imageUrl?: string;
}

// 수정
export interface PlaylistUpdate {}
