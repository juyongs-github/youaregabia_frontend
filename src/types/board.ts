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
  writerNickname: string;
  createdAt: string;
  replies: Reply[];
}
