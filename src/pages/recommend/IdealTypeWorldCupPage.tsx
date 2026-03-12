import { useState, useRef, useCallback, useEffect } from "react";
import "../../styles/IdealTypeWorldCupPage.css";

// ============================================================
// BASE URL — 실제 서버 주소로 교체하세요
// ============================================================
const BASE_URL = "http://localhost:8080";

// ============================================================
// TYPES — SongDTO (백엔드 builder 기준)
// ============================================================
interface SongDTO {
  id: number;
  trackName: string;
  artistName: string;
  previewUrl: string | null;
  imgUrl: string | null;
  releaseDate: string | null;
  durationMs: number | null;
  genreName: string | null;
}

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string | null;
  previewUrl: string | null;
}

type Screen = "start" | "game" | "result";

// ============================================================
// NORMALIZER — SongDTO → Song
// ============================================================
function normalizeSongDTO(dto: SongDTO): Song {
  return {
    id: dto.id,
    title: dto.trackName,
    artist: dto.artistName,
    genre: dto.genreName ?? "Unknown",
    coverUrl: dto.imgUrl ?? null,
    previewUrl: dto.previewUrl ?? null,
  };
}

// ============================================================
// API — /api/randoms?limit=N 단건 호출
// ============================================================
async function fetchRandomSongs(count: number): Promise<Song[]> {
  const res = await fetch(`${BASE_URL}/api/randoms?limit=${count}`);
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  const data: SongDTO[] = await res.json();
  if (data.length < count)
    throw new Error(`곡이 부족합니다. (DB 보유: ${data.length} / 필요: ${count})`);
  return data.map(normalizeSongDTO);
}

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

function getRoundEmoji(n: number): string {
  if (n === 2) return "🏆";
  if (n === 4) return "🔥";
  if (n === 8) return "⚔️";
  return "🎵";
}

// ============================================================
// AUDIO HOOK
// ============================================================
interface AudioState {
  playing: number | null;
  progress: Record<number, number>;
  play: (song: Song) => void;
  stop: () => void;
}

function useAudio(): AudioState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [progress, setProgress] = useState<Record<number, number>>({});

  const play = useCallback(
    (song: Song) => {
      if (!song.previewUrl) return;
      if (audioRef.current) audioRef.current.pause();
      if (playing === song.id) {
        setPlaying(null);
        return;
      }
      const audio = new Audio(song.previewUrl);
      audio.volume = 0.7;
      audioRef.current = audio;
      setPlaying(song.id);
      audio.play().catch(() => {});
      audio.ontimeupdate = () =>
        setProgress((p) => ({
          ...p,
          [song.id]: (audio.currentTime / audio.duration) * 100 || 0,
        }));
      audio.onended = () => {
        setPlaying(null);
        setProgress((p) => ({ ...p, [song.id]: 0 }));
      };
    },
    [playing]
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  }, []);

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    []
  );

  return { playing, progress, play, stop };
}

// ============================================================
// SONG CARD
// ============================================================
interface SongCardProps {
  song: Song;
  onChoose: (song: Song) => void;
  isChosen: boolean;
  isLoser: boolean;
  audio: AudioState;
}

function SongCard({ song, onChoose, isChosen, isLoser, audio }: SongCardProps) {
  const [imgError, setImgError] = useState(false);
  const isPlaying = audio.playing === song.id;
  const pct = audio.progress[song.id] ?? 0;
  const disabled = isChosen || isLoser;

  const cardClass = ["wc-card", isChosen ? "wc-card--chosen" : "", isLoser ? "wc-card--loser" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass} onClick={() => !disabled && onChoose(song)}>
      {/* Album Art */}
      <div className="wc-card-art">
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

        <div className="wc-card-overlay" />

        {isChosen && <div className="wc-card-chosen-badge">✓ 선택</div>}

        {!isLoser && song.previewUrl && !isChosen && (
          <button
            className={`wc-card-play-btn${isPlaying ? " wc-card-play-btn--playing" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              audio.play(song);
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        )}

        {isPlaying && (
          <div className="wc-card-audio-progress">
            <div className="wc-card-audio-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="wc-card-info">
        <div className="wc-card-title">{song.title}</div>
        <div className="wc-card-artist">{song.artist}</div>
        <div className="wc-card-footer">
          <span className="wc-card-genre-badge">{song.genre}</span>
          {song.previewUrl && <span className="wc-card-preview-label">♪ 미리듣기</span>}
        </div>
      </div>

      {/* Hover CTA */}
      {!disabled && (
        <div className="wc-choose-cta">
          <span className="wc-choose-cta-text">이 곡 선택</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE COMPONENT
// ============================================================
const ROUND_SIZES = [8, 16, 32, 64] as const;

export default function IdealTypeWorldCupPage() {
  const [screen, setScreen] = useState<Screen>("start");
  const [roundSize, setRoundSize] = useState<number>(16);
  const [bracket, setBracket] = useState<[Song, Song][]>([]);
  const [matchIdx, setMatchIdx] = useState(0);
  const [roundWinners, setRoundWinners] = useState<Song[]>([]);
  const [chosen, setChosen] = useState<Song | null>(null);
  const [champion, setChampion] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useAudio();

  const currentMatch = bracket[matchIdx] ?? null;
  const currentRoundSize = bracket.length * 2;
  const totalInRound = bracket.length;
  const progressPct = totalInRound > 0 ? (matchIdx / totalInRound) * 100 : 0;

  const startGame = useCallback(
    async (size: number) => {
      audio.stop();
      setLoading(true);
      setError(null);
      try {
        const songs = await fetchRandomSongs(size);
        const pairs: [Song, Song][] = [];
        for (let i = 0; i < songs.length; i += 2) {
          pairs.push([songs[i], songs[i + 1]]);
        }
        setBracket(pairs);
        setMatchIdx(0);
        setRoundWinners([]);
        setChosen(null);
        setChampion(null);
        setRoundSize(size);
        setScreen("game");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [audio]
  );

  const handleChoose = useCallback(
    (song: Song) => {
      if (chosen) return;
      audio.stop();
      setChosen(song);

      setTimeout(() => {
        const newWinners = [...roundWinners, song];
        const nextIdx = matchIdx + 1;

        if (nextIdx < bracket.length) {
          setRoundWinners(newWinners);
          setMatchIdx(nextIdx);
          setChosen(null);
        } else if (newWinners.length === 1) {
          setChampion(newWinners[0]);
          setScreen("result");
        } else {
          const pairs: [Song, Song][] = [];
          for (let i = 0; i < newWinners.length; i += 2) {
            pairs.push([newWinners[i], newWinners[i + 1]]);
          }
          setBracket(pairs);
          setMatchIdx(0);
          setRoundWinners([]);
          setChosen(null);
        }
      }, 900);
    },
    [chosen, roundWinners, matchIdx, bracket, audio]
  );

  return (
    <div className="wc-page">
      {/* Ambient blobs */}
      <div className="wc-bg-blobs">
        <div className="wc-bg-blob-left" />
        <div className="wc-bg-blob-right" />
      </div>

      <div className="wc-inner">
        {/* ━━━━━━━━━━━━━━ START ━━━━━━━━━━━━━━ */}
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
              <span>♪ iTunes 30초 미리듣기 지원</span>
            </p>

            {error && <div className="wc-error">⚠️ {error}</div>}

            <p className="wc-size-label">강 수 선택 시 바로 시작</p>

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

        {/* ━━━━━━━━━━━━━━ GAME ━━━━━━━━━━━━━━ */}
        {screen === "game" && currentMatch && (
          <div className="wc-game">
            <div className="wc-round-header">
              <div className="wc-round-title">
                <span>{getRoundEmoji(currentRoundSize)}</span>
                <span>{getRoundLabel(currentRoundSize)}</span>
              </div>
              <div className="wc-round-meta">
                {matchIdx + 1} / {totalInRound} 매치
                <span className="wc-round-meta-divider">|</span>
                {totalInRound - matchIdx - 1}경기 남음
              </div>
              <div className="wc-progress-track">
                <div className="wc-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="wc-vs-grid">
              <div className="wc-card-wrap">
                <SongCard
                  song={currentMatch[0]}
                  onChoose={handleChoose}
                  isChosen={chosen?.id === currentMatch[0].id}
                  isLoser={!!chosen && chosen.id !== currentMatch[0].id}
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

            <p className="wc-game-hint">▶ 버튼으로 30초 미리듣기 후 선택하세요</p>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━ RESULT ━━━━━━━━━━━━━━ */}
        {screen === "result" && champion && (
          <div className="wc-result">
            <p className="wc-result-eyebrow">🏆 최종 우승</p>

            <div className="wc-result-art-wrap">
              <div className="wc-result-pulse-ring wc-result-pulse-ring--1" />
              <div className="wc-result-pulse-ring wc-result-pulse-ring--2" />
              {champion.coverUrl ? (
                <img className="wc-result-cover" src={champion.coverUrl} alt={champion.title} />
              ) : (
                <div className="wc-result-cover-fallback">♪</div>
              )}
            </div>

            <div className="wc-result-title">{champion.title}</div>
            <div className="wc-result-artist">{champion.artist}</div>
            <div className="wc-result-genre">{champion.genre}</div>

            {champion.previewUrl && (
              <div className="wc-result-preview">
                <button
                  className={`wc-result-preview-btn${audio.playing === champion.id ? " wc-result-preview-btn--playing" : ""}`}
                  onClick={() => audio.play(champion)}
                >
                  {audio.playing === champion.id ? "⏸ 일시정지" : "▶ 우승곡 듣기"}
                </button>
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

            <div className="wc-result-actions">
              <button
                className="wc-btn-restart"
                onClick={() => {
                  audio.stop();
                  startGame(roundSize);
                }}
              >
                다시 하기
              </button>
              <button
                className="wc-btn-reselect"
                onClick={() => {
                  audio.stop();
                  setScreen("start");
                }}
              >
                강 선택
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
