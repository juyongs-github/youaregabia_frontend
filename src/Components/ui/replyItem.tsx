import { useState } from "react";
import { replyApi } from "../../api/replyApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import type { Reply } from "../../types/board";

interface Props {
  reply: {
    replyId: number;
    content: string;
    likeCount: number;
    likedByMe: boolean;
    createdAt: string;
    writer: string;
    deleted: boolean;
    children: Reply[];
  };
  boardId: number;
  onRefresh: () => void;
  isChild?: boolean; // 대댓글 여부 (대댓글엔 답글 버튼 숨기기용)
}

const ReplyItem = ({ reply, boardId, onRefresh, isChild = false }: Props) => {
  const [isEdit, setIsEdit] = useState(false);
  const [content, setContent] = useState(reply.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [childContent, setChildContent] = useState("");

  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  // 댓글 수정
  const update = async () => {
    if (!userEmail) {
      alert("로그인이 필요합니다.");
      return;
    }
    await replyApi.updateReply(reply.replyId, { content });
    setIsEdit(false);
    onRefresh();
  };

  // 댓글 삭제
  const remove = async () => {
    if (!userEmail) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!confirm("댓글을 삭제할까요?")) return;
    await replyApi.deleteReply(reply.replyId);
    onRefresh();
  };

  // 좋아요 토글
  const toggleLike = async () => {
    if (!userEmail) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      await replyApi.toggleLike(reply.replyId);
      onRefresh();
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    } // 서버 기준 상태로 다시 동기화
  };

  // 대댓글
  const createChild = async () => {
    if (!userEmail) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!childContent.trim()) return;
    await replyApi.createReply(boardId, {
      content: childContent,
      parentReplyId: reply.replyId,
    });
    setChildContent("");
    setShowReplyForm(false);
    onRefresh();
  };

  // 댓글 삭제
  if (reply.deleted) {
    return (
      <li className={`py-2 text-gray-500 italic ${isChild ? "ml-8" : ""}`}>
        삭제된 댓글입니다.
        {/* 대댓글도 보여줘야 하는 경우 */}
        {!isChild &&
          reply.children?.map((child) => (
            <ReplyItem
              key={child.replyId}
              reply={child}
              boardId={boardId}
              onRefresh={onRefresh}
              isChild={true}
            />
          ))}
      </li>
    );
  }

  return (
    <li className={isChild ? "ml-8 border-l-2 border-neutral-700 pl-4" : ""}>
      {isEdit ? (
        <>
          <input value={content} onChange={(e) => setContent(e.target.value)} />
          <button
            onClick={update}
            className="rounded bg-neutral-600 px-2 text-white hover:bg-neutral-500"
          >
            저장
          </button>
          <button
            onClick={() => setIsEdit(false)}
            className="rounded bg-red-600 px-2 text-white hover:bg-red-500"
          >
            취소
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-400">{reply.writer}</span>
            <span className="text-xs text-gray-500">{reply.createdAt}</span>
          </div>
          <span>{reply.content}</span>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={toggleLike} className="px-2 text-sm">
              {reply.likedByMe ? "❤️" : "🤍"} {reply.likeCount}
            </button>
            {/* 대댓글엔 답글 버튼 숨김 */}
            {!isChild && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-sm text-gray-400 hover:text-white"
              >
                답글
              </button>
            )}
            <button
              onClick={() => setIsEdit(true)}
              className="rounded bg-neutral-600 px-2 text-sm text-white hover:bg-neutral-500"
            >
              수정
            </button>
            <button
              onClick={remove}
              className="rounded bg-red-600 px-2 text-sm text-white hover:bg-red-500"
            >
              삭제
            </button>
          </div>
        </>
      )}

      {/* 답글 작성 폼 */}
      {showReplyForm && (
        <div className="ml-8 mt-2 flex gap-2">
          <textarea
            value={childContent}
            onChange={(e) => setChildContent(e.target.value)}
            rows={2}
            className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={createChild}
              className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500"
            >
              등록
            </button>
            <button
              onClick={() => setShowReplyForm(false)}
              className="rounded border border-neutral-700 px-3 py-1 text-sm text-gray-400 hover:bg-neutral-800"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 대댓글 목록 */}
      {!isChild &&
        reply.children?.map((child) => (
          <ReplyItem
            key={child.replyId}
            reply={child}
            boardId={boardId}
            onRefresh={onRefresh}
            isChild={true}
          />
        ))}
    </li>
  );
};

export default ReplyItem;
