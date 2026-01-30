import { useState } from 'react';
import { replyApi } from '../../api/replyApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface Props {
  reply: {
    replyId: number;
    content: string;
    likeCount: number;
    likedByMe: boolean;
    createdAt: string;
    writer: string;
  };
  onRefresh: () => void;
}

const ReplyItem = ({ reply, onRefresh }: Props) => {
  const [isEdit, setIsEdit] = useState(false);
  const [content, setContent] = useState(reply.content);

  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  // 댓글 수정
  const update = async () => {
    if (!userEmail) {
    alert('로그인이 필요합니다.');
    return;
  }
    await replyApi.updateReply(reply.replyId, { content }, userEmail);
    setIsEdit(false);
    onRefresh();
  };

  // 댓글 삭제
  const remove = async () => {
    if (!userEmail) {
    alert('로그인이 필요합니다.');
    return;
  }
    if (!confirm('댓글을 삭제할까요?')) return;
    await replyApi.deleteReply(reply.replyId, userEmail);
    onRefresh();
  };

  // 좋아요 토글
  const toggleLike = async () => {
    if (!userEmail) {
      alert('로그인이 필요합니다.');
      return;
    }
   try {
      await replyApi.toggleLike(reply.replyId, userEmail);  // ✅ email 전달
      onRefresh();
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
    } // 서버 기준 상태로 다시 동기화
  };

  return (
    <li>
      {isEdit ? (
        <>
          <input value={content} onChange={(e) => setContent(e.target.value)} />
          <button onClick={update}
          className="rounded bg-neutral-600 px-2  text-white hover:bg-neutral-500"
          >저장</button>
          <button onClick={() => setIsEdit(false)}
          className="rounded bg-red-600 px-2  text-white hover:bg-red-500">
          취소</button>
        </>
      ) : (
        <>
          <span>{reply.content}</span>

          {/* 좋아요 버튼 */}
          <button onClick={toggleLike} className='px-3'>
            {reply.likedByMe ? '❤️' : '🤍'} {reply.likeCount}
          </button>

          <button onClick={() => setIsEdit(true)}
            className="rounded bg-neutral-600 px-1  text-white hover:bg-neutral-500">
            수정</button>
          <button onClick={remove}
          className="rounded bg-red-600 px-2  text-white hover:bg-red-500"
          >
          삭제</button>
          <span className='text-sm font-semibold text-neutral-500'>{reply.writer}{reply.createdAt}</span>
        </>
      )}
    </li>
  );
};

export default ReplyItem;
