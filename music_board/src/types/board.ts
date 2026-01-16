export interface Reply {
  replyId: number;
  content: string;
  likeCount: number;
  userNickname: string;
}

export interface Board {
  boardId: number;
  title: string;
  content: string;
  writerNickname: string;
  createdAt: string;
  replies: Reply[];
}
