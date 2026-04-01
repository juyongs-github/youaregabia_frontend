import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import type { Song } from "./SongListItem";
import type { Board } from "../../types/board";
import { boardApi } from "../../api/boardApi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

interface Props {
  song: Song;
  onClose: () => void;
}

type Tab = "info" | "review";

const SongDetailModal = ({ song, onClose }: Props) => {
  const [tab, setTab] = useState<Tab>("info");
  const [reviews, setReviews] = useState<Board[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const res = await boardApi.getCriticBoards(song.id, { page: 1, size: 5 });
      setReviews(res.dtoList);
    } finally {
      setIsLoadingReviews(false);
    }
  };
  useEffect(() => {
    if (tab === "review") fetchReviews();
  }, [tab]);

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-neutral-900 overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-bold text-white">곡 상세정보</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={18} />
          </button>
        </div>

        {/* 곡 기본 정보 */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-700">
          <img
            src={song.imgUrl}
            alt={song.trackName}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
          <div>
            <p className="text-xl font-bold text-white">{song.trackName}</p>
            <p className="text-gray-400">{song.artistName}</p>
            <p className="text-sm text-gray-500">{song.genreName}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-neutral-700">
          <button
            onClick={() => setTab("info")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "info"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            곡 정보
          </button>
          <button
            onClick={() => setTab("review")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "review"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            평론
          </button>
        </div>

        {/* 탭 내용 */}
        <div className="px-6 py-4 min-h-[200px]">
          {tab === "info" && (
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-500">발매일</span>
                <span className="text-white">{song.releaseDate?.slice(0, 10) ?? "-"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">장르</span>
                <span className="text-white">{song.genreName ?? "-"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">재생시간</span>
                <span className="text-white">{formatDuration(song.durationMs)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">아티스트</span>
                <span className="text-white">{song.artistName}</span>
              </li>
            </ul>
          )}

          {tab === "review" && (
            <div className="flex flex-col gap-3">
              {/* CRITIC만 작성 버튼 표시 */}
              {userRole === "CRITIC" && (
                <button
                  onClick={() => {
                    onClose();
                    navigate("/recommend/critic/write", {
                      state: {
                        songId: song.id,
                        songName: song.trackName,
                        artistName: song.artistName,
                        imgUrl: song.imgUrl,
                      },
                    });
                  }}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  + 평론 작성
                </button>
              )}

              {isLoadingReviews ? (
                <p className="text-center text-gray-500 py-4">불러오는 중...</p>
              ) : reviews.length === 0 ? (
                <p className="text-center text-gray-500 py-8">아직 평론이 없어요.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {reviews.map((review) => (
                    <li
                      key={review.boardId}
                      className="rounded border border-neutral-700 px-4 py-3 cursor-pointer hover:bg-neutral-800"
                      onClick={() => {
                        onClose();
                        navigate(`/recommend/critic/${review.boardId}`);
                      }}
                    >
                      <p className="font-semibold text-sm">{review.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{review.writer}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongDetailModal;
