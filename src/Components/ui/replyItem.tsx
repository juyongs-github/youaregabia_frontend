import { useState } from 'react';
import { replyApi } from '../../api/replyApi';

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

  const currentUserId = 1; // 지금은 임시

  // 댓글 수정
  const update = async () => {
    await replyApi.updateReply(reply.replyId, { content });
    setIsEdit(false);
    onRefresh();
  };

  // 댓글 삭제
  const remove = async () => {
    if (!confirm('댓글을 삭제할까요?')) return;
    await replyApi.deleteReply(reply.replyId);
    onRefresh();
  };

  // 좋아요 토글
  const toggleLike = async () => {
    await replyApi.toggleLike(reply.replyId, currentUserId);
    onRefresh(); // 서버 기준 상태로 다시 동기화
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
