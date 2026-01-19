import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardApi } from '../api/boardApi';
import type { Board } from '../types/board';

const BoardDetailPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!boardId) return;

    boardApi.getBoardDetail(Number(boardId)).then(setBoard);
  }, [boardId]);

  if (!board) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>{board.title}</h2>
      <p>작성자: {board.writerNickname}</p>
      <p>{board.content}</p>
      <form action="">
        <button
          type="button"
          onClick={() => navigate(`/boards/${board.boardId}/update`)}
        >
          수정
        </button>
      </form>
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
