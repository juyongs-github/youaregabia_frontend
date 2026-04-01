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

  // 게임 시작 시 10곡 미리 로드
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
    return () => { stop(); };
  }, []);

  const currentSong = songs[currentIndex];

  const { play, stop } = usePlayer();

  useEffect(() => {
    if (started && currentSong && !feedback && phase === "playing") {
      play(currentSong, { blind: true, onClose: handleSkip });
    } else {
      stop();
    }
  }, [currentIndex, feedback, phase, started]);

  // 대소문자, 띄어쓰기, 특수문자 제거 + 전각→반각, 가타카나→히라가나
  const normalize = (str: string): string =>
    str
      .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // 전각→반각
      .replace(/\u3000/g, " ")                                                             // 전각 스페이스→반각
      .replace(/[\u30A1-\u30F6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))   // 가타카나→히라가나
      .toLowerCase()
      .replace(/[\s\-_.,!?'"()&]/g, "");

  // 레벤슈타인 거리 계산
  const levenshtein = (a: string, b: string): number => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[a.length][b.length];
  };

  // 괄호/대괄호 안 부제목 제거 (예: "(Attack on Titan)" → "")
  const stripMeta = (str: string) =>
    str.replace(/[\(\[\{][^\)\]\}]*[\)\]\}]/g, "").trim();

  const checkAnswer = (answer: string, input: string): boolean => {
    const a = normalize(answer);
    const aCore = normalize(stripMeta(answer)); // 부제목 제거한 핵심 제목
    const u = normalize(input);

    // 1글자 제목 예외: 정확히 일치해야 인정
    if (aCore.length === 1) return aCore === u;
    // 2글자 미만 입력은 불인정
    if (u.length < 2) return false;
    // 정확히 일치 (전체 or 핵심 제목)
    if (a === u || aCore === u) return true;
    // 부분일치: 핵심 제목 기준으로 50% 이상이어야 인정
    const base = aCore.length > 0 ? aCore : a;
    if (base.includes(u) && u.length >= Math.ceil(base.length * 0.5)) return true;
    // 오타 허용: 핵심 제목 길이 기준 1~2자
    const threshold = base.length <= 4 ? 1 : 2;
    return levenshtein(aCore, u) <= threshold || levenshtein(a, u) <= threshold;
  };

  const handleSubmit = () => {
    if (!currentSong || !input.trim()) return;

    const isCorrect = checkAnswer(currentSong.trackName, input);

    if (isCorrect) {
      let gained = 0;
      if (timer < 10)
        gained = 10; // 10초 이내: 10점
      else if (timer < 20)
        gained = 6; // 20초 이내: 6점
      else gained = 3; // 30초 이내: 3점
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
  const [timer, setTimer] = useState(0);

  // 곡 바뀔 때마다 타이머 리셋 및 30초 제한 감시
  useEffect(() => {
    // 1. 아직 시작 버튼을 누르지 않았거나 곡이 로딩 중이면 타이머를 돌리지 않음
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
    if (!currentSong || feedback) return; // 추가 - currentSong 없으면 무시
    // 스킵 시에도 현재 곡 ID를 오답 목록에 추가
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-white">🎵 곡 불러오는 중...</div>
    );
  }
  // 카운트다운
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white px-4 animate-in fade-in duration-700">
        {/* 상단 문구 영역 */}
        <div className="text-center mb-16 space-y-4">
          <div className="text-6xl mb-6 animate-bounce">🎧</div>
          <h1 className="text-4xl font-black mb-3 tracking-tight">노래 맞추기</h1>
          <p className="text-gray-400 text-sm">음악을 듣고 제목을 맞혀보세요!</p>
        </div>

        {/* 카운트다운 컴포넌트 (내부의 START 버튼이 이 자리에 위치함) */}
        <div className="w-full flex justify-center scale-110">
          <GameCountdown onStart={() => setStarted(true)} />
        </div>
      </div>
    );
  }

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

  return (
    <div className="mx-auto max-w-xl p-8 text-white">
      {/* 진행 상황 */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-gray-400">
          {currentIndex + 1} / {TOTAL}
        </span>
        <span className="text-indigo-400 font-semibold">점수: {score}</span>
      </div>

      {/* 진행 상황 영역 아래에 추가 */}
      <div className="mb-2 text-right">
        <span
          className={`font-mono text-xl ${timer >= 25 ? "text-red-500 animate-pulse" : "text-gray-300"}`}
        >
          ⏱️ {30 - timer}s
        </span>
      </div>

      {/* 진행 바 */}
      <div className="mb-8 h-2 w-full rounded-full bg-neutral-700">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all"
          style={{ width: `${((currentIndex + 1) / TOTAL) * 100}%` }}
        />
      </div>

      {/* 피드백 */}
      {feedback && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-center font-semibold text-lg ${
            feedback === "correct" ? "bg-green-800 text-green-300" : "bg-red-900 text-red-300"
          }`}
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
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!!feedback}
          className="rounded bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          정답
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-1 text-sm text-gray-400">
        {timer >= 10 && currentSong && (
          <p>
            🎤 힌트 1: 가수는{" "}
            <span className="text-indigo-400 font-semibold">{currentSong.artistName}</span> 입니다.
          </p>
        )}
        {timer >= 20 && currentSong && (
          <p>
            🔤 힌트 2: 제목은{" "}
            <span className="text-indigo-400 font-semibold">
              {currentSong.trackName.length}글자
            </span>{" "}
            입니다.
          </p>
        )}
      </div>
      <button
        onClick={handleSkip}
        disabled={!!feedback}
        className="text-sm text-gray-500 hover:text-gray-300 disabled:opacity-50"
      >
        모르겠어요 → 넘기기
      </button>

    </div>
  );
};

export default MusicQuizPage;
