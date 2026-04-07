import "../../styles/free-board-detail-kfandom.css";
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

const FreeBoardDetailPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyPage, setReplyPage] = useState(1);
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const [sortBy, setSortBy] = useState<"latest" | "likes">("latest");

  const navigate = useNavigate();
  const isFirstRender = useRef(true);
  const hasFetched = useRef(false);

  // 게시글 가져오기 (BoardDetailPage와 동일한 로직)
  const loadBoard = async (page: number = 1, sort: "latest" | "likes" = sortBy) => {
    if (!boardId) return;
    const data = await boardApi.getBoardDetail(Number(boardId), { page, size: 10, sort });
    setBoard(data);
    setReplyPage(page);
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

  const createReply = async () => {
    if (!boardId || !replyContent.trim()) return;
    await replyApi.createReply(Number(boardId), { content: replyContent });
    setReplyContent("");
    loadBoard(1);
  };

  const refresh = async () => {
    if (!boardId) return;
    const updated = await boardApi.getBoardDetail(Number(boardId), {
      page: replyPage,
      size: 10,
      sort: sortBy,
    });
    setBoard(updated);
  };

  const handleReplyPageChange = (page: number) => {
    loadBoard(page, sortBy);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!board) return <div className="kf-community-loading">로딩 중...</div>;

  const isMyBoard = !!(userEmail && board.writerEmail === userEmail);

  console.log("userEmail:", userEmail);
  console.log("writerEmail:", board?.writerEmail);
  console.log("isMyBoard:", isMyBoard);

  return (
    <div className="kf-community-page kf-board-detail">
      {" "}
      {/* 클래스명 유지하여 공통 스타일 적용 */}
      <div className="kf-community-page__shell">
        <div className="max-w-6xl mx-auto p-6">
          {/* 헤더 섹션: 날짜 형식 변경 (toLocaleDateString) */}
          <header className="mb-8 pb-6" style={{ borderBottom: "1px solid var(--kf-border)" }}>
            <h1
              className="text-4xl font-extrabold tracking-tight mb-3"
              style={{ color: "var(--kf-brand)" }}
            >
              {board.title}
            </h1>
            <div className="flex justify-between text-sm" style={{ color: "var(--kf-text-sub)" }}>
              <span>
                {board.writer} | {new Date(board.createdAt).toLocaleDateString()} |{" "}
                {board.boardGenre}
              </span>
              <span>조회 {board.viewCount}</span>
            </div>
          </header>

          <div className="space-y-8">
            {/* 본문 섹션: 기존 스타일 유지하되 레이아웃 정리 */}
            <div
              className="min-h-[300px] break-words leading-relaxed text-lg p-6 rounded-xl"
              style={{
                color: "var(--kf-text-main)",
                background: "rgba(255,255,255,0.56)",
                border: "1px solid var(--kf-border)",
              }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(board.content) }}
            />

            {/* 버튼 섹션 */}
            <div
              className="flex items-center justify-between pt-6"
              style={{ borderTop: "1px solid var(--kf-border)" }}
            >
              <button
                onClick={() => navigate("/community/free")}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: "rgba(109,94,252,0.08)",
                  color: "var(--kf-brand)",
                  border: "1px solid rgba(109,94,252,0.18)",
                }}
              >
                목록
              </button>
              {isMyBoard && (
                <button
                  onClick={() => navigate(`/community/free/${board.boardId}/update`)}
                  className="text-sm font-medium transition-colors"
                  style={{ color: "var(--kf-text-sub)" }}
                >
                  수정하기
                </button>
              )}
            </div>

            {/* 댓글 섹션: BoardDetailPage와 100% 동일한 구조 */}
            <section className="mt-12">
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
                    추가순
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
                        onRefresh={refresh}
                        boardId={Number(boardId)}
                        isAnonymous={true} // 자유게시판 특성 유지
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

              {/* 댓글 입력창 */}
              <div
                className="p-4 rounded-xl mt-6"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid var(--kf-border)",
                }}
              >
                <textarea
                  className="w-full bg-transparent border-none outline-none resize-none"
                  placeholder="댓글을 입력하세요..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={createReply}
                    className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all"
                    style={{
                      background: "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
                      boxShadow: "0 8px 20px rgba(109,94,252,0.24)",
                    }}
                  >
                    작성
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeBoardDetailPage;
