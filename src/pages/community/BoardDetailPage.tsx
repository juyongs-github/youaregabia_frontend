import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardApi } from '../../api/boardApi';
import type { Board } from '../../types/board';
import { replyApi } from '../../api/replyApi';
import ReplyItem from '../../components/ui/replyItem';

const BoardDetailPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [replyContent, setReplyContent] = useState('');
  // 정렬 
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');

  const navigate = useNavigate();
  //임시 아이디
  const currentUserId = 1;

  useEffect(() => {
    if (!boardId) return;
    
    // 게시글 가져오기
    boardApi.getBoardDetail(Number(boardId), currentUserId).then(setBoard);
  }, [boardId]);
  
  //  댓글 정렬
  // Memo -> board.replies가 바뀌거나 sortBy가 바뀔 때만 실행
  const sortedReplies = useMemo(() => {
    if (!board?.replies) return [];
    
    // 원본 배열을 복사해서 정렬 (sort는 원본을 변경하기 때문)
    return [...board.replies].sort((a, b) => {
      if (sortBy === 'likes') {
        // 좋아요순: 좋아요 수 내림차순 -> 같으면 최신순
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      }
      // 최신순: 생성일 내림차순
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [board?.replies, sortBy]);
  
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
  
  // 오류 시 로딩중 이라고 보여주기
  if (!board) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>{board.title}</h2>
      <p>작성자: {board.writerNickname}</p>
      <p>{board.content}</p>

      <button
        type="button"
        onClick={() => navigate(`/community/share/${board.boardId}/update`)}
      >
        수정
      </button>

      <hr />

      <h3>댓글</h3>
        <div>
          <button 
            onClick={() => setSortBy('latest')} 
            style={{ fontWeight: sortBy === 'latest' ? 'bold' : 'normal' }}
          >최신순</button>
          <button 
            onClick={() => setSortBy('likes')} 
            style={{ fontWeight: sortBy === 'likes' ? 'bold' : 'normal', marginLeft: '10px' }}
          >추천순</button>
        </div>

      {board.replies.length === 0 ? (
        <p>댓글이 없습니다.</p>
      ) : (
        <ul>
          {sortedReplies.map((reply) => (
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
