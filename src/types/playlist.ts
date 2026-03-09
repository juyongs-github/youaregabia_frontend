export interface Playlist {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  songCount: number;
  userName: string;
}

// 생성
export interface PlaylistCreate {
  title: string;
  description?: string;
  imageUrl?: string;
}

// 수정
export interface PlaylistUpdate {}
