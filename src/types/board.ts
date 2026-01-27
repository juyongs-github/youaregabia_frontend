export interface Reply {
  replyId: number;
  content: string;
  writer: string;
  likeCount: number;
  likedByMe: boolean; 
  createdAt: string;
}

export interface Board {
  boardId: number;
  title: string;
  content: string;
  writer: string;
  createdAt: string;
  replies?: PageResult<Reply>;
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
}
