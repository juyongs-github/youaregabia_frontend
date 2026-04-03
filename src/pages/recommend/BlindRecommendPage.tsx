import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import api from "../../api/axios";
import { playlistApi } from "../../api/playlistApi";
import { usePlayer } from "../../contexts/PlayerContext";
import PlaylistCreateModal from "../../components/ui/PlaylistCreateModal";
import type { Song } from "../../components/ui/SongListItem";
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
  // 기존 state에 드롭다운 open 상태 추가
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const currentSong = songs[currentIndex];
  const { play, stop } = usePlayer();

  // 페이지를 아예 벗어날 때(Unmount) 음악 정지
  useEffect(() => {
    return () => {
      stop(); // 컴포넌트가 화면에서 사라질 때 플레이어 정지
    };
  }, [stop]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentSong && !isRevealed && phase === "playing" && started) {
      play(currentSong, { blind: true, onClose: handleDislike });
    }

    // 이 effect가 다시 실행되거나(currentIndex 변경 등)
    // 조건이 안 맞을 때 이전 곡을 정지
    return () => {
      stop();
    };
  }, [currentIndex, isRevealed, phase, started]);

  // ========================================================
  // 조건부 렌더링 (순서가 매우 중요합니다)
  // ========================================================

  // 1. 결과 화면
  if (phase === "result") {
    return (
      <div className="flex flex-col items-center gap-6 py-12 mx-auto max-w-2xl px-8 animate-in fade-in duration-500">
        <div className="bg-white/70 backdrop-blur-[24px] border border-white/80 shadow-2xl rounded-[32px] p-10 w-full flex flex-col items-center">
          <h2 className="text-4xl font-black tracking-tight text-[#2f3863] mb-2">추천 완료!</h2>
          <p className="text-slate-500 font-medium mb-8">
            총 {likedSongs.length}곡의 취향을 발견했습니다.
          </p>
          <button
            onClick={handleRestart}
            className="w-full max-w-xs rounded-full bg-gradient-to-r from-[#6d5efc] to-[#ff5ca8] px-10 py-4 font-extrabold text-white shadow-xl hover:scale-[1.02] transition-all"
          >
            다시 시작하기
          </button>
          {likedSongs.length > 0 && (
            <div className="w-full mt-10">
              <h3 className="text-lg font-extrabold mb-6 text-[#2f3863] border-b border-slate-200/60 pb-3">
                나의 선택 목록
              </h3>
              {userEmail && (
                <div className="mb-6 space-y-3">
                  {userEmail && (
                    <div className="flex flex-col items-end gap-2">
                      {/* 커스텀 드롭다운 */}
                      <div ref={dropdownRef} className="relative w-full md:w-56">
                        <button
                          type="button"
                          onClick={() => {
                            fetchPlaylists();
                            setIsDropdownOpen((prev) => !prev);
                          }}
                          className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-[#2f3863] font-bold text-xs outline-none focus:ring-2 focus:ring-[#6d5efc]/20 shadow-sm transition-all"
                        >
                          <span className="truncate max-w-[160px]">
                            {selectedPlaylistId
                              ? (playlists.find((pl) => pl.id === selectedPlaylistId)?.title ??
                                "플레이리스트 선택")
                              : "플레이리스트 선택"}
                          </span>
                          <svg
                            className={`ml-2 flex-shrink-0 w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isDropdownOpen && (
                          <ul className="absolute right-0 z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto max-h-44 py-1">
                            <li
                              onClick={() => {
                                setSelectedPlaylistId(null);
                                setIsDropdownOpen(false);
                              }}
                              className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer"
                            >
                              선택 안함
                            </li>
                            {playlists.map((pl) => (
                              <li
                                key={pl.id}
                                onClick={() => {
                                  setSelectedPlaylistId(pl.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`px-4 py-2 text-xs font-bold cursor-pointer truncate transition-colors ${
                                  selectedPlaylistId === pl.id
                                    ? "bg-[#6d5efc]/10 text-[#6d5efc]"
                                    : "text-[#2f3863] hover:bg-slate-50"
                                }`}
                                title={pl.title}
                              >
                                {pl.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-xs font-black text-[#6d5efc] hover:underline"
                      >
                        + 새 플레이리스트
                      </button>
                    </div>
                  )}
                </div>
              )}
              <ul className="flex flex-col gap-3">
                {likedSongs.map((song) => (
                  <li
                    key={song.id}
                    className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/40 px-4 py-3 hover:bg-white/60 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={song.imgUrl}
                        className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                        alt=""
                      />
                      <div className="min-w-0">
                        <p className="font-extrabold text-[#2f3863] text-base truncate w-44">
                          {song.trackName}
                        </p>
                        <p className="text-xs text-slate-400 font-bold">{song.artistName}</p>
                      </div>
                    </div>
                    {userEmail && selectedPlaylistId && (
                      <button
                        onClick={() => handleAddSong(song.id)}
                        className={`rounded-full px-5 py-2 text-xs font-black transition-all ${
                          addedSongIds.has(song.id) || playlistSongIds.has(song.id)
                            ? "bg-slate-100 text-slate-400 cursor-default"
                            : "bg-[#6d5efc] text-white hover:shadow-lg active:scale-95"
                        }`}
                      >
                        {addedSongIds.has(song.id) || playlistSongIds.has(song.id)
                          ? "✓ 추가됨"
                          : "+ 추가"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
      <div className="flex flex-col items-center justify-center min-h-[90vh] gap-12 px-4 animate-in fade-in duration-700">
        <div className="text-center space-y-4">
          <div className="text-7xl mb-6 drop-shadow-xl animate-bounce">🎧</div>
          <h1 className="text-5xl font-black tracking-tighter text-[#2f3863]">블라인드 추천</h1>
          <p className="text-slate-500 font-bold text-base max-w-xs mx-auto leading-relaxed">
            곡 정보 없이 오직 소리만 듣고 <br /> 마음에 드는 곡을 골라보세요.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {(["infinite", 5, 10] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleStart(mode)}
              className="group relative flex items-center justify-between rounded-[28px] px-8 py-6 bg-white/70 backdrop-blur-md border border-white hover:border-[#6d5efc]/30 hover:bg-white/90 shadow-lg hover:shadow-2xl transition-all active:scale-[0.98]"
            >
              <div className="text-left">
                <p className="font-black text-xl text-[#2f3863] group-hover:text-[#6d5efc] transition-colors">
                  {mode === "infinite" ? "무한 모드" : `${mode}곡 모드`}
                </p>
                <p className="text-sm font-bold text-slate-400 mt-1">
                  {mode === "infinite" ? "끝없이 새로운 취향 발견" : `${mode}곡의 큐레이션`}
                </p>
              </div>
              <span className="text-3xl">
                {mode === "infinite" ? "♾️" : mode === 5 ? "🎯" : "🔥"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 3. 카운트다운 화면
  if (phase === "playing" && !started && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] animate-in fade-in duration-500">
        <div className="mb-10 text-center bg-white/50 backdrop-blur-xl p-8 rounded-[40px] border border-white/80 shadow-xl">
          <div className="text-6xl mb-4">
            {totalMode === "infinite" ? "♾️" : totalMode === 5 ? "🎯" : "🔥"}
          </div>
          <h2 className="text-3xl font-black text-[#6d5efc]">
            {totalMode === "infinite" ? "무한 모드" : `${totalMode}곡 모드`}
          </h2>
          <p className="text-slate-500 font-bold mt-2">당신의 귀를 믿어보세요!</p>
        </div>
        <GameCountdown onStart={initiateGame} />
      </div>
    );
  }

  // 4. 로딩 화면
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[90vh] flex-col gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-[#6d5efc]/10 border-t-[#6d5efc] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🪄</div>
        </div>
        <p className="font-black text-[#6d5efc] animate-pulse">취향 상자 여는 중...</p>
      </div>
    );
  }

  // 5. 추천 진행 화면
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row gap-10 items-start relative min-h-[90vh]">
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center">
        <div className="w-full mb-12">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[#2f3863] font-black text-sm tracking-widest uppercase">
              Round <span className="text-[#6d5efc] text-xl ml-1">{currentIndex + 1}</span>
              <span className="text-slate-400 font-bold ml-1">
                / {totalMode === "infinite" ? "∞" : totalMode}
              </span>
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/50 border border-white/80 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6d5efc] to-[#ff5ca8] transition-all duration-700 ease-out"
              style={{
                width:
                  totalMode === "infinite"
                    ? "100%"
                    : `${((currentIndex + 1) / (totalMode as number)) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="w-full relative bg-white/70 backdrop-blur-[32px] border border-white/80 shadow-[0_32px_64px_-16px_rgba(109,94,252,0.15)] rounded-[48px] p-12 flex flex-col items-center justify-center min-h-[500px]">
          {currentSong ? (
            !isRevealed ? (
              <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-500 w-full">
                <div className="w-56 h-56 rounded-full bg-gradient-to-br from-white to-[#f0f4ff] flex items-center justify-center text-8xl shadow-lg ring-8 ring-white/50">
                  🎵
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-black text-[#2f3863] tracking-tight">
                    이 곡, 느낌이 오나요?
                  </h3>
                  <p className="text-slate-400 font-bold text-base">
                    마음에 들면 정보를 공개할게요!
                  </p>
                </div>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={handleLike}
                    className="flex-1 rounded-[24px] bg-[#6d5efc] px-8 py-5 text-xl font-black text-white hover:bg-[#5b4df0] transition-all active:scale-95 shadow-xl shadow-[#6d5efc]/30"
                  >
                    좋아요 👍
                  </button>
                  <button
                    onClick={handleDislike}
                    className="flex-1 rounded-[24px] bg-slate-100 px-8 py-5 text-xl font-black text-slate-400 hover:bg-slate-200 transition-all active:scale-95"
                  >
                    별로에요 👎
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-6 duration-500 w-full text-center">
                <div className="relative">
                  <img
                    src={currentSong.imgUrl}
                    alt=""
                    className="w-64 h-64 rounded-[40px] shadow-2xl ring-4 ring-white"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-3 shadow-lg text-2xl">
                    ✨
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-[#2f3863] tracking-tighter">
                    {currentSong.trackName}
                  </h3>
                  <p className="text-[#ff5ca8] font-black text-xl">{currentSong.artistName}</p>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-[#6d5efc]/5 rounded-full text-[#6d5efc] text-sm font-black">
                  <div className="w-4 h-4 border-2 border-[#6d5efc] border-t-transparent rounded-full animate-spin"></div>
                  다음 곡으로 이동 중...
                </div>
              </div>
            )
          ) : (
            <p className="text-slate-400 font-black">새로운 감각을 찾는 중...</p>
          )}
        </div>
      </div>
      <aside className="w-full md:w-80 bg-white/60 backdrop-blur-2xl rounded-[40px] p-8 border border-white/80 sticky top-12 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <p className="text-base font-black text-[#2f3863]">👍 발견한 취향</p>
          <span className="bg-[#ff5ca8] text-white text-xs px-3 py-1.5 rounded-full font-black">
            {likedSongs.length}
          </span>
        </div>

        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {likedSongs.length === 0 ? (
            // ✅ 빈 상태 안내
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <span className="text-4xl">🎵</span>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                마음에 드는 곡의
                <br />
                좋아요를 눌러보세요
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {[...likedSongs].reverse().map((s, i) => (
                <li
                  key={i}
                  className="flex gap-4 items-center p-3 rounded-2xl bg-white/40 border border-white hover:bg-white/80 transition-all"
                >
                  <img
                    src={s.imgUrl}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm"
                    alt=""
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#2f3863] truncate">{s.trackName}</p>
                    <p className="text-[11px] font-bold text-slate-400 truncate">{s.artistName}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button
            onClick={() => setPhase("result")}
            className="w-full py-4 rounded-2xl bg-[#6d5efc]/10 text-[#6d5efc] font-black text-sm hover:bg-[#6d5efc] hover:text-white transition-all"
          >
            결과 페이지로 가기 🏁
          </button>
        </div>
      </aside>
    </div>
  );
};

export default BlindRecommendPage;
