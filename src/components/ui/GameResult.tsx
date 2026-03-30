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
    <div className="flex flex-col items-center gap-6 py-12 text-white mx-auto max-w-xl px-8">
      <h2 className="text-3xl font-bold">최종 결과</h2>
      <p className="text-6xl font-extrabold text-indigo-400">
        {score} / {maxScore}
      </p>
      <p className="text-gray-400">
        {score === maxScore
          ? "완벽해요! 🎉"
          : score >= maxScore * 0.7
            ? "훌륭해요! 👏"
            : score >= maxScore * 0.4
              ? "잘 했어요! 😊"
              : "다음엔 더 잘할 수 있어요! 💪"}
      </p>
      <button
        onClick={onRestart}
        className="rounded-full bg-indigo-600 px-8 py-3 font-semibold hover:bg-indigo-500 transition-colors"
      >
        다시 도전
      </button>

      <div className="w-full mt-4">
        <h3 className="text-lg font-bold mb-3">이번 게임 수록곡</h3>

        {userEmail && (
          <div className="mb-4">
            <select
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-2 text-white outline-none focus:ring-1 focus:ring-indigo-500"
              value={selectedPlaylistId ?? ""}
              onChange={(e) => setSelectedPlaylistId(Number(e.target.value) || null)}
              onClick={fetchPlaylists}
            >
              <option value="">플레이리스트 선택...</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
            >
              + 새 플레이리스트 만들기
            </button>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {songs.map((song) => {
            const isAdded = addedSongIds.has(song.id);
            const isInPlaylist = playlistSongIds.has(song.id);
            const isDisabled = isAdded || isInPlaylist;

            return (
              <li
                key={song.id}
                className={`flex items-center justify-between rounded border px-4 py-3 transition-all ${
                  correctSongIds?.has(song.id)
                    ? "border-green-700 bg-green-900/20"
                    : wrongSongIds?.has(song.id)
                      ? "border-red-700 bg-red-900/20"
                      : "border-neutral-700"
                } ${isDisabled ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={song.imgUrl}
                    className="w-10 h-10 rounded object-cover shadow-sm"
                    alt={song.trackName}
                  />
                  <div>
                    <p className="font-semibold text-sm">{song.trackName}</p>
                    <p className="text-xs text-gray-400">{song.artistName}</p>
                  </div>
                </div>

                {userEmail && selectedPlaylistId && (
                  <div className="flex-shrink-0">
                    {isAdded ? (
                      <span className="text-xs text-green-400 font-semibold px-2 py-1">
                        추가됨 ✓
                      </span>
                    ) : isInPlaylist ? (
                      <span className="text-[11px] font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                        이미 있음
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddSong(song.id)}
                        className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium hover:bg-indigo-500 active:scale-95 transition-all"
                      >
                        + 추가
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
