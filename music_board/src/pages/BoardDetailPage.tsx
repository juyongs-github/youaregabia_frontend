import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { boardApi } from '../api/boardApi';
import type { Board } from '../types/board';

const BoardDetailPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    if (!boardId) return;

    boardApi.getBoardDetail(Number(boardId)).then(setBoard);
  }, [boardId]);

  if (!board) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>{board.title}</h2>
      <p>{board.content}</p>
      <p>작성자: {board.writerNickname}</p>

      <hr />

      <h3>댓글</h3>
      {board.replies.length === 0 ? (
        <p>댓글이 없습니다.</p>
      ) : (
        <ul>
          {board.replies.map((reply) => (
            <li key={reply.replyId}>
              {reply.content} ❤️ {reply.likeCount}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BoardDetailPage;
