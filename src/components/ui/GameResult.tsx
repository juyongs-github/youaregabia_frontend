import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { playlistApi } from "../../api/playlistApi";
import type { Song } from "./SongListItem";
import PlaylistCreateModal from "./PlaylistCreateModal";
import { pointApi } from "../../api/pointApi";
import { refreshPoint } from "./refreshPoint";

interface Props {
  songs: Song[];
  score: number;
  maxScore: number;
  onRestart: () => void;
  correctSongIds?: Set<number>;
  wrongSongIds?: Set<number>;
  quizType?: "MUSIC" | "ALBUM" | "CARD";
}

const GameResult = ({
  songs,
  score,
  maxScore,
  onRestart,
  correctSongIds,
  wrongSongIds,
  quizType,
}: Props) => {
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const [playlists, setPlaylists] = useState<{ id: number; title: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [addedSongIds, setAddedSongIds] = useState<Set<number>>(new Set());
  const [playlistSongIds, setPlaylistSongIds] = useState<Set<number>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchPlaylists = async () => {
    if (!userEmail || playlists.length > 0) return;
    const res = await playlistApi.getAllPlaylist();
    setPlaylists(res.data);
  };

  useEffect(() => {
    if (!selectedPlaylistId) {
      setPlaylistSongIds(new Set());
      setAddedSongIds(new Set());
      return;
    }
    playlistApi.getPlaylistSongs(selectedPlaylistId).then((res) => {
      setPlaylistSongIds(new Set(res.data.map((s: any) => s.id)));
      setAddedSongIds(new Set());
    });
  }, [selectedPlaylistId]);

  const handleCreated = async () => {
    if (!userEmail) return;
    const res = await playlistApi.getAllPlaylist();
    setPlaylists(res.data);
  };

  const handleAddSong = async (songId: number) => {
    if (!selectedPlaylistId || !userEmail) return;
    try {
      await playlistApi.addSongToPlaylist(selectedPlaylistId, songId);
      setAddedSongIds((prev) => new Set(prev).add(songId));
      setPlaylistSongIds((prev) => new Set(prev).add(songId));
    } catch (error) {
      console.error(error);
    }
  };

  const pointSent = useRef(false);
  useEffect(() => {
    if (score > 0 && quizType && userEmail && !pointSent.current) {
      pointApi
        .addQuizPoint(score, quizType)
        .then(() => refreshPoint())
        .catch(console.error);
      pointSent.current = true;
    }
  }, [score, quizType, userEmail]);

  return (
    <div className="flex flex-col items-center gap-8 py-10 px-6 mx-auto max-w-2xl animate-in fade-in zoom-in duration-500">
      {/* 결과 헤더 카드 */}
      <div className="w-full bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[40px] p-10 text-center shadow-[0_20px_50px_rgba(109,94,252,0.1)]">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
          Final Result
        </h2>

        {/* 점수 크기 조절 (기존 8xl -> 6xl) */}
        <div className="relative inline-block mb-2">
          <p className="text-6xl font-black bg-gradient-to-br from-[#6d5efc] to-[#ff5ca8] bg-clip-text text-transparent">
            {score} <span className="text-xl font-bold text-slate-300 ml-1">/ {maxScore}</span>
          </p>
        </div>

        <p className="text-lg font-bold text-[#2f3863] mb-8">
          {score === maxScore ? "완벽해요! 🎉" : "수고하셨습니다! 😊"}
        </p>

        {/* 버튼 색상 변경: 보라색 계열 강조 */}
        <button
          onClick={onRestart}
          className="group relative px-14 py-4 rounded-2xl bg-[#ff5ca8] text-white font-black text-lg shadow-lg shadow-[#ff5ca8]/25 hover:shadow-xl hover:bg-[#ef4d97] active:scale-95 transition-all"
        >
          다시 도전하기
        </button>
      </div>

      {/* 수록곡 영역 */}
      <div className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h3 className="text-lg font-black text-[#2f3863]">🎵 수록곡 리스트</h3>

          {userEmail && (
            <div className="flex flex-col items-end gap-2">
              <select
                className="w-full md:w-56 appearance-none rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-[#2f3863] font-bold text-xs outline-none focus:ring-2 focus:ring-[#6d5efc]/20 shadow-sm transition-all"
                value={selectedPlaylistId ?? ""}
                onChange={(e) => setSelectedPlaylistId(Number(e.target.value) || null)}
                onClick={fetchPlaylists}
              >
                <option value="">플레이리스트 선택</option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-black text-[#6d5efc] hover:underline"
              >
                + 새 플레이리스트
              </button>
            </div>
          )}
        </div>

        <ul className="grid grid-cols-1 gap-4">
          {songs.map((song) => {
            const isAdded = addedSongIds.has(song.id);
            const isInPlaylist = playlistSongIds.has(song.id);
            const isDisabled = isAdded || isInPlaylist;
            const isCorrect = correctSongIds?.has(song.id);
            const isWrong = wrongSongIds?.has(song.id);

            return (
              <li
                key={song.id}
                className={`flex items-center justify-between rounded-[26px] p-4 border transition-all duration-300 ${
                  isCorrect
                    ? "border-green-100 bg-green-50/60"
                    : isWrong
                      ? "border-rose-100 bg-rose-50/60"
                      : "bg-white/80 border-white shadow-sm"
                }`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={song.imgUrl}
                    className="w-12 h-12 rounded-[16px] object-cover shadow-sm ring-2 ring-white"
                    alt={song.trackName}
                  />
                  <div className="flex flex-col max-w-[150px] md:max-w-xs">
                    <p className="font-black text-[#2f3863] text-sm leading-tight truncate">
                      {song.trackName}
                    </p>
                    <p className="text-xs font-bold text-slate-400 truncate">{song.artistName}</p>
                  </div>
                </div>

                {userEmail && selectedPlaylistId && (
                  <div className="flex-shrink-0 ml-4">
                    {isAdded ? (
                      <span className="flex items-center gap-1 text-[13px] text-[#6d5efc] font-black bg-[rgba(109,94,252,0.1)] px-4 py-2 rounded-xl">
                        추가됨 ✓
                      </span>
                    ) : isInPlaylist ? (
                      <span className="text-[13px] font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-xl">
                        이미 있음
                      </span>
                    ) : (
                      /* 추가 버튼 크기 확대 및 색상 변경 (포인트 핑크 계열) */
                      <button
                        onClick={() => handleAddSong(song.id)}
                        className="rounded-xl bg-[#ff5ca8] px-5 py-2.5 text-[13px] font-black text-white hover:bg-[#ef4d97] hover:shadow-lg hover:shadow-[#ff5ca8]/20 active:scale-90 transition-all shadow-md"
                      >
                        곡 추가
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {isCreateModalOpen && (
        <PlaylistCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default GameResult;
