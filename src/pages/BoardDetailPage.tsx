import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardApi } from '../api/boardApi';
import type { Board } from '../types/board';
import { replyApi } from '../api/replyApi';
import ReplyItem from '../component/replyItem';

const BoardDetailPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const navigate = useNavigate();
  const currentUserId = 1;

  useEffect(() => {
    if (!boardId) return;

    // 게시글 가져오기
    boardApi.getBoardDetail(Number(boardId), currentUserId).then(setBoard);
  }, [boardId]);
  // 오류 시 로딩중 이라고 보여주기
  if (!board) return <div>로딩 중...</div>;

  // 댓글 작성
  const createReply = async () => {
    if (!boardId || !replyContent.trim()) return;

    await replyApi.createReply(Number(boardId), {
      content: replyContent,
    });

    setReplyContent('');
    const updated = await boardApi.getBoardDetail(
      Number(boardId),
      currentUserId,
    );
    setBoard(updated);
  };

  // 댓글 기능 이후 자동 새로고침
  const refresh = async () => {
    if (!boardId) return;
    const updated = await boardApi.getBoardDetail(
      Number(boardId),
      currentUserId,
    );
    setBoard(updated);
  };

  return (
    <div>
      <h2>{board.title}</h2>
      <p>작성자: {board.writerNickname}</p>
      <p>{board.content}</p>

      <button
        type="button"
        onClick={() => navigate(`/boards/${board.boardId}/update`)}
      >
        수정
      </button>

      <hr />

      <h3>댓글</h3>

      {board.replies.length === 0 ? (
        <p>댓글이 없습니다.</p>
      ) : (
        <ul>
          {board.replies.map((reply) => (
            <ReplyItem key={reply.replyId} reply={reply} onRefresh={refresh} />
          ))}
        </ul>
      )}

      <textarea
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        rows={3}
      />

      <button onClick={createReply}>댓글 작성</button>
    </div>
  );
};

export default BoardDetailPage;
