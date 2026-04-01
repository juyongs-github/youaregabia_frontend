import { useState, useCallback } from "react";
import api from "../../api/axios";
import type { Song } from "../../components/ui/SongListItem";
import GameResult from "../../components/ui/GameResult";
import GameCountdown from "../../components/ui/GameCountdown";

const TOTAL = 5;
const MAX_TRIES = 5;
const BLUR_LEVELS = [40, 30, 20, 10, 0];

type Phase = "playing" | "result";
type Feedback = "correct" | "wrong" | "empty" | null;

const AlbumQuizPage = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [artistInput, setArtistInput] = useState("");
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const [gainedScore, setGainedScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [started, setStarted] = useState(false); // 게임 시작 상태 추가

  // 1. 곡 로드 로직
  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = Array.from(
        { length: TOTAL },
        () => api.get("/api/random").then((res) => res.data) // 직접 data를 반환
      );

      const results = await Promise.all(promises); // 모든 데이터가 올 때까지 기다림

      if (results.length > 0) {
        setSongs(results);
        setStarted(true);
      }
    } catch (error) {
      console.error("곡 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const currentSong = songs[currentIndex];
  const blurAmount = BLUR_LEVELS[Math.min(tries, BLUR_LEVELS.length - 1)];

  const normalize = (str: string) => str.toLowerCase().replace(/\s/g, "");
  const calcScore = (currentTries: number) => Math.max(0, 10 - currentTries * 2);

  const goNext = () => {
    setTimeout(() => {
      setFeedback(null);
      setArtistInput("");
      setTries(0);
      setGainedScore(0);
      setRevealed(false);
      if (currentIndex + 1 >= TOTAL) {
        setPhase("result");
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1500);
  };

  const handleSubmit = () => {
    if (!currentSong || feedback) return;
    if (!artistInput.trim()) {
      setFeedback("empty");
      setTimeout(() => setFeedback(null), 1000);
      return;
    }

    const artistCorrect =
      normalize(currentSong.artistName).includes(normalize(artistInput)) ||
      normalize(artistInput).includes(normalize(currentSong.artistName));

    if (artistCorrect) {
      const gained = calcScore(tries);
      setGainedScore(gained);
      setScore((prev) => prev + gained);
      setFeedback("correct");
      setRevealed(true);
      goNext();
    } else {
      const newTries = tries + 1;
      setTries(newTries);
      setFeedback("wrong");

      if (newTries >= MAX_TRIES) {
        setRevealed(true);
        goNext();
      } else {
        setTimeout(() => setFeedback(null), 800);
      }
    }
  };

  const handleSkip = () => {
    if (!currentSong || feedback) return;
    setFeedback("wrong");
    setRevealed(true);
    setTries(MAX_TRIES);
    goNext();
  };

  const handleRestart = () => {
    setScore(0);
    setCurrentIndex(0);
    setArtistInput("");
    setTries(0);
    setGainedScore(0);
    setFeedback(null);
    setRevealed(false);
    setPhase("playing");
    setStarted(false);
  };

  // ========================================================
  // 조건부 렌더링
  // ========================================================

  // 1. 결과 화면
  if (phase === "result") {
    return (
      <GameResult
        songs={songs}
        score={score}
        maxScore={TOTAL * 10}
        onRestart={handleRestart}
        quizType="ALBUM"
      />
    );
  }

  // 2. 로딩 화면
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="animate-pulse font-bold text-indigo-300">앨범 데이터 구성 중...</p>
      </div>
    );
  }

  // 3. 인트로 및 카운트다운 화면
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white px-4 animate-in fade-in duration-700">
        <div className="text-center mb-16 space-y-4">
          <div className="text-6xl mb-6 animate-bounce">🎨</div>
          <h1 className="text-4xl font-black mb-3 tracking-tight">앨범보고 맞추기</h1>
          <p className="text-gray-400 text-sm">흐릿한 앨범 이미지를 보고 가수를 맞춰보세요!</p>
        </div>
        <div className="w-full flex justify-center scale-110">
          <GameCountdown onStart={loadSongs} />
        </div>
      </div>
    );
  }

  // 4. 게임 화면
  return (
    <div className="mx-auto max-w-xl p-8 text-white animate-in fade-in duration-500">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-gray-400 font-bold">
          {currentIndex + 1} / {TOTAL}
        </span>
        <span className="text-indigo-400 font-bold text-xl">Score: {score}</span>
      </div>

      <div className="mb-6 h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / TOTAL) * 100}%` }}
        />
      </div>

      <div className="mb-8 flex flex-col items-center">
        <div className="relative group">
          {currentSong?.imgUrl ? (
            <img
              src={currentSong.imgUrl}
              alt="album"
              className="w-66 h-66 md:w-66 md:h-66 rounded-2xl object-cover shadow-2xl transition-all duration-1000 ease-in-out border-4 border-neutral-800"
              style={{ filter: revealed ? "blur(0) " : `blur(${blurAmount}px)` }}
            />
          ) : (
            <div className="w-56 h-56 bg-neutral-800 animate-pulse rounded-2xl flex items-center justify-center">
              <span>이미지 없음</span>
            </div>
          )}
          {!revealed && (
            <div className="absolute top-2 right-2 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter border border-white/10">
              BLUR: {blurAmount}px
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length: MAX_TRIES }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-md rotate-45 transition-colors duration-300 ${
              i < tries ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-neutral-700"
            }`}
          />
        ))}
      </div>

      {feedback && (
        <div
          className={`mb-6 rounded-xl px-4 py-4 text-center font-bold animate-in zoom-in duration-300 ${
            feedback === "correct"
              ? "bg-green-500/20 text-green-400 border border-green-500/50"
              : feedback === "empty"
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                : "bg-red-500/20 text-red-400 border border-red-500/50"
          }`}
        >
          {feedback === "correct" && `정답! 🎉 +${gainedScore}점`}
          {feedback === "empty" && "가수 이름을 입력해주세요!"}
          {feedback === "wrong" &&
            (tries >= MAX_TRIES
              ? `기회 소진! 정답: ${currentSong?.artistName}`
              : "틀렸어요! 이미지가 선명해집니다 🔎")}
        </div>
      )}

      {revealed && !feedback && (
        <div className="mb-6 text-center animate-in slide-in-from-bottom-4">
          <p className="text-2xl font-black text-white leading-tight">{currentSong?.trackName}</p>
          <p className="text-indigo-400 font-bold">{currentSong?.artistName}</p>
        </div>
      )}

      {!revealed && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={artistInput}
            autoFocus
            onChange={(e) => setArtistInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="가수 이름을 입력하세요..."
            disabled={!!feedback}
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-4 text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50 transition-all shadow-inner"
          />
          <button
            onClick={handleSubmit}
            disabled={!!feedback}
            className="rounded-xl bg-indigo-600 px-5 py-4 font-bold hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
          >
            정답 확인
          </button>
          <button
            onClick={handleSkip}
            disabled={!!feedback}
            className="mt-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            전혀 모르겠어요 (패스) →
          </button>
        </div>
      )}
    </div>
  );
};

export default AlbumQuizPage;
