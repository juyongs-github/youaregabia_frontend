import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import CriticSongSelectModal from "../../Components/ui/CriticSongSelectModal";

interface SelectedSong {
  id: number;
  trackName: string;
  artistName: string;
  imgUrl: string;
}

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

  useEffect(() => {
    if (userRole && userRole !== "CRITIC") {
      alert("평론 작성 권한이 없습니다.");
      navigate(-1);
    }
  }, [userRole]);

  const submit = async () => {
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
    <div className="mx-auto max-w-2xl p-6 text-white">
      <h2 className="mb-6 text-2xl font-bold">평론 작성</h2>

      {/* 곡 선택 영역 */}
      {selectedSong ? (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-indigo-700 bg-neutral-900 px-4 py-3">
          <div className="flex items-center gap-4">
            <img src={selectedSong.imgUrl} className="w-14 h-14 rounded-lg object-cover" />
            <div>
              <p className="font-semibold">{selectedSong.trackName}</p>
              <p className="text-sm text-gray-400">{selectedSong.artistName}</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-gray-500 hover:text-indigo-400"
          >
            변경
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded border border-dashed border-indigo-500 px-4 py-4 text-indigo-400 hover:bg-indigo-900/20"
        >
          + 평론할 곡 선택
        </button>
      )}

      <input
        className="mb-3 w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        placeholder="평론 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="mb-4 w-full min-h-[400px] resize-y rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        placeholder="평론 내용을 작성하세요..."
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        className="rounded bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 w-full"
        onClick={submit}
      >
        등록
      </button>

      {isModalOpen && (
        <CriticSongSelectModal
          onClose={() => setIsModalOpen(false)}
          onSelect={(song) => setSelectedSong(song)}
        />
      )}
    </div>
  );
};

export default CriticWrite;
