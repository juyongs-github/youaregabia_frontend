import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { boardApi } from "../../api/boardApi";
import type { RootState } from "../../store";
import "../../styles/CriticWrite.kfandom.css";
import CriticSongSelectModal from "../../components/ui/CriticSongSelectModal";
import CustomEditor from "../../components/ui/CustomEditor";

interface SelectedSong {
  id: number;
  trackName: string;
  artistName: string;
  imgUrl: string;
}

const extractFirstImageFromHtml = (html: string) => {
  if (!html) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const firstImg = doc.querySelector("img");
  return firstImg?.getAttribute("src") ?? null;
};

const CriticUpdate = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const previewImageUrl = extractFirstImageFromHtml(content);

  useEffect(() => {
    if (userRole && userRole !== "CRITIC") {
      alert("평론 수정 권한이 없습니다.");
      navigate(-1);
    }
  }, [userRole]);

  useEffect(() => {
    if (!boardId || !userEmail) return;

    boardApi
      .getBoardDetail(Number(boardId))
      .then((board) => {
        setTitle(board.title);
        setContent(board.content ?? "");
        if (board.songs && board.songs.length > 0) {
          const s = board.songs[0];
          setSelectedSong({
            id: s.songId,
            trackName: s.trackName,
            artistName: s.artistName,
            imgUrl: s.imgUrl,
          });
        }
        setIsLoading(false);
      })
      .catch(() => {
        alert("게시글을 불러올 수 없습니다.");
        navigate(-1);
      });
  }, [boardId, userEmail]);

  const update = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    if (!selectedSong) {
      alert("평론할 곡을 선택해주세요.");
      return;
    }

    try {
      if (!boardId) return;
      await boardApi.updateBoard(Number(boardId), {
        title,
        content,
        boardGenre: "FREE",
      });
      alert("수정되었습니다.");
      navigate(`/recommend/critic/${boardId}`);
    } catch {
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const remove = async () => {
    if (!boardId || !window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await boardApi.deleteBoard(Number(boardId));
      alert("삭제되었습니다.");
      navigate("/recommend/critic");
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="kf-expansion-page kf-critic-write">
        <div className="max-w-6xl mx-auto p-6">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="kf-expansion-page kf-critic-write">
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="mb-8 text-2xl font-bold" style={{ color: "var(--kf-brand)" }}>
          평론 수정
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 폼 영역 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 곡 선택 */}
            {!selectedSong ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-indigo-500 px-4 py-4 text-indigo-400 hover:bg-indigo-900/20"
              >
                + 평론할 곡 선택
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-indigo-700 bg-neutral-900 px-4 py-3">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedSong.imgUrl}
                    className="w-10 h-10 rounded-lg object-cover"
                    alt={selectedSong.trackName}
                  />
                  <div>
                    <p className="font-semibold text-sm text-white">{selectedSong.trackName}</p>
                    <p className="text-xs text-gray-400">{selectedSong.artistName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs text-gray-500 hover:text-indigo-400"
                >
                  변경
                </button>
              </div>
            )}

            <input
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              placeholder="평론 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div>
              <CustomEditor
                initialValue={content}
                onChange={(html) => setContent(html)}
                placeholder="평론 내용을 수정하세요..."
              />
            </div>

            {/* 버튼 영역 */}
            <div
              className="flex justify-end gap-3 pt-4"
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

          {/* 우측: content 첫 이미지 미리보기 */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="kf-board-side-card">
                {previewImageUrl ? (
                  <img src={previewImageUrl} alt="preview" className="kf-board-side-image" />
                ) : (
                  <div
                    className="kf-board-side-empty"
                    style={{ flexDirection: "column", gap: "8px" }}
                  >
                    <span style={{ fontSize: "2rem" }}>🖼️</span>
                    <span className="text-sm text-center">
                      에디터에 이미지를 삽입하면
                      <br />
                      여기에 표시됩니다
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isModalOpen && (
        <CriticSongSelectModal
          onClose={() => setIsModalOpen(false)}
          onSelect={(song) => {
            setSelectedSong(song);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default CriticUpdate;
