import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import api from "../../api/axios";
import { playlistApi } from "../../api/playlistApi";
import MusicPlayer from "../../components/layout/MusicPlayer";
import PlaylistCreateModal from "../../components/ui/PlaylistCreateModal";
import type { Song } from "../../components/ui/SongListItem";

const TOTAL = 5;

type Phase = "playing" | "result";

const BlindRecommendPage = () => {
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [phase, setPhase] = useState<Phase>("playing");
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);

  // 결과 화면
  const [playlists, setPlaylists] = useState<{ id: number; title: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [addedSongIds, setAddedSongIds] = useState<Set<number>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadSongs = async () => {
    setIsLoading(true);
    const results: Song[] = [];
    await Promise.all(
      Array.from({ length: TOTAL }, () =>
        api.get("/api/random").then((res) => results.push(res.data))
      )
    );
    setSongs(results);
    setIsLoading(false);
  };

  const fetchPlaylists = async () => {
    if (!userEmail || playlists.length > 0) return;
    const res = await playlistApi.getAllPlaylist(userEmail);
    setPlaylists(res.data);
  };

  const handleCreated = async () => {
    if (!userEmail) return;
    const res = await playlistApi.getAllPlaylist(userEmail);
    setPlaylists(res.data);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const currentSong = songs[currentIndex];

  const goNext = () => {
    setIsRevealed(false);
    if (currentIndex + 1 >= TOTAL) {
      setPhase("result");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleLike = () => {
    if (!currentSong) return;
    setLikedSongs((prev) => [...prev, currentSong]);
    setIsRevealed(true);
    setTimeout(goNext, 1500);
  };

  const handleDislike = () => {
    setTimeout(goNext);
  };

  const handleAddSong = async (songId: number) => {
    if (!selectedPlaylistId || !userEmail) return;
    await playlistApi.addSongToPlaylist(selectedPlaylistId, songId, userEmail);
    setAddedSongIds((prev) => new Set(prev).add(songId));
  };

  const handleRestart = () => {
    setSongs([]);
    setCurrentIndex(0);
    setLikedSongs([]);
    setPhase("playing");
    setIsRevealed(false);
    setAddedSongIds(new Set());
    setSelectedPlaylistId(null);
    loadSongs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-white">🎵 곡 불러오는 중...</div>
    );
  }

  // 결과 화면
  if (phase === "result") {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-white mx-auto max-w-xl px-8">
        <h2 className="text-3xl font-bold">블라인드 추천 결과</h2>
        <p className="text-gray-400">
          {TOTAL}곡 중 <span className="text-indigo-400 font-bold">{likedSongs.length}곡</span>이
          마음에 드셨어요!
        </p>

        <button
          onClick={handleRestart}
          className="rounded-full bg-indigo-600 px-8 py-3 font-semibold hover:bg-indigo-500"
        >
          다시 하기
        </button>

        {likedSongs.length === 0 ? (
          <p className="text-gray-500">좋아요한 곡이 없어요.</p>
        ) : (
          <div className="w-full mt-2">
            <h3 className="text-lg font-bold mb-3">좋아요한 곡들</h3>

            {/* 플레이리스트 선택 */}
            {userEmail && (
              <div className="mb-4">
                <select
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-2 text-white"
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
              {likedSongs.map((song) => (
                <li
                  key={song.id}
                  className="flex items-center justify-between rounded border border-green-700 bg-green-900/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <img src={song.imgUrl} className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="font-semibold text-sm">{song.trackName}</p>
                      <p className="text-xs text-gray-400">{song.artistName}</p>
                    </div>
                  </div>
                  {userEmail && selectedPlaylistId && (
                    <button
                      onClick={() => handleAddSong(song.id)}
                      disabled={addedSongIds.has(song.id)}
                      className="rounded bg-indigo-600 px-3 py-1 text-sm hover:bg-indigo-500 disabled:bg-neutral-700 disabled:text-gray-500"
                    >
                      {addedSongIds.has(song.id) ? "추가됨 ✓" : "+ 추가"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isCreateModalOpen && (
          <PlaylistCreateModal
            email={userEmail ?? ""}
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={handleCreated}
          />
        )}
      </div>
    );
  }

  // 추천 화면
  return (
    <div className="mx-auto max-w-xl p-8 text-white">
      {/* 진행 상황 + 좋아요 목록 */}
      <div className="mb-6 flex items-start justify-between">
        <span className="text-gray-400">
          {currentIndex + 1} / {TOTAL}
        </span>

        {/* 우측 상단 좋아요 곡 목록 */}
        {likedSongs.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">👍 좋아요한 곡</p>
            {likedSongs.map((s, i) => (
              <p key={i} className="text-xs text-indigo-400 truncate max-w-[140px]">
                {s.trackName}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 진행 바 */}
      <div className="mb-8 h-2 w-full rounded-full bg-neutral-700">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all"
          style={{ width: `${(currentIndex / TOTAL) * 100}%` }}
        />
      </div>

      {/* 곡 공개 전 */}
      {!isRevealed && currentSong && (
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center text-5xl">
            🎵
          </div>
          <p className="text-gray-400">지금 흘러나오는 곡이 마음에 드나요?</p>
          <div className="flex gap-4">
            <button
              onClick={handleLike}
              className="rounded-full bg-indigo-600 px-8 py-3 text-lg font-semibold hover:bg-indigo-500"
            >
              좋아요 👍
            </button>
            <button
              onClick={handleDislike}
              className="rounded-full bg-neutral-700 px-8 py-3 text-lg font-semibold hover:bg-neutral-600"
            >
              별로에요 👎
            </button>
          </div>
        </div>
      )}

      {/* 곡 공개 후 */}
      {isRevealed && currentSong && (
        <div className="flex flex-col items-center gap-3 mt-8">
          <img src={currentSong.imgUrl} className="w-40 h-40 rounded-xl" />
          <p className="text-xl font-bold">{currentSong.trackName}</p>
          <p className="text-gray-400">{currentSong.artistName}</p>
          <p className="text-sm text-gray-500">{currentSong.genreName}</p>
        </div>
      )}

      {/* 뮤직 플레이어 */}
      {currentSong && !isRevealed && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer song={currentSong} setIsPlayerVisible={handleDislike} blind={true} />
        </div>
      )}
    </div>
  );
};

export default BlindRecommendPage;
