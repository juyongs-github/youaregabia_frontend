import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import type { Board } from "../../types/board";
import { replyApi } from "../../api/replyApi";
import ReplyItem from "../../components/ui/replyItem";
import Pagination from "../../components/ui/Pagination";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

const FreeBoardDetailPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyPage, setReplyPage] = useState(1); // 댓글 페이지
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  // 정렬
  const [sortBy, setSortBy] = useState<"latest" | "likes">("latest");

  const navigate = useNavigate();

  // 게시글 가져오기
  const loadBoard = async (page: number = 1, sort: "latest" | "likes" = sortBy) => {
    if (!boardId) return;
    console.log("loadBoard 호출:", { boardId, page, sort });

    const data = await boardApi.getBoardDetail(
      Number(boardId),
      { page, size: 10, sort: sort } // 댓글 페이징
    );
    setBoard(data);
    setReplyPage(page);
    console.log("board 응답 전체:", data);
    console.log("replies:", data.replies);
  };
  const isFirstRender = useRef(true);

  useEffect(() => {
    console.log("boardId:", boardId);
    if (boardId) {
      loadBoard(1);
    }
  }, [boardId]);

  // sortBy가 변경될 때마다 1페이지로 이동하며 새로고침
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // 초기 마운트는 건너뜀
    }
    if (boardId) {
      loadBoard(1, sortBy);
    }
  }, [sortBy]);

  // 댓글 작성
  const createReply = async () => {
    if (!boardId || !replyContent.trim()) return;

    await replyApi.createReply(Number(boardId), {
      content: replyContent,
    });

    setReplyContent("");
    // 댓글 작성 후에는 1페이지로 이동
    loadBoard(1);
  };

  // 댓글 기능 이후 자동 새로고침
  const refresh = async () => {
    if (!boardId) return;
    // 현재 페이지 정렬 유지하면서 새로고침
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

  // 오류 시 로딩중 이라고 보여주기
  if (!board) return <div>로딩 중...</div>;

  return (
    <div>
      <div className="mb-6 border-b border-neutral-700 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">{board.title}</h1>
        <span className="text-sm font-semibold text-neutral-500">작성자: {board.writer}</span>
        <div className="text-sm font-semibold text-neutral-500">생성일시: {board.createdAt}</div>
        <div className="text-sm font-semibold text-neutral-500">장르: {board.boardGenre}</div>
      </div>
      <div className="mb-8 min-h-[100px] whitespace-pre-wrap break-words leading-[1.3] text-white">
        {board.content}
      </div>
      <div className="flex items-center justify-end">
        {userEmail && board.writerEmail === userEmail && (
          <button onClick={() => navigate(`/community/free/${board.boardId}/update`)}>수정</button>
        )}
      </div>

      <hr />

      <h3>댓글</h3>
      <div className="min-h-[50px]">
        <button
          onClick={() => setSortBy("latest")}
          style={{ fontWeight: sortBy === "latest" ? "bold" : "normal" }}
        >
          최신순
        </button>
        <button
          onClick={() => setSortBy("likes")}
          style={{ fontWeight: sortBy === "likes" ? "bold" : "normal", marginLeft: "10px" }}
        >
          추천순
        </button>
      </div>

      {!board.replies || board.replies?.dtoList.length === 0 ? (
        <p>댓글이 없습니다.</p>
      ) : (
        <>
          <ul>
            {board.replies.dtoList.map((reply) => (
              <ReplyItem
                key={reply.replyId}
                reply={reply}
                onRefresh={refresh}
                boardId={Number(boardId)}
              />
            ))}
          </ul>
          {/* 댓글 페이지네이션 추가 */}
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

      <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={3} />

      <button
        onClick={createReply}
        className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-500"
      >
        댓글 작성
      </button>
    </div>
  );
};

export default FreeBoardDetailPage;
