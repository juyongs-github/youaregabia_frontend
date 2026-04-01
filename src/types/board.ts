export interface Reply {
  replyId: number;
  content: string;
  writer: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  deleted: boolean;
  writerEmail: string;
  children: Reply[];
}

export interface Board {
  boardId: number;
  title: string;
  content: string;
  boardType: string;
  boardGenre: string;
  writer: string;
  createdAt: string;
  replies?: PageResult<Reply>;
  viewCount: number;
  writerEmail: string;
  songs?: BoardSong[];
  likeCount: number;
  likedByMe: boolean;
}
export type TabType = "ALL" | "POPULAR";

export interface BoardSong {
  songId: number;
  trackName: string;
  artistName: string;
  imgUrl: string;
  orderIndex: number;
  previewUrl: string;
  genreName: string;
  durationMs: number;
  releaseDate: string;
}

export interface PageResult<T> {
  dtoList: T[];
  pageNumList: number[];
  prev: boolean;
  next: boolean;
  prevPage?: number;
  nextPage?: number;
  totalPage: number;
  totalCount: number;
  current: number;
}

export interface PageRequest {
  page: number;
  size: number;
  keyword?: string;
  sort?: string;
}
