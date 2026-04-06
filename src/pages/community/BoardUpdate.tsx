import "../../styles/board-update-kfandom.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { boardApi } from "../../api/boardApi";
import type { RootState } from "../../store";
import CustomEditor from "../../components/ui/CustomEditor";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ConfirmToast from "../../components/ui/ConfirmToast";
import { useConfirmToast } from "../../hooks/useConfirmToast";

const BoardUpdate = () => {
  const { toast, showToast, closeToast } = useToast();
  const { confirmToast, confirm, closeConfirm } = useConfirmToast();
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  // 유저 정보 (수정 권한 확인용)
  const user = useSelector((state: RootState) => state.auth.user);
  const userEmail = user?.email;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [genre, setGenre] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 핵심 조건: 장르가 'FREE'인지 확인
  const isFreeGenre = genre === "FREE";

  // 1. 게시글 데이터 불러오기
  useEffect(() => {
    if (!boardId || !userEmail) return;

    boardApi
      .getBoardDetail(Number(boardId))
      .then((board) => {
        setTitle(board.title);
        setContent(board.content ?? "");
        setGenre(board.boardGenre); // 여기서 genre 상태가 업데이트됨
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("데이터 로딩 실패:", err);
        showToast("게시글을 불러올 수 없습니다.", "error");
        navigate(-1);
      });
  }, [boardId, userEmail, navigate]);

  // 2. 수정 실행
  const update = async () => {
    if (!title.trim()) {
      showToast("제목을 입력해주세요.", "info");
      return;
    }

    try {
      if (!boardId) return;
      await boardApi.updateBoard(Number(boardId), {
        title,
        content,
        boardGenre: genre,
      });
      showToast("수정되었습니다.", "success");
      navigate(`/community/share/${boardId}`);
    } catch (error) {
      showToast("수정 중 오류가 발생했습니다.", "error");
    }
  };

  // 3. 삭제 실행
  const remove = async () => {
    if (!boardId) return;
    const confirmed = await confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      await boardApi.deleteBoard(Number(boardId));
      showToast("삭제되었습니다.", "success");
      navigate("/community/share");
    } catch (error) {
      showToast("삭제 중 오류가 발생했습니다.", "error");
    }
  };

  if (isLoading)
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        <ConfirmToast state={confirmToast} onClose={closeConfirm} />
      <div className="kf-community-page kf-board-update">
        <div className="kf-community-page__shell">
          <div className="kf-community-loading">로딩 중...</div>
        </div>
      </div>
      </>
    );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <ConfirmToast state={confirmToast} onClose={closeConfirm} />
    <div className="kf-community-page kf-board-update">
      <div className="kf-community-page__shell">
        <div className="max-w-4xl mx-auto p-4">
          {/* 장르가 FREE이면 '평론 수정', 아니면 '플레이리스트 공유 수정' */}
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight">
            {isFreeGenre ? "평론 수정" : "플레이리스트 공유 수정"}
          </h2>

          {/* 제목 입력 */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-neutral-400">제목</label>
            <input
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 장르가 FREE가 아닐 때만 장르 선택창 노출 (FREE는 평론 고정이므로 숨김) */}
          {!isFreeGenre && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-neutral-400">장르</label>
              <select
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="KPOP">KPOP</option>
                <option value="POP">POP</option>
                <option value="JPOP">JPOP</option>
                <option value="HIPHOP">HIPHOP</option>
              </select>
            </div>
          )}

          {/* 에디터 영역 */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-neutral-400">내용</label>
            <CustomEditor
              initialValue={content}
              onChange={(html) => setContent(html)}
              // 장르에 따른 Placeholder 변경
              placeholder={
                isFreeGenre ? "평론 내용을 수정하세요." : "추가로 하고 싶은 말을 입력하세요..."
              }
            />
          </div>

          <div
            className="flex justify-end gap-3 pt-6"
            style={{ borderTop: "1px solid var(--kf-border)" }}
          >
            <button
              onClick={() => navigate(-1)}
              className="rounded-full px-6 py-2 font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,0.72)",
                color: "var(--kf-text-sub)",
                border: "1px solid var(--kf-border-strong)",
              }}
            >
              취소
            </button>
            <button
              onClick={remove}
              className="rounded-full px-6 py-2 font-semibold transition-all"
              style={{
                background: "rgba(255,102,122,0.08)",
                color: "var(--kf-danger)",
                border: "1px solid rgba(255,102,122,0.28)",
              }}
            >
              삭제하기
            </button>
            <button
              onClick={update}
              className="rounded-full px-8 py-2 font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
                boxShadow: "0 8px 20px rgba(109,94,252,0.24)",
                border: "none",
              }}
            >
              수정 완료
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default BoardUpdate;
