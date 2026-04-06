import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import type { Board } from "../../types/board";
import { replyApi } from "../../api/replyApi";
import ReplyItem from "../../components/ui/replyItem";
import Pagination from "../../components/ui/Pagination";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import DOMPurify from "dompurify";
import { refreshPoint } from "../../components/ui/refreshPoint";
import "../../styles/board-detail-kfandom.css";
import BoardSidePanel from "../../components/ui/BoardSidePanel";
import ReplyForm from "../../components/ui/ReplyForm";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

const BoardDetailPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [replyPage, setReplyPage] = useState(1);
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "likes">("latest");
  const isFirstRender = useRef(true);
  const hasFetched = useRef(false);
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();

  const loadBoard = async (page: number = 1, sort: "latest" | "likes" = sortBy) => {
    if (!boardId) return;
    const data = await boardApi.getBoardDetail(Number(boardId), { page, size: 10, sort });
    setBoard(data);
    setReplyPage(page);
  };

  const refreshReplies = async (page: number = replyPage) => {
    if (!boardId) return;
    const updated = await boardApi.getBoardDetail(Number(boardId), { page, size: 10, sort: sortBy });
    setBoard((prev) => (prev ? { ...prev, replies: updated.replies } : prev));
  };

  useEffect(() => {
    if (boardId && !hasFetched.current) {
      hasFetched.current = true;
      loadBoard(1);
    }
  }, [boardId]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (boardId) loadBoard(1, sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (board) {
      setLikeCount(board.likeCount);
      setLikedByMe(board.likedByMe);
    }
  }, [board]);

  const createReply = async (content: string) => {
    if (!boardId || !content.trim()) return;
    await replyApi.createReply(Number(boardId), { content });
    refreshReplies(1);
    refreshPoint();
  };

  const handleReplyPageChange = (page: number) => {
    loadBoard(page, sortBy);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLike = async () => {
    if (!userEmail) { showToast("로그인이 필요합니다.", "info"); return; }
    const res = await boardApi.toggleBoardLike(Number(boardId));
    setLikeCount(res.likeCount);
    setLikedByMe(res.likedByMe);
    refreshPoint();
  };

  if (!board) return <div className="kf-community-loading">로딩 중...</div>;

  const isMyBoard = !!(userEmail && board.writerEmail === userEmail);
  const isCritic = board.boardType === "CRITIC";
  const hasSidePanel =
    board.boardType === "FREE" ||
    (board.boardType === "PLAYLIST_SHARE" && board.songs && board.songs.length > 0) ||
    board.boardType === "CRITIC";

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <div className="kf-community-page kf-board-detail">
      <div className="kf-community-page__shell">
        <div className="max-w-6xl mx-auto p-6">
          <header className="mb-8 pb-6" style={{ borderBottom: "1px solid var(--kf-border)" }}>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--kf-brand)" }}>
              {board.title}
            </h1>
            <div className="flex justify-between text-sm" style={{ color: "var(--kf-text-sub)" }}>
              <span>
                {board.writer} | {new Date(board.createdAt).toLocaleDateString()}
                {board.boardGenre !== "FREE" && ` | ${board.boardGenre}`}
              </span>
              <span>조회 {board.viewCount}</span>
            </div>
          </header>

          <div className={`grid grid-cols-1 gap-8 ${isCritic ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
            {/* 본문 영역 */}
            <div className={`${isCritic ? "lg:col-span-3" : "lg:col-span-2"} space-y-8`}>
              <div
                className="min-h-[300px] break-words leading-relaxed text-lg p-6 rounded-xl"
                style={{
                  color: "var(--kf-text-main)",
                  background: "rgba(255,255,255,0.56)",
                  border: "1px solid var(--kf-border)",
                }}
                dangerouslySetInnerHTML={{
                  __html: isCritic
                    ? DOMPurify.sanitize(board.content, { FORBID_TAGS: ["img"] })
                    : DOMPurify.sanitize(board.content),
                }}
              />
              <div
                className="flex items-center justify-between pt-6"
                style={{ borderTop: "1px solid var(--kf-border)" }}
              >
                <button
                  onClick={() =>
                    board.boardGenre === "FREE"
                      ? navigate("/recommend/critic")
                      : navigate("/community/share")
                  }
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: "rgba(109,94,252,0.08)",
                    color: "var(--kf-brand)",
                    border: "1px solid rgba(109,94,252,0.18)",
                  }}
                >
                  목록
                </button>
                <div className="flex items-center gap-4">
                  {isMyBoard && (
                    <button
                      onClick={() =>
                        isCritic
                          ? navigate(`/recommend/critic/${board.boardId}/update`)
                          : navigate(`/community/share/${board.boardId}/update`)
                      }
                      className="text-sm font-medium transition-colors"
                      style={{ color: "var(--kf-text-sub)" }}
                    >
                      수정하기
                    </button>
                  )}
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-3 rounded-full px-6 py-2 text-base font-bold transition-all active:scale-95"
                    style={
                      likedByMe
                        ? {
                            background: "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
                            color: "#fff",
                            border: "none",
                            boxShadow: "0 8px 20px rgba(109,94,252,0.28)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--kf-text-sub)",
                            border: "2px solid var(--kf-border-strong)",
                          }
                    }
                  >
                    <span>❤️</span>
                    <span>{likeCount}</span>
                  </button>
                </div>
              </div>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold" style={{ color: "var(--kf-text-main)" }}>
                    댓글 {board.replies?.dtoList.length || 0}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy("latest")}
                      className={`kf-sort-btn ${sortBy === "latest" ? "kf-sort-btn--active" : ""}`}
                    >
                      최신순
                    </button>
                    <button
                      onClick={() => setSortBy("likes")}
                      className={`kf-sort-btn ${sortBy === "likes" ? "kf-sort-btn--active" : ""}`}
                    >
                      추천순
                    </button>
                  </div>
                </div>
                {!board.replies || board.replies.dtoList.length === 0 ? (
                  <p style={{ color: "var(--kf-text-muted)" }}>댓글이 없습니다.</p>
                ) : (
                  <>
                    <ul className="kf-reply-list mb-6">
                      {board.replies.dtoList.map((reply) => (
                        <ReplyItem
                          key={reply.replyId}
                          reply={reply}
                          onRefresh={refreshReplies}
                          boardId={Number(boardId)}
                          isAnonymous={false}
                        />
                      ))}
                    </ul>
                    {board.replies.pageNumList.length > 0 && (
                      <Pagination
                        pageNumList={board.replies.pageNumList}
                        current={board.replies.current}
                        prev={board.replies.prev}
                        next={board.replies.next}
                        prevPage={board.replies.prevPage}
                        nextPage={board.replies.nextPage}
                        onPageChange={handleReplyPageChange}
                      />
                    )}
                  </>
                )}
                <ReplyForm onSubmit={createReply} />
              </section>
            </div>

            {/* 사이드바 */}
            {hasSidePanel && (
              <aside className={isCritic ? "lg:col-span-2" : "lg:col-span-1"}>
                <div className="sticky top-6">
                  <BoardSidePanel board={board} isMyBoard={isMyBoard} />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default BoardDetailPage;
