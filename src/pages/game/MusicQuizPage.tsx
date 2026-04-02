import { useEffect, useState } from "react";
import api from "../../api/axios";
import { usePlayer } from "../../contexts/PlayerContext";
import type { Song } from "../../components/ui/SongListItem";
import GameResult from "../../components/ui/GameResult";
import GameCountdown from "../../components/ui/GameCountdown";

const TOTAL = 10;

type Phase = "playing" | "result";

const MusicQuizPage = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [correctSongIds, setCorrectSongIds] = useState<Set<number>>(new Set());
  const [wrongSongIds, setWrongSongIds] = useState<Set<number>>(new Set());
  const [started, setStarted] = useState(false);
  const [timer, setTimer] = useState(0);

  const { play, stop } = usePlayer();

  const loadSongs = async () => {
    setIsLoading(true);
    const results: Song[] = [];
    const promises = Array.from({ length: TOTAL }, () =>
      api.get("/api/random").then((res) => results.push(res.data))
    );
    await Promise.all(promises);
    setSongs(results);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  // ✅ 페이지 이탈 시 플레이어 종료
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const currentSong = songs[currentIndex];

  // ✅ 첫 곡 버그 수정: songs 배열이 실제로 채워진 뒤에만 play 호출
  useEffect(() => {
    if (!started || isLoading || songs.length === 0 || phase !== "playing") return;

    const song = songs[currentIndex];
    if (!song) return;

    if (!feedback) {
      play(song, { blind: true, onClose: handleSkip });
    } else {
      stop();
    }
  }, [currentIndex, feedback, phase, started, songs]);

  const normalize = (str: string) => str.toLowerCase().replace(/\s/g, "");

  const handleSubmit = () => {
    if (!currentSong || !input.trim()) return;

    const answer = normalize(currentSong.trackName);
    const userInput = normalize(input);
    const isCorrect = answer.includes(userInput) || userInput.includes(answer);

    if (isCorrect) {
      let gained = 0;
      if (timer < 10) gained = 10;
      else if (timer < 20) gained = 6;
      else gained = 3;
      setScore((prev) => prev + gained);
      setCorrectSongIds((prev) => new Set(prev).add(currentSong.id));
      setFeedback("correct");
    } else {
      setWrongSongIds((prev) => new Set(prev).add(currentSong.id));
      setFeedback("wrong");
    }

    setTimeout(() => {
      setFeedback(null);
      setInput("");
      if (currentIndex + 1 >= TOTAL) {
        setPhase("result");
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1000);
  };

  useEffect(() => {
    if (!started || isLoading || phase !== "playing") return;

    let isTransitioning = false;
    setTimer(0);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev >= 29) {
          if (!isTransitioning) {
            isTransitioning = true;
            handleSkip();
          }
          clearInterval(interval);
          return 30;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      isTransitioning = true;
      clearInterval(interval);
    };
  }, [currentIndex, songs, started, isLoading, phase]);

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleSkip = () => {
    if (!currentSong || feedback) return;
    setWrongSongIds((prev) => new Set(prev).add(currentSong.id));
    setFeedback("wrong");
    setTimeout(() => {
      setFeedback(null);
      setInput("");
      if (currentIndex + 1 >= TOTAL) {
        setPhase("result");
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 500);
  };

  const handleRestart = () => {
    setScore(0);
    setCurrentIndex(0);
    setInput("");
    setFeedback(null);
    setPhase("playing");
    setStarted(false);
    loadSongs();
    setCorrectSongIds(new Set());
    setWrongSongIds(new Set());
  };

  // ── 로딩 ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-64 text-lg font-semibold"
        style={{ color: "var(--kf-text-sub)" }}
      >
        🎵 곡 불러오는 중...
      </div>
    );
  }

  // ── 카운트다운 ─────────────────────────────────────────
  if (!started) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[80vh] px-4"
        style={{ color: "var(--kf-text-main)" }}
      >
        <div className="text-center mb-16 space-y-4">
          <div className="text-6xl mb-6 animate-bounce">🎧</div>
          <h1
            className="text-4xl font-black mb-3 tracking-tight"
            style={{ color: "var(--kf-text-main)" }}
          >
            노래 맞추기
          </h1>
          <p style={{ color: "var(--kf-text-muted)", fontSize: "14px" }}>
            음악을 듣고 제목을 맞혀보세요!
          </p>
        </div>
        <div className="w-full flex justify-center scale-110">
          <GameCountdown onStart={() => setStarted(true)} />
        </div>
      </div>
    );
  }

  // ── 결과 ──────────────────────────────────────────────
  if (phase === "result") {
    return (
      <GameResult
        songs={songs}
        score={score}
        maxScore={TOTAL * 10}
        onRestart={handleRestart}
        correctSongIds={correctSongIds}
        wrongSongIds={wrongSongIds}
        quizType="MUSIC"
      />
    );
  }

  // ── 게임 화면 ──────────────────────────────────────────
  return (
    <div className="mx-auto max-w-xl p-8" style={{ color: "var(--kf-text-main)" }}>
      {/* 진행 상황 */}
      <div className="mb-2 flex items-center justify-between">
        <span style={{ color: "var(--kf-text-muted)" }}>
          {currentIndex + 1} / {TOTAL}
        </span>
        <span className="font-semibold" style={{ color: "var(--kf-brand)" }}>
          점수: {score}
        </span>
      </div>

      {/* 타이머 */}
      <div className="mb-2 text-right">
        <span
          className="font-mono text-xl"
          style={{
            color: timer >= 25 ? "var(--kf-danger)" : "var(--kf-text-sub)",
            animation: timer >= 25 ? "pulse 1s infinite" : "none",
          }}
        >
          ⏱️ {30 - timer}s
        </span>
      </div>

      {/* 진행 바 */}
      <div className="mb-8 h-2 w-full rounded-full" style={{ background: "var(--kf-border)" }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${((currentIndex + 1) / TOTAL) * 100}%`,
            background: "linear-gradient(90deg, var(--kf-brand), var(--kf-brand-pink))",
          }}
        />
      </div>

      {/* 피드백 */}
      {feedback && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-center font-semibold text-base"
          style={
            feedback === "correct"
              ? {
                  background: "rgba(56,199,170,0.12)",
                  color: "#178f74",
                  border: "1px solid rgba(56,199,170,0.28)",
                }
              : {
                  background: "rgba(255,102,122,0.10)",
                  color: "var(--kf-danger)",
                  border: "1px solid rgba(255,102,122,0.24)",
                }
          }
        >
          {feedback === "correct"
            ? `정답! 🎉 "${currentSong?.trackName}"`
            : `틀렸어요 😢 정답: "${currentSong?.trackName}"`}
        </div>
      )}

      {/* 입력창 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          autoFocus
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="곡 제목을 입력하세요..."
          disabled={!!feedback}
          className="flex-1 px-4 py-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.84)",
            border: "1px solid var(--kf-border)",
            color: "var(--kf-text-main)",
            outline: "none",
            opacity: feedback ? 0.5 : 1,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!!feedback}
          className="px-5 py-3 rounded-xl font-semibold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
            boxShadow: "0 8px 20px rgba(109,94,252,0.24)",
            opacity: feedback ? 0.5 : 1,
          }}
        >
          정답
        </button>
      </div>

      {/* 힌트 */}
      <div className="mb-4 flex flex-col gap-1 text-sm" style={{ color: "var(--kf-text-muted)" }}>
        {timer >= 10 && currentSong && (
          <p>
            🎤 힌트 1: 가수는{" "}
            <span className="font-semibold" style={{ color: "var(--kf-brand)" }}>
              {currentSong.artistName}
            </span>{" "}
            입니다.
          </p>
        )}
        {timer >= 20 && currentSong && (
          <p>
            🔤 힌트 2: 제목은{" "}
            <span className="font-semibold" style={{ color: "var(--kf-brand)" }}>
              {currentSong.trackName.length}글자
            </span>{" "}
            입니다.
          </p>
        )}
      </div>

      {/* 스킵 */}
      <button
        onClick={handleSkip}
        disabled={!!feedback}
        className="text-sm transition-colors"
        style={{
          color: "var(--kf-text-muted)",
          opacity: feedback ? 0.5 : 1,
        }}
      >
        모르겠어요 → 넘기기
      </button>
    </div>
  );
};

export default MusicQuizPage;
