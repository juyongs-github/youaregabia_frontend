import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import { useSelector } from "react-redux";
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

const CriticWrite = () => {
  const location = useLocation();
  const state = location.state as {
    songId?: number;
    songName?: string;
    artistName?: string;
    imgUrl?: string;
  } | null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [boardType] = useState("CRITIC");
  const [boardGenre] = useState("FREE");
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(
    state?.songId
      ? {
          id: state.songId,
          trackName: state.songName ?? "",
          artistName: state.artistName ?? "",
          imgUrl: state.imgUrl ?? "",
        }
      : null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  const previewImageUrl = extractFirstImageFromHtml(content);

  useEffect(() => {
    if (userRole && userRole !== "CRITIC") {
      alert("평론 작성 권한이 없습니다.");
      navigate(-1);
    }
  }, [userRole]);

  const submit = async () => {
    console.log("content:", content);
    console.log("content length:", content.length);
    console.log("content trim:", content.trim());
    if (!userEmail) return;
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

    const boardId = await boardApi.createBoard({
      title,
      content,
      boardType,
      boardGenre,
      songIds: [selectedSong.id],
    });
    navigate(`/recommend/critic/${boardId}`);
  };

  return (
    <div className="kf-expansion-page kf-critic-write">
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="mb-8 text-2xl font-bold" style={{ color: "var(--kf-brand)" }}>
          평론 작성
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
              <style>{`.kf-critic-write [contenteditable] img { display: none; }`}</style>
              <CustomEditor
                onChange={(html) => setContent(html)}
                placeholder="평론 내용을 입력하세요..."
              />
            </div>

            <button
              className="rounded bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 w-full"
              onClick={submit}
            >
              등록
            </button>
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

export default CriticWrite;
