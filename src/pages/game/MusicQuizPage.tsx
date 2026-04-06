import { useEffect, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { play, stop } = usePlayer();

  const loadSongs = async () => {
    setIsLoading(true);
    const results: Song[] = [];
    const promises = Array.from({ length: TOTAL * 3 }, () =>
      api.get("/api/random").then((res) => results.push(res.data))
    );
    await Promise.all(promises);
    const filtered = results.filter((s) => {
      const title = s.trackName.replace(/\(.*?\)|\[.*?\]/g, "").trim();
      const titleLower = s.trackName.toLowerCase();
      // 초성만으로 이루어진 곡 제외
      if (/^[ㄱ-ㅎ\s]+$/.test(title)) return false;
      // 일본어(히라가나·카타카나·한자) 포함 곡 제외
      if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(title)) return false;
      // 노래방 반주/MR/Instrumental 제외
      if (/노래방|반주|mr버전|m\/r/.test(titleLower)) return false;
      if (/\bmr\b/.test(titleLower)) return false;
      if (/instrumental/.test(titleLower)) return false;
      return true;
    });
    setSongs(filtered.slice(0, TOTAL));
    setIsLoading(false);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  //  페이지 이탈 시 플레이어 종료
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const currentSong = songs[currentIndex];

  //  첫 곡 버그 수정: songs 배열이 실제로 채워진 뒤에만 play 호출
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

  // 괄호 안 내용 제거 후 특수문자·공백 제거 + 소문자
  const normalize = (str: string) =>
    str
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/「.*?」/g, "")
      .replace(/【.*?】/g, "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^\w가-힣\u3040-\u30ff\u4e00-\u9faf]/g, "");

  // 레벤슈타인 거리
  const levenshtein = (a: string, b: string): number => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[a.length][b.length];
  };

  const checkAnswer = (answer: string, userInput: string): boolean => {
    return checkAnswerBase(answer, userInput);
  };

  const checkAnswerBase = (answer: string, userInput: string): boolean => {
    // 한 글자 예외: 완전 일치만 허용
    if (answer.length === 1) return answer === userInput;

    // 최소 길이 조건: 입력이 정답의 50% 이상이어야 함
    if (userInput.length < Math.ceil(answer.length * 0.5)) return false;

    // 포함 관계
    if (answer.includes(userInput) || userInput.includes(answer)) return true;

    // 레벤슈타인: 정답 길이의 20% 이하 오차 허용 (최대 2자)
    const maxDist = Math.min(2, Math.floor(answer.length * 0.2));
    return levenshtein(answer, userInput) <= maxDist;
  };

  const handleSubmit = () => {
    if (!currentSong || !input.trim()) return;

    const answer = normalize(currentSong.trackName);
    const userInput = normalize(input);
    const isCorrect = checkAnswer(answer, userInput);

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

  // 정답 오토포커싱
  useEffect(() => {
  if (!feedback && started) {
    inputRef.current?.focus();
  }
}, [feedback, started]);
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
          ref={inputRef}
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
              {normalize(currentSong.trackName).length}글자
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
