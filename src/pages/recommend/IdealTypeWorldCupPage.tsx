import { useState, useRef, useCallback, useEffect } from "react";
import "../../styles/IdealTypeWorldCupPage.css";
import { playlistApi } from "../../api/playlistApi";
import type {
  SongDTO,
  Song,
  Screen,
  AudioState,
  SongCardProps,
} from "../../types/idealtypeworldcup";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================
// NORMALIZER — SongDTO → Song
// ※ Spotify API 교체 시 이 함수와 SongDTO 타입만 수정하면 됨
// ============================================================
function normalizeSongDTO(dto: SongDTO): Song {
  return {
    id: dto.id,
    title: dto.trackName, // 백엔드 trackName → 프론트 title
    artist: dto.artistName, // 백엔드 artistName → 프론트 artist
    genre: dto.genreName ?? "Unknown", // null이면 "Unknown" 대체
    coverUrl: dto.imgUrl ?? null, // 백엔드 imgUrl → 프론트 coverUrl
    previewUrl: dto.previewUrl ?? null,
  };
}

// ============================================================
// API — /api/randoms?limit=N
// DB에서 랜덤으로 N곡을 가져와 Song[] 반환
// ============================================================
async function fetchRandomSongs(count: number): Promise<Song[]> {
  const res = await fetch(`${BASE_URL}/api/randoms?limit=${count}`);
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  const data: SongDTO[] = await res.json();
  if (data.length < count)
    throw new Error(`곡이 부족합니다. (DB 보유: ${data.length} / 필요: ${count})`);
  return data.map(normalizeSongDTO);
}

// 배열 무작위 섞기 — 다음 라운드 대진 랜덤 배치용
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 라운드 참가 곡 수 → 라운드 이름 반환 (예: 16 → "16강")
function getRoundLabel(n: number): string {
  const map: Record<number, string> = {
    2: "결승전",
    4: "준결승",
    8: "8강",
    16: "16강",
    32: "32강",
    64: "64강",
  };
  return map[n] ?? `${n}강`;
}

// ============================================================
// AUDIO HOOK — iTunes 30초 미리듣기 오디오 상태 관리
// ============================================================
function useAudio(): AudioState {
  // 실제 오디오 객체 — 변경해도 리렌더 불필요하므로 useRef 사용
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 현재 재생 중인 곡의 id (null이면 미재생)
  const [playing, setPlaying] = useState<number | null>(null);
  // 곡별 재생 진행률 { [songId]: 0~100 } — 일시정지 후 이어듣기를 위해 곡마다 저장
  const [progress, setProgress] = useState<Record<number, number>>({});
  // 곡별 재생 위치(초) — 이어듣기 시 audio.currentTime 복원용 (리렌더 불필요 → useRef)
  const currentTimeRef = useRef<Record<number, number>>({});

  const play = useCallback(
    (song: Song) => {
      if (!song.previewUrl) return;

      // 같은 곡을 다시 누르면 일시정지 (currentTimeRef에 위치 이미 저장됨)
      if (playing === song.id) {
        audioRef.current?.pause();
        audioRef.current = null;
        setPlaying(null);
        return;
      }

      // 다른 곡이 재생 중이면 먼저 정지
      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(song.previewUrl);
      audio.volume = 0.7;

      // 이전에 재생한 적 있으면 저장된 위치부터 이어서 재생
      if (currentTimeRef.current[song.id]) {
        audio.currentTime = currentTimeRef.current[song.id];
      }

      audioRef.current = audio;
      setPlaying(song.id);
      audio.play().catch(() => {}); // 브라우저 자동재생 정책 에러 무시

      // 약 250ms마다 호출 → 진행률 업데이트 + 현재 위치 저장
      audio.ontimeupdate = () => {
        const pct = (audio.currentTime / audio.duration) * 100 || 0;
        currentTimeRef.current[song.id] = audio.currentTime;
        setProgress((p) => ({ ...p, [song.id]: pct }));
      };

      // 재생 완료 시 해당 곡 진행률 및 저장 위치 초기화
      audio.onended = () => {
        setPlaying(null);
        setProgress((p) => ({ ...p, [song.id]: 0 }));
        delete currentTimeRef.current[song.id];
      };
    },
    [playing]
  );

  // 곡 선택 또는 라운드 전환 시 호출 — 오디오 즉시 정지 + 전체 초기화
  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
    setProgress({});
    currentTimeRef.current = {}; // 다음 라운드에서는 처음부터 재생
  }, []);

  // 컴포넌트 언마운트 시 오디오 정지 (페이지 이탈 후 재생 방지)
  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    []
  );

  return { playing, progress, play, stop };
}

// ============================================================
// SONG CARD — 개별 노래 카드 컴포넌트
// ============================================================
function SongCard({ song, onChoose, isChosen, isLoser, audio }: SongCardProps) {
  const [imgError, setImgError] = useState(false); // 앨범 커버 로드 실패 여부
  const isPlaying = audio.playing === song.id; // 이 카드가 현재 재생 중인지
  const disabled = isChosen || isLoser; // 선택됐거나 탈락이면 상호작용 불가

  // 상태에 따른 카드 클래스 조합
  const cardClass = ["wc-card", isChosen ? "wc-card--chosen" : "", isLoser ? "wc-card--loser" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      {/* 앨범 커버 영역 */}
      <div className="wc-card-art">
        {/* 커버 이미지 — 로드 실패 시 fallback */}
        {!imgError && song.coverUrl ? (
          <img
            className="wc-card-img"
            src={song.coverUrl}
            alt={song.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="wc-card-img-fallback">
            <span className="wc-card-img-fallback-icon">♪</span>
            <span className="wc-card-img-fallback-genre">{song.genre}</span>
          </div>
        )}

        {/* 텍스트 가독성을 위한 하단 그라디언트 오버레이 */}
        <div className="wc-card-overlay" />

        {/* 선택된 카드에만 표시 */}
        {isChosen && <div className="wc-card-chosen-badge">✓ 선택</div>}

        {/* 미리듣기 버튼 — 탈락/선택 카드에는 미표시 */}
        {!isLoser && song.previewUrl && !isChosen && (
          <button
            className={`wc-card-play-btn${isPlaying ? " wc-card-play-btn--playing" : ""}`}
            onClick={(e) => {
              e.stopPropagation(); // 이 곡 선택 버튼으로 이벤트 전파 방지
              audio.play(song);
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        )}

        {/* 재생 중일 때만 표시되는 진행 바 */}
        {isPlaying && (
          <div className="wc-card-audio-progress">
            <div
              className="wc-card-audio-progress-fill"
              style={{ width: `${audio.progress[song.id] ?? 0}%` }}
            />
          </div>
        )}
      </div>

      {/* 곡 정보 */}
      <div className="wc-card-info">
        <div className="wc-card-title">{song.title}</div>
        <div className="wc-card-artist">{song.artist}</div>
        <div className="wc-card-footer">
          <span className="wc-card-genre-badge">{song.genre}</span>
          {song.previewUrl && <span className="wc-card-preview-label">♪ 미리듣기</span>}
        </div>
      </div>

      {/* 이 곡 선택 버튼 — 호버 시 표시, disabled 시 미표시 */}
      {!disabled && (
        <button
          className="wc-choose-cta"
          onClick={(e) => {
            e.stopPropagation();
            onChoose(song);
          }}
        >
          <span className="wc-choose-cta-text">이 곡 선택</span>
        </button>
      )}
    </div>
  );
}

// ============================================================
// PLAYLIST MODAL — 플레이리스트 선택 및 중복 확인 모달
// 2단계: select(플레이리스트 선택) → confirm(중복 곡 확인)
// ============================================================
interface Playlist {
  id: number;
  title: string;
  imageUrl?: string;
}

interface PlaylistModalProps {
  selectedSongs: Song[]; // 추가할 곡 목록
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = "select" | "confirm";

function PlaylistModal({ selectedSongs, onClose, onSuccess }: PlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [step, setStep] = useState<ModalStep>("select");
  const [duplicateSongs, setDuplicateSongs] = useState<Song[]>([]); // 이미 플레이리스트에 있는 곡
  const [toAddSongs, setToAddSongs] = useState<Song[]>([]); // 실제 추가할 곡 (중복 제외)
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false); // 중복 확인 중
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 열릴 때 플레이리스트 목록 조회
  useEffect(() => {
    playlistApi
      .getAllPlaylist()
      .then((res) => {
        console.log("플레이리스트 데이터 확인:", res.data); // ← 여기 추가
        setPlaylists(res.data);
      })
      .catch(() => setError("플레이리스트를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // STEP 1: 추가하기 클릭 → 기존 곡 목록 조회 후 중복 여부 확인
  const handleCheck = async () => {
    if (!selectedPlaylistId) return;
    setChecking(true);
    setError(null);
    try {
      const res = await playlistApi.getPlaylistSongs(selectedPlaylistId);
      const existingIds = new Set<number>(res.data.map((s: Song) => s.id));

      const dupes = selectedSongs.filter((s) => existingIds.has(s.id));
      const fresh = selectedSongs.filter((s) => !existingIds.has(s.id));

      if (dupes.length === 0) {
        // 중복 없으면 바로 추가
        await doAdd(fresh);
      } else {
        // 중복 있으면 확인 단계로 이동
        setDuplicateSongs(dupes);
        setToAddSongs(fresh);
        setStep("confirm");
      }
    } catch {
      setError("확인 중 오류가 발생했습니다.");
    } finally {
      setChecking(false);
    }
  };

  // STEP 2: 중복 제외한 곡들 플레이리스트에 추가
  const doAdd = async (songs: Song[]) => {
    if (songs.length === 0) {
      setError("추가 가능한 곡이 없습니다.");
      setStep("select");
      return;
    }
    setAdding(true);
    try {
      await Promise.all(
        songs.map((song) => playlistApi.addSongToPlaylist(selectedPlaylistId!, song.id))
      );
      onSuccess();
    } catch {
      setError("추가 중 오류가 발생했습니다.");
      setAdding(false);
    }
  };

  return (
    <div className="wc-modal-backdrop" onClick={onClose}>
      <div className="wc-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── STEP 1: 플레이리스트 선택 ── */}
        {step === "select" && (
          <>
            <div className="wc-modal-header">
              <div>
                <span className="wc-modal-title">플레이리스트 선택</span>
                <span className="wc-modal-subtitle">{selectedSongs.length}곡 추가</span>
              </div>
              <button className="wc-modal-close" onClick={onClose}>
                ✕
              </button>
            </div>

            {loading && <p className="wc-modal-loading">불러오는 중...</p>}
            {!loading && playlists.length === 0 && (
              <p className="wc-modal-empty">플레이리스트가 없습니다.</p>
            )}

            <ul className="wc-modal-list">
              {playlists.map((pl) => (
                <li
                  key={pl.id}
                  className={`wc-modal-item${selectedPlaylistId === pl.id ? " wc-modal-item--selected" : ""}`}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                >
                  {pl.imageUrl ? (
                    <img
                      className="wc-modal-thumb"
                      src={`${BASE_URL}${pl.imageUrl}`}
                      alt={pl.title}
                    />
                  ) : (
                    <div className="wc-modal-thumb wc-modal-thumb--fallback">♪</div>
                  )}
                  <span className="wc-modal-playlist-title">{pl.title}</span>
                  {/* 선택된 플레이리스트에 체크 표시 */}
                  {selectedPlaylistId === pl.id && <span className="wc-modal-check">✓</span>}
                </li>
              ))}
            </ul>

            {error && <p className="wc-modal-error">⚠️ {error}</p>}

            <div className="wc-modal-actions">
              <button className="wc-modal-btn-cancel" onClick={onClose}>
                취소
              </button>
              <button
                className="wc-modal-btn-add"
                onClick={handleCheck}
                disabled={!selectedPlaylistId || checking}
              >
                {checking ? "확인 중..." : "추가하기"}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: 중복 곡 확인 ── */}
        {step === "confirm" && (
          <>
            <div className="wc-modal-header">
              <div>
                <span className="wc-modal-title">중복 곡 확인</span>
                <span className="wc-modal-subtitle">이미 플레이리스트에 있습니다</span>
              </div>
              <button className="wc-modal-close" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* 중복 곡 목록 */}
            <ul className="wc-modal-list">
              {duplicateSongs.map((song) => (
                <li key={song.id} className="wc-modal-item wc-modal-item--duplicate">
                  {song.coverUrl ? (
                    <img className="wc-modal-thumb" src={song.coverUrl} alt={song.title} />
                  ) : (
                    <div className="wc-modal-thumb wc-modal-thumb--fallback">♪</div>
                  )}
                  <div className="wc-modal-song-info">
                    <span className="wc-modal-playlist-title">{song.title}</span>
                    <span className="wc-modal-song-artist">{song.artist}</span>
                  </div>
                  <span className="wc-modal-duplicate-badge">중복</span>
                </li>
              ))}
            </ul>

            {/* 중복 제외 후 추가 가능한 곡 수 안내 */}
            <p className="wc-modal-confirm-desc">
              {toAddSongs.length > 0
                ? `중복 ${duplicateSongs.length}곡을 제외하고 ${toAddSongs.length}곡을 추가합니다.`
                : "선택한 곡이 모두 이미 플레이리스트에 있습니다."}
            </p>

            {error && <p className="wc-modal-error">⚠️ {error}</p>}

            <div className="wc-modal-actions">
              {/* 뒤로가기 — 플레이리스트 재선택 가능 */}
              <button className="wc-modal-btn-cancel" onClick={() => setStep("select")}>
                뒤로
              </button>
              {toAddSongs.length > 0 && (
                <button
                  className="wc-modal-btn-add"
                  onClick={() => doAdd(toAddSongs)}
                  disabled={adding}
                >
                  {adding ? "추가 중..." : `${toAddSongs.length}곡 추가`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PAGE COMPONENT — 게임 전체 상태 및 흐름 관리
// ============================================================
const ROUND_SIZES = [8, 16, 32, 64] as const;

export default function IdealTypeWorldCupPage() {
  const [screen, setScreen] = useState<Screen>("start");
  const [bracket, setBracket] = useState<[Song, Song][]>([]); // 현재 라운드 대진표 [[곡A, 곡B], ...]
  const [matchIdx, setMatchIdx] = useState(0); // 현재 진행 중인 매치 인덱스
  const [roundWinners, setRoundWinners] = useState<Song[]>([]); // 이번 라운드 승자 목록
  const [chosen, setChosen] = useState<Song | null>(null); // 방금 선택한 곡 (선택 애니메이션용)
  const [champion, setChampion] = useState<Song | null>(null); // 최종 우승곡
  const [allSongs, setAllSongs] = useState<Song[]>([]); // 전체 참가곡 — winList 생성 시 사용
  const [wins, setWins] = useState<Record<number, number>>({}); // 곡별 승리 횟수 { [songId]: count }
  const [winList, setWinList] = useState<{ song: Song; count: number }[]>([]); // 승리 횟수 내림차순 정렬
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 플레이리스트 추가 관련 상태
  const [checkedSongIds, setCheckedSongIds] = useState<Set<number>>(new Set()); // 체크된 곡 id Set
  const [showModal, setShowModal] = useState(false); // 플레이리스트 모달 표시 여부
  const [addSuccess, setAddSuccess] = useState(false); // 추가 성공 메시지 표시 여부

  const audio = useAudio();

  // 파생 상태 — bracket 기반으로 매 렌더마다 계산
  const currentMatch = bracket[matchIdx] ?? null;
  const currentRoundSize = bracket.length * 2; // 현재 강 수
  const totalInRound = bracket.length; // 이번 라운드 총 매치 수
  const progressPct = totalInRound > 0 ? (matchIdx / totalInRound) * 100 : 0; // 진행률 0~100

  // 게임 시작 — API 호출 후 대진표 생성 및 상태 초기화
  const startGame = useCallback(
    async (size: number) => {
      audio.stop();
      setLoading(true);
      setError(null);
      try {
        const songs = await fetchRandomSongs(size);

        // songs 배열을 2개씩 묶어 대진표 생성 (예: [A,B,C,D] → [[A,B],[C,D]])
        const pairs: [Song, Song][] = [];
        for (let i = 0; i < songs.length; i += 2) {
          pairs.push([songs[i], songs[i + 1]]);
        }

        setBracket(pairs);
        setMatchIdx(0);
        setRoundWinners([]);
        setChosen(null);
        setChampion(null);
        setAllSongs(songs);
        setWins({});
        setWinList([]);
        setCheckedSongIds(new Set());
        setAddSuccess(false);
        setScreen("game");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [audio]
  );

  // 곡 선택 처리 — 다음 매치 / 다음 라운드 / 결과 화면 중 하나로 전환
  const handleChoose = useCallback(
    (song: Song) => {
      if (chosen) return; // 이미 선택 애니메이션 중이면 중복 처리 방지
      audio.stop();
      setChosen(song); // 선택 애니메이션 시작 (900ms)

      setTimeout(() => {
        const newWinners = [...roundWinners, song];
        const nextIdx = matchIdx + 1;
        const newWins = { ...wins, [song.id]: (wins[song.id] ?? 0) + 1 }; // 승리 횟수 +1
        setWins(newWins);

        if (nextIdx < bracket.length) {
          // 케이스 1: 이번 라운드에 매치가 남아있음 → 다음 매치
          setRoundWinners(newWinners);
          setMatchIdx(nextIdx);
          setChosen(null);
        } else if (newWinners.length === 1) {
          // 케이스 2: 결승 종료 → 우승 확정, winList 정렬
          const sortedWinList = allSongs
            .map((s) => ({ song: s, count: newWins[s.id] ?? 0 }))
            .filter((item) => item.count > 0) // 1승 이상만
            .sort((a, b) => b.count - a.count); // 승리 횟수 내림차순
          setWinList(sortedWinList);
          setChampion(newWinners[0]);
          setScreen("result");
        } else {
          // 케이스 3: 라운드 종료, 다음 라운드 대진표 생성 (순서 셔플로 대진 랜덤화)
          const shuffled = shuffle(newWinners);
          const pairs: [Song, Song][] = [];
          for (let i = 0; i < shuffled.length; i += 2) {
            pairs.push([shuffled[i], shuffled[i + 1]]);
          }
          setBracket(pairs);
          setMatchIdx(0);
          setRoundWinners([]);
          setChosen(null);
        }
      }, 900);
    },
    [chosen, roundWinners, matchIdx, bracket, wins, allSongs, audio]
  );

  // 승리 기록 아이템 체크박스 토글
  const toggleCheck = (songId: number) => {
    setCheckedSongIds((prev) => {
      const next = new Set(prev);
      next.has(songId) ? next.delete(songId) : next.add(songId);
      return next;
    });
  };

  // 전체 선택 / 전체 해제
  const toggleAll = () => {
    if (checkedSongIds.size === winList.length) {
      setCheckedSongIds(new Set());
    } else {
      setCheckedSongIds(new Set(winList.map((item) => item.song.id)));
    }
  };

  // 체크된 id에 해당하는 Song 목록 — 모달에 전달
  const checkedSongs = winList
    .filter((item) => checkedSongIds.has(item.song.id))
    .map((item) => item.song);

  return (
    <div className="wc-page">
      <div className="wc-inner">
        {/* ━━━━━━━━━━━━━━ START — 강 수 선택 화면 ━━━━━━━━━━━━━━ */}
        {screen === "start" && (
          <div className="wc-start">
            <p className="wc-start-eyebrow">Music World Cup</p>
            <h1 className="wc-start-title">
              노래
              <br />
              이상형
              <br />
              월드컵
            </h1>
            <p className="wc-start-desc">
              DB에서 랜덤으로 곡을 선발해 토너먼트를 진행합니다
              <br />
              <span>♪ 30초 미리듣기 지원</span>
            </p>

            {error && <div className="wc-error">⚠️ {error}</div>}

            <p className="wc-size-label">선택 시 바로 시작</p>
            <div className="wc-size-grid">
              {ROUND_SIZES.map((n) => (
                <button
                  key={n}
                  className="wc-size-btn"
                  onClick={() => startGame(n)}
                  disabled={loading}
                >
                  {n}
                  <span className="wc-size-btn-unit">강</span>
                  <span className="wc-size-btn-count">{n}곡</span>
                </button>
              ))}
            </div>

            {loading && (
              <div className="wc-loading">
                <div className="wc-spinner" />
                DB에서 곡 불러오는 중...
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━ GAME — 토너먼트 진행 화면 ━━━━━━━━━━━━━━ */}
        {/* currentMatch가 null이면 렌더링 안 함 (안전 처리) */}
        {screen === "game" && currentMatch && (
          <div className="wc-game">
            {/* 라운드 헤더 */}
            <div className="wc-round-header">
              <div className="wc-round-title">{getRoundLabel(currentRoundSize)}</div>
              <div className="wc-round-meta">
                {matchIdx + 1} / {totalInRound} 매치
                <span className="wc-round-meta-divider">|</span>
                {totalInRound - matchIdx - 1}경기 남음
              </div>
              {/* 라운드 내 진행률 바 */}
              <div className="wc-progress-track">
                <div className="wc-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* VS 대결 레이아웃 */}
            <div className="wc-vs-grid">
              <div className="wc-card-wrap">
                <SongCard
                  song={currentMatch[0]}
                  onChoose={handleChoose}
                  isChosen={chosen?.id === currentMatch[0].id} // 이 카드가 선택됐는지
                  isLoser={!!chosen && chosen.id !== currentMatch[0].id} // 상대가 선택됐으면 탈락
                  audio={audio}
                />
              </div>
              <div className="wc-vs-label">VS</div>
              <div className="wc-card-wrap">
                <SongCard
                  song={currentMatch[1]}
                  onChoose={handleChoose}
                  isChosen={chosen?.id === currentMatch[1].id}
                  isLoser={!!chosen && chosen.id !== currentMatch[1].id}
                  audio={audio}
                />
              </div>
            </div>

            <p className="wc-game-hint">▶ : 30초 미리듣기</p>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━ RESULT — 최종 결과 화면 ━━━━━━━━━━━━━━ */}
        {screen === "result" && champion && (
          <div className="wc-result">
            <p className="wc-result-eyebrow">🏆 최종 우승</p>

            {/* 우승곡 앨범 커버 + 펄스 링 애니메이션 */}
            <div className="wc-result-art-wrap">
              <div className="wc-result-pulse-ring wc-result-pulse-ring--1" />
              <div className="wc-result-pulse-ring wc-result-pulse-ring--2" />
              {champion.coverUrl ? (
                <img className="wc-result-cover" src={champion.coverUrl} alt={champion.title} />
              ) : (
                <div className="wc-result-cover-fallback">♪</div>
              )}
            </div>

            {/* 우승곡 정보 */}
            <div className="wc-result-title">{champion.title}</div>
            <div className="wc-result-artist">{champion.artist}</div>
            <div className="wc-result-genre">{champion.genre}</div>

            {/* 우승곡 미리듣기 — previewUrl 있을 때만 표시 */}
            {champion.previewUrl && (
              <div className="wc-result-preview">
                <button
                  className={`wc-result-preview-btn${audio.playing === champion.id ? " wc-result-preview-btn--playing" : ""}`}
                  onClick={() => audio.play(champion)}
                >
                  {audio.playing === champion.id ? "⏸ 일시정지" : "▶ 우승곡 듣기"}
                </button>
                {/* 재생 중일 때만 진행 바 표시 */}
                {audio.playing === champion.id && (
                  <div className="wc-result-preview-progress">
                    <div
                      className="wc-result-preview-progress-fill"
                      style={{ width: `${audio.progress[champion.id] ?? 0}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 다시하기 → start 화면으로 이동 */}
            <div className="wc-result-actions">
              <button
                className="wc-btn-restart"
                onClick={() => {
                  audio.stop();
                  setScreen("start");
                }}
              >
                다시 하기
              </button>
            </div>

            {/* 승리 기록 — 1승 이상 곡, 승리 횟수 내림차순 */}
            {winList.length > 0 && (
              <div className="wc-win-list">
                <div className="wc-win-list-header">
                  <p className="wc-win-list-title">승리 기록</p>
                  <div className="wc-win-list-actions">
                    <button className="wc-win-select-all" onClick={toggleAll}>
                      {checkedSongIds.size === winList.length ? "전체 해제" : "전체 선택"}
                    </button>
                    {/* 1개 이상 체크됐을 때만 추가 버튼 표시 */}
                    {checkedSongIds.size > 0 && (
                      <button
                        className="wc-win-add-btn"
                        onClick={() => {
                          setAddSuccess(false);
                          setShowModal(true);
                        }}
                      >
                        + 플레이리스트 추가 ({checkedSongIds.size})
                      </button>
                    )}
                  </div>
                </div>

                {/* 추가 성공 메시지 */}
                {addSuccess && (
                  <p className="wc-win-add-success">✓ 플레이리스트에 추가되었습니다</p>
                )}

                <ul className="wc-win-list-items">
                  {(() => {
                    // 동순위 처리 — 같은 승수면 같은 순위, 다르면 이전 순위 + 1
                    // 예: [3승, 2승, 2승, 1승] → [1, 2, 2, 3]
                    const ranks = winList.reduce<number[]>((acc, item, idx) => {
                      if (idx === 0) return [1];
                      const prev = acc[idx - 1];
                      return [...acc, item.count === winList[idx - 1].count ? prev : prev + 1];
                    }, []);
                    return winList.map((item, idx) => {
                      const rank = ranks[idx];
                      const isChecked = checkedSongIds.has(item.song.id);
                      return (
                        <li
                          key={item.song.id}
                          className={[
                            "wc-win-item",
                            rank <= 3 ? `wc-win-item--rank${rank}` : "",
                            isChecked ? "wc-win-item--checked" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => toggleCheck(item.song.id)}
                        >
                          <div
                            className={`wc-win-checkbox${isChecked ? " wc-win-checkbox--checked" : ""}`}
                          >
                            {isChecked && "✓"}
                          </div>
                          <span className="wc-win-rank">{rank}</span>
                          {item.song.coverUrl ? (
                            <img
                              className="wc-win-thumb"
                              src={item.song.coverUrl}
                              alt={item.song.title}
                            />
                          ) : (
                            <div className="wc-win-thumb wc-win-thumb--fallback">♪</div>
                          )}
                          <div className="wc-win-info">
                            <span className="wc-win-title">{item.song.title}</span>
                            <span className="wc-win-artist">{item.song.artist}</span>
                          </div>
                          <span className="wc-win-count">{item.count}승</span>
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 플레이리스트 선택 모달 */}
      {showModal && (
        <PlaylistModal
          selectedSongs={checkedSongs}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setCheckedSongIds(new Set());
            setAddSuccess(true);
          }}
        />
      )}
    </div>
  );
}
