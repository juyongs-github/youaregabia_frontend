import { useEffect, useState } from "react";
import api from "../../api/axios";
import type { Song } from "../../Components/ui/SongListItem";
import GameResult from "../../Components/ui/GameResult";

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
  const [gainedScore, setGainedScore] = useState(0); // 추가
  const [phase, setPhase] = useState<Phase>("playing");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

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

  useEffect(() => {
    loadSongs();
  }, []);

  const currentSong = songs[currentIndex];
  const blurAmount = BLUR_LEVELS[Math.min(tries, BLUR_LEVELS.length - 1)];

  const normalize = (str: string) => str.toLowerCase().replace(/\s/g, "");

  const calcScore = (currentTries: number) => {
    const earned = 10 - currentTries * 2;
    return earned < 0 ? 0 : earned;
  };

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
    // 공백 체크 로직
    if (!artistInput.trim()) {
      setFeedback("empty");
      // 1초 뒤에 문구를 사라지게 합니다.
      setTimeout(() => setFeedback(null), 1000);
      return;
    }

    const artistCorrect =
      normalize(currentSong.artistName).includes(normalize(artistInput)) ||
      normalize(artistInput).includes(normalize(currentSong.artistName));

    if (artistCorrect) {
      const gained = calcScore(tries);
      setGainedScore(gained); // 현재 tries로 점수 저장
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

    // 1. 오답 처리 (gainedScore는 0으로 유지)
    setFeedback("wrong");
    setRevealed(true); // 정답을 보여줌
    setTries(MAX_TRIES); // 기회를 다 쓴 것으로 처리 (시각적 일관성)

    // 2. 1.5초 뒤 다음 문제로 이동 (기존 goNext 활용)
    goNext();
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
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
    loadSongs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-white">🎨 앨범 불러오는 중...</div>
    );
  }

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

  return (
    <div className="mx-auto max-w-xl p-8 text-white">
      {/* 진행 상황 */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-gray-400">
          {currentIndex + 1} / {TOTAL}
        </span>
        <span className="text-indigo-400 font-semibold">점수: {score}</span>
      </div>

      {/* 진행 바 */}
      <div className="mb-6 h-2 w-full rounded-full bg-neutral-700">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all"
          style={{ width: `${(currentIndex / TOTAL) * 100}%` }}
        />
      </div>

      {/* 앨범 아트 */}
      <div className="mb-6 flex justify-center">
        <img
          src={currentSong?.imgUrl}
          alt="album"
          className="w-64 h-64 rounded-xl object-cover transition-all duration-700"
          style={{ filter: revealed ? "blur(0px)" : `blur(${blurAmount}px)` }}
        />
      </div>

      {/* 남은 기회 표시 */}
      <div className="mb-4 flex justify-center gap-2">
        {Array.from({ length: MAX_TRIES }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${i < tries ? "bg-red-500" : "bg-neutral-600"}`}
          />
        ))}
      </div>

      {/* 피드백 */}
      {feedback && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-center font-semibold ${
            feedback === "correct"
              ? "bg-green-800 text-green-300"
              : feedback === "empty"
                ? "bg-yellow-700 text-yellow-100"
                : "bg-red-900 text-red-300"
          }`}
        >
          {feedback === "correct" && `정답! 🎉 +${gainedScore}점`}
          {feedback === "empty" && "정답을 입력해주세요!"}
          {feedback === "wrong" && tries >= MAX_TRIES
            ? `기회 소진! 정답: ${currentSong?.artistName}`
            : feedback === "wrong" && "틀렸어요 😢 블러가 줄어들었어요!"}
        </div>
      )}

      {/* 정답 공개 시 곡 정보 */}
      {revealed && (
        <div className="mb-4 text-center">
          <p className="font-bold text-lg">{currentSong?.trackName}</p>
          <p className="text-gray-400">{currentSong?.artistName}</p>
        </div>
      )}

      {/* 입력창 */}
      {!revealed && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            onKeyDown={handleEnter}
            placeholder="아티스트 이름..."
            disabled={!!feedback}
            className="rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!!feedback}
            className="rounded bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            정답 제출
          </button>
          {/* 스킵 버튼 */}
          <button
            onClick={handleSkip}
            disabled={!!feedback}
            className="mt-2 text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            모르겠어요 → 넘기기
          </button>
        </div>
      )}
    </div>
  );
};

export default AlbumQuizPage;
