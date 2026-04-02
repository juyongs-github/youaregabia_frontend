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
  const [started, setStarted] = useState(false);

  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = Array.from({ length: TOTAL }, () =>
        api.get("/api/random").then((res) => res.data)
      );
      const results = await Promise.all(promises);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--kf-brand)", borderTopColor: "transparent" }}
        />
        <p className="font-bold animate-pulse text-lg" style={{ color: "var(--kf-brand)" }}>
          앨범 데이터 구성 중...
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
        <div className="text-center mb-12 space-y-4">
          <div className="text-7xl mb-6 animate-bounce drop-shadow-lg">🎨</div>
          <h1
            className="text-4xl font-black mb-3 tracking-tight"
            style={{ color: "var(--kf-text-main)" }}
          >
            앨범 보고 맞추기
          </h1>
          <p style={{ color: "var(--kf-text-muted)", fontSize: "14px" }}>
            흐릿한 이미지를 보고 가수를 맞춰보세요!
          </p>
        </div>
        <div className="scale-110 flex justify-center w-full">
          <GameCountdown onStart={loadSongs} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-xl p-8 animate-in fade-in duration-500"
      style={{ color: "var(--kf-text-main)" }}
    >
      {/* 상단 정보 */}
      <div className="mb-4 flex items-center justify-between">
        <span style={{ color: "var(--kf-text-muted)" }}>
          {currentIndex + 1} / {TOTAL}
        </span>
        <span className="font-semibold" style={{ color: "var(--kf-brand)" }}>
          점수: {score}
        </span>
      </div>

      {/* 진행 바 */}
      <div className="mb-8 h-2 w-full rounded-full" style={{ background: "var(--kf-border)" }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${((currentIndex + 1) / TOTAL) * 100}%`,
            background: "linear-gradient(90deg, var(--kf-brand), var(--kf-brand-pink))",
          }}
        />
      </div>

      {/* 메인 퀴즈 카드 영역 */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative group">
          {currentSong?.imgUrl ? (
            <img
              src={currentSong.imgUrl}
              alt="album"
              className="w-64 h-64 md:w-72 md:h-72 rounded-[32px] object-cover shadow-2xl transition-all duration-1000 ease-in-out border-4"
              style={{
                filter: revealed ? "blur(0)" : `blur(${blurAmount}px)`,
                borderColor: "var(--kf-border)",
              }}
            />
          ) : (
            <div
              className="w-64 h-64 animate-pulse rounded-[32px] flex items-center justify-center border"
              style={{ background: "var(--kf-border)", color: "var(--kf-text-muted)" }}
            >
              이미지 없음
            </div>
          )}
          {!revealed && (
            <div
              className="absolute top-2 right-2 px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md"
              style={{
                background: "rgba(0,0,0,0.4)",
                color: "#fff",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              BLUR: {blurAmount}px
            </div>
          )}
        </div>
      </div>

      {/* 기회 표시 (기존 유지하되 색상만 변수화) */}
      <div className="mb-6 flex justify-center gap-4">
        {Array.from({ length: MAX_TRIES }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all duration-300"
            style={{
              background: i < tries ? "var(--kf-border)" : "var(--kf-brand-pink)",
              boxShadow: i < tries ? "none" : "0 0 10px rgba(255,92,168,0.3)",
              transform: i < tries ? "scale(0.8)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* 피드백 및 정답 노출 */}
      <div className="min-h-[80px] mb-6">
        {feedback && (
          <div
            className="rounded-xl px-4 py-4 text-center font-bold animate-in zoom-in duration-300 border"
            style={
              feedback === "correct"
                ? {
                    background: "rgba(56,199,170,0.1)",
                    color: "#178f74",
                    borderColor: "rgba(56,199,170,0.2)",
                  }
                : {
                    background: "rgba(255,102,122,0.1)",
                    color: "var(--kf-danger)",
                    borderColor: "rgba(255,102,122,0.2)",
                  }
            }
          >
            {feedback === "correct" && `정답! 🎉 +${gainedScore}점`}
            {feedback === "empty" && "가수 이름을 입력해주세요!"}
            {feedback === "wrong" &&
              (tries >= MAX_TRIES
                ? `정답: ${currentSong?.artistName}`
                : "틀렸어요! 이미지가 선명해집니다 🔎")}
          </div>
        )}
        {revealed && !feedback && (
          <div className="text-center animate-in slide-in-from-bottom-4">
            <p
              className="text-2xl font-black leading-tight"
              style={{ color: "var(--kf-text-main)" }}
            >
              {currentSong?.trackName}
            </p>
            <p className="font-bold" style={{ color: "var(--kf-brand)" }}>
              {currentSong?.artistName}
            </p>
          </div>
        )}
      </div>

      {/* 입력 섹션 */}
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
            className="w-full rounded-xl px-5 py-4 outline-none transition-all border shadow-inner"
            style={{
              background: "rgba(255,255,255,0.8)",
              borderColor: "var(--kf-border)",
              color: "var(--kf-text-main)",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!!feedback}
            className="w-full rounded-xl py-4 font-bold text-white transition-all shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
              opacity: !!feedback ? 0.6 : 1,
            }}
          >
            정답 확인
          </button>
          <button
            onClick={handleSkip}
            disabled={!!feedback}
            className="mt-2 text-sm transition-colors"
            style={{ color: "var(--kf-text-muted)" }}
          >
            모르겠어요 (패스) →
          </button>
        </div>
      )}
    </div>
  );
};

export default AlbumQuizPage;
