import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import api from "../../api/axios";
import { playlistApi } from "../../api/playlistApi";
import PlaylistCreateModal from "../../Components/ui/PlaylistCreateModal";
import type { Song } from "../../Components/ui/SongListItem";
import MusicPlayer from "../../Components/layout/MusicPlayer";
import GameCountdown from "../../components/ui/GameCountdown";

type Phase = "intro" | "playing" | "result";
type TotalMode = 5 | 10 | "infinite";

const BlindRecommendPage = () => {
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  // 상태 관리
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [isLoading, setIsLoading] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [totalMode, setTotalMode] = useState<TotalMode>(5);
  const [started, setStarted] = useState(false); // 게임 시작 여부 (카운트다운 이후 true)

  // 결과 화면 관련 상태
  const [playlists, setPlaylists] = useState<{ id: number; title: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [addedSongIds, setAddedSongIds] = useState<Set<number>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [playlistSongIds, setPlaylistSongIds] = useState<Set<number>>(new Set());

  // 곡 가져오기 함수
  const fetchRandomSongs = useCallback(async (count: number) => {
    try {
      const promises = Array.from({ length: count }, () =>
        api.get("/api/random").then((res) => res.data)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error("곡 불러오기 실패:", error);
      return [];
    }
  }, []);

  // 초기 곡 로드 로직
  const loadInitialSongs = useCallback(
    async (mode: TotalMode) => {
      setIsLoading(true);
      const count = mode === "infinite" ? 5 : mode;
      const initialSongs = await fetchRandomSongs(count);

      if (initialSongs.length > 0) {
        setSongs(initialSongs);
        setCurrentIndex(0);
        setStarted(true); // 데이터 로드 완료 후 실제 게임 화면으로 진입
      } else {
        alert("곡을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        setPhase("intro"); // 실패 시 인트로로 복구
      }
      setIsLoading(false);
    },
    [fetchRandomSongs]
  );

  // 1. 모드 선택 시 실행 (인트로 -> 카운트다운 대기)
  const handleStart = (mode: TotalMode) => {
    setTotalMode(mode);
    setLikedSongs([]);
    setPhase("playing"); // 'playing' 페이즈로 전환하여 카운트다운 표시
    setStarted(false); // 아직 카운트다운 전 상태
  };

  // 2. 카운트다운 종료 시 실행 (카운트다운 -> 데이터 로딩)
  const initiateGame = useCallback(() => {
    loadInitialSongs(totalMode);
  }, [totalMode, loadInitialSongs]);

  // 다음 곡 이동 로직
  const goNext = useCallback(async () => {
    setIsRevealed(false);

    if (totalMode !== "infinite" && currentIndex + 1 >= (totalMode as number)) {
      setPhase("result");
      return;
    }

    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);

    if (songs.length - nextIdx <= 2) {
      const moreSongs = await fetchRandomSongs(3);
      setSongs((prev) => [...prev, ...moreSongs]);
    }
  }, [currentIndex, totalMode, songs.length, fetchRandomSongs]);

  const handleLike = () => {
    if (!songs[currentIndex]) return;
    setLikedSongs((prev) => [...prev, songs[currentIndex]]);
    setIsRevealed(true);
    setTimeout(goNext, 1500);
  };

  const handleDislike = () => {
    goNext();
  };

  const handleRestart = () => {
    setPhase("intro");
    setSongs([]);
    setLikedSongs([]);
    setStarted(false);
    setCurrentIndex(0);
  };

  // 플레이리스트 관련 핸들러 (기존과 동일)
  const fetchPlaylists = async () => {
    if (!userEmail || playlists.length > 0) return;
    const res = await playlistApi.getAllPlaylist();
    setPlaylists(res.data);
  };

  const handleCreated = async () => {
    if (!userEmail) return;
    const res = await playlistApi.getAllPlaylist();
    setPlaylists(res.data);
  };

  useEffect(() => {
    if (!selectedPlaylistId) {
      setPlaylistSongIds(new Set());
      return;
    }
    playlistApi.getPlaylistSongs(selectedPlaylistId).then((res) => {
      setPlaylistSongIds(new Set(res.data.map((s: any) => s.id)));
      setAddedSongIds(new Set());
    });
  }, [selectedPlaylistId]);

  const handleAddSong = async (songId: number) => {
    if (!selectedPlaylistId || !userEmail) return;
    await playlistApi.addSongToPlaylist(selectedPlaylistId, songId);
    setAddedSongIds((prev) => new Set(prev).add(songId));
  };

  // ========================================================
  // 조건부 렌더링 (순서가 매우 중요합니다)
  // ========================================================

  // 1. 결과 화면
  if (phase === "result") {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-white mx-auto max-w-xl px-8 animate-in fade-in duration-500">
        <h2 className="text-3xl font-bold text-indigo-400">추천 완료!</h2>
        <p className="text-gray-400">총 {likedSongs.length}곡의 취향을 발견했습니다.</p>
        <button
          onClick={handleRestart}
          className="rounded-full bg-indigo-600 px-10 py-3 font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
        >
          처음으로 돌아가기
        </button>

        {likedSongs.length > 0 && (
          <div className="w-full mt-6">
            <h3 className="text-lg font-bold mb-4 border-b border-neutral-800 pb-2">
              나의 선택목록
            </h3>
            {userEmail && (
              <div className="mb-6 space-y-2">
                <select
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedPlaylistId ?? ""}
                  onChange={(e) => setSelectedPlaylistId(Number(e.target.value) || null)}
                  onClick={fetchPlaylists}
                >
                  <option value="">저장할 플레이리스트 선택...</option>
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xs text-indigo-400 hover:underline px-1"
                >
                  + 새 플레이리스트 만들기
                </button>
              </div>
            )}
            <ul className="flex flex-col gap-3">
              {likedSongs.map((song) => (
                <li
                  key={song.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={song.imgUrl}
                      className="w-12 h-12 rounded-lg object-cover shadow-md"
                      alt=""
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate w-40">{song.trackName}</p>
                      <p className="text-xs text-gray-500 truncate w-40">{song.artistName}</p>
                    </div>
                  </div>
                  {userEmail && selectedPlaylistId && (
                    <button
                      onClick={() => handleAddSong(song.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        addedSongIds.has(song.id) || playlistSongIds.has(song.id)
                          ? "bg-neutral-800 text-gray-500 cursor-default"
                          : "bg-indigo-600 hover:bg-indigo-500 active:scale-95"
                      }`}
                    >
                      {addedSongIds.has(song.id) || playlistSongIds.has(song.id)
                        ? "추가됨 ✓"
                        : "+ 추가"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {isCreateModalOpen && (
          <PlaylistCreateModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={handleCreated}
          />
        )}
      </div>
    );
  }

  // 2. 인트로 화면
  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white gap-10 px-4 animate-in fade-in duration-700">
        <div className="text-center space-y-3">
          <div className="text-6xl mb-4 animate-bounce">🎵</div>
          <h1 className="text-4xl font-black tracking-tight">블라인드 추천</h1>
          <p className="text-gray-500 text-sm max-w-xs">
            곡 정보 없이 듣고 마음에 드는 곡만 골라보세요
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {(["infinite", 5, 10] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleStart(mode)}
              className="flex items-center justify-between rounded-2xl px-6 py-4 border border-neutral-800 bg-neutral-900 hover:border-indigo-500/50 hover:bg-neutral-800 transition-all active:scale-95 group"
            >
              <div className="text-left">
                <p className="font-black text-base group-hover:text-indigo-400 transition-colors">
                  {mode === "infinite" ? "계속 모드" : `${mode}곡 모드`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {mode === "infinite" ? "끝없이 새로운 곡 추천" : `${mode}곡을 듣고 결과 확인`}
                </p>
              </div>
              <span className="text-2xl">
                {mode === "infinite" ? "∞" : mode === 5 ? "🎯" : "🔥"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 3. 카운트다운 화면 (모드 선택 직후)
  if (phase === "playing" && !started && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white animate-in fade-in duration-500">
        {/* 선택한 모드 강조 표시 */}
        <div className="mb-8 text-center space-y-2">
          <div className="text-5xl mb-2">
            {totalMode === "infinite" ? "∞" : totalMode === 5 ? "🎯" : "🔥"}
          </div>
          <h2 className="text-2xl font-black text-indigo-400">
            {totalMode === "infinite" ? "계속 모드" : `${totalMode}곡 모드`}
          </h2>
          <p className="text-gray-500 text-sm">준비되셨나요? 곧 시작합니다!</p>
        </div>

        {/* 기존 카운트다운 컴포넌트 */}
        <div className="relative">
          <GameCountdown onStart={initiateGame} />
        </div>
      </div>
    );
  }

  // 4. 로딩 화면 (카운트다운 직후 데이터 페칭 중)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-white flex-col gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xl">🎵</div>
        </div>
        <p className="animate-pulse text-indigo-300 font-medium">새로운 취향을 찾는 중...</p>
      </div>
    );
  }

  // 5. 추천 진행 화면 (started === true인 경우만 렌더링)
  const currentSong = songs[currentIndex];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 text-white flex flex-col md:flex-row gap-8 items-start relative min-h-[80vh]">
      <div className="flex-1 w-full max-w-xl mx-auto flex flex-col items-center">
        {/* 상단 프로그레스 바 */}
        <div className="w-full mb-10 mt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-gray-400 font-bold text-sm">
              ROUND <span className="text-indigo-400">{currentIndex + 1}</span>
              <span className="text-xs opacity-40 ml-1">
                / {totalMode === "infinite" ? "∞" : totalMode}
              </span>
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full bg-indigo-500 transition-all duration-700 ease-out ${totalMode === "infinite" ? "animate-pulse" : ""}`}
              style={{
                width:
                  totalMode === "infinite"
                    ? "100%"
                    : `${((currentIndex + 1) / (totalMode as number)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 메인 카드 영역 */}
        <div className="w-full relative min-h-[450px] flex flex-col items-center justify-center">
          {currentSong ? (
            !isRevealed ? (
              <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-500 w-full">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-7xl shadow-2xl ring-8 ring-indigo-500/10">
                  🎵
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">이 곡, 마음에 드시나요?</h3>
                  <p className="text-gray-500 text-sm">곡 정보를 보려면 좋아요를 눌러주세요.</p>
                </div>
                <div className="flex gap-5">
                  <button
                    onClick={handleLike}
                    className="group flex items-center gap-2 rounded-2xl bg-indigo-600 px-12 py-4 text-xl font-black hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/30"
                  >
                    좋아요 👍
                  </button>
                  <button
                    onClick={handleDislike}
                    className="rounded-2xl bg-neutral-800 px-10 py-4 text-xl font-bold hover:bg-neutral-700 transition-all active:scale-95 text-gray-400"
                  >
                    별로에요 👎
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full text-center">
                <img
                  src={currentSong.imgUrl}
                  alt=""
                  className="w-56 h-56 rounded-2xl shadow-2xl ring-1 ring-white/10"
                />
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white">{currentSong.trackName}</h3>
                  <p className="text-indigo-400 font-bold text-lg">{currentSong.artistName}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm italic">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  곧 다음 곡으로 넘어갑니다...
                </div>
              </div>
            )
          ) : (
            <p className="text-gray-500">곡 정보를 불러오는 중입니다...</p>
          )}
        </div>
      </div>

      {/* 우측 사이드바 (좋아요 목록) */}
      {likedSongs.length > 0 && (
        <aside className="w-full md:w-72 bg-neutral-900/40 backdrop-blur-md rounded-3xl p-6 border border-neutral-800 sticky top-12 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black text-gray-400">👍 좋아요 목록</p>
            <span className="bg-indigo-600 text-white text-[11px] px-2.5 py-1 rounded-full font-black">
              {likedSongs.length}
            </span>
          </div>
          <div className="max-h-[45vh] overflow-y-auto pr-1">
            <ul className="flex flex-col gap-3">
              {[...likedSongs].reverse().map((s, i) => (
                <li key={i} className="flex gap-3 items-center p-2 rounded-xl bg-neutral-800/30">
                  <img
                    src={s.imgUrl}
                    className="w-8 h-8 rounded-md object-cover opacity-80"
                    alt=""
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-indigo-300 truncate">{s.trackName}</p>
                    <p className="text-[9px] text-gray-500 truncate">{s.artistName}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-neutral-800 text-center">
            <button
              onClick={() => setPhase("result")}
              className="text-xs font-black text-indigo-500 hover:text-indigo-300"
            >
              여기 클릭하면 결과보기 🏁
            </button>
          </div>
        </aside>
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
