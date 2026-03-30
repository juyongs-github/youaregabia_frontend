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
    writerEmail: string;
    children: Reply[];
  };
  boardId: number;
  onRefresh: () => void;
  isChild?: boolean;
  isAnonymous?: boolean;
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6d5efc, #ff5ca8)",
  "linear-gradient(135deg, #38c7aa, #6d5efc)",
  "linear-gradient(135deg, #ff5ca8, #ffb648)",
  "linear-gradient(135deg, #4facfe, #6d5efc)",
];

function avatarGradient(name: string) {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return diff + "초 전";
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 2592000) return Math.floor(diff / 86400) + "일 전";
  return Math.floor(diff / 2592000) + "달 전";
}

const ReplyItem = ({ reply, boardId, onRefresh, isChild = false, isAnonymous = false }: Props) => {
  const [isEdit, setIsEdit] = useState(false);
  const [content, setContent] = useState(reply.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [childContent, setChildContent] = useState("");
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  const update = async () => {
    if (!userEmail) { alert("로그인이 필요합니다."); return; }
    await replyApi.updateReply(reply.replyId, { content });
    setIsEdit(false);
    onRefresh();
  };

  const remove = async () => {
    if (!userEmail) { alert("로그인이 필요합니다."); return; }
    if (!confirm("댓글을 삭제할까요?")) return;
    await replyApi.deleteReply(reply.replyId);
    onRefresh();
  };

  const toggleLike = async () => {
    if (!userEmail) { alert("로그인이 필요합니다."); return; }
    try {
      await replyApi.toggleLike(reply.replyId);
      onRefresh();
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  const createChild = async () => {
    if (!userEmail) { alert("로그인이 필요합니다."); return; }
    if (!childContent.trim()) return;
    await replyApi.createReply(boardId, { content: childContent, parentReplyId: reply.replyId });
    setChildContent("");
    setShowReplyForm(false);
    onRefresh();
  };

  const displayName = isAnonymous ? "익명" : reply.writer;
  const initial = displayName.trim().slice(0, 1).toUpperCase();

  if (reply.deleted) {
    return (
      <li className={`kf-reply-deleted ${isChild ? "kf-reply-child" : ""}`}>
        삭제된 댓글입니다.
        {!isChild && reply.children?.map((child) => (
          <ReplyItem key={child.replyId} reply={child} boardId={boardId} onRefresh={onRefresh} isChild={true} isAnonymous={isAnonymous} />
        ))}
      </li>
    );
  }

  return (
    <ul className="kf-reply-list">
      <li className={`kf-reply-card ${isChild ? "kf-reply-child" : ""}`}>
        {isEdit ? (
          <div className="kf-reply-edit">
            <input
              className="kf-reply-edit__input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="kf-reply-edit__actions">
              <button onClick={update} className="kf-reply-edit__save">저장</button>
              <button onClick={() => setIsEdit(false)} className="kf-reply-edit__cancel">취소</button>
            </div>
          </div>
        ) : (
          <div className="kf-reply-card__inner">
            {/* 아바타 */}
            <div
              className="kf-reply-avatar"
              style={{ background: avatarGradient(displayName) }}
            >
              {initial}
            </div>

            {/* 본문 */}
            <div className="kf-reply-card__body">
              <div className="kf-reply-card__header">
                <div className="kf-reply-card__meta">
                  <span className="kf-reply-card__name">{displayName}</span>
                  <span className="kf-reply-card__time">{timeAgo(reply.createdAt)}</span>
                </div>
                {/* 좋아요 배지 */}
                <button
                  onClick={toggleLike}
                  className={`kf-reply-like ${reply.likedByMe ? "kf-reply-like--active" : ""}`}
                >
                  좋아요 {reply.likeCount}
                </button>
              </div>

              <p className="kf-reply-card__content">{reply.content}</p>

              <div className="kf-reply-card__actions">
                {!isChild && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="kf-reply-action-btn"
                  >
                    답글
                  </button>
                )}
                {userEmail && reply.writerEmail === userEmail && (
                  <>
                    <button onClick={() => setIsEdit(true)} className="kf-reply-action-btn">수정</button>
                    <button onClick={remove} className="kf-reply-action-btn kf-reply-action-btn--danger">삭제</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 답글 작성 폼 */}
        {showReplyForm && (
          <div className="kf-reply-child-form">
            <textarea
              value={childContent}
              onChange={(e) => setChildContent(e.target.value)}
              rows={2}
              placeholder="답글을 입력하세요..."
              className="kf-reply-child-form__textarea"
            />
            <div className="kf-reply-child-form__btns">
              <button onClick={createChild} className="kf-reply-child-form__submit">등록</button>
              <button onClick={() => setShowReplyForm(false)} className="kf-reply-child-form__cancel">취소</button>
            </div>
          </div>
        )}

        {/* 대댓글 목록 */}
        {!isChild && reply.children?.map((child) => (
          <ReplyItem key={child.replyId} reply={child} boardId={boardId} onRefresh={onRefresh} isChild={true} isAnonymous={isAnonymous} />
        ))}
      </li>
    </ul>
  );
};

export default ReplyItem;
