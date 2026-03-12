import { useEffect, useState } from "react";
import api from "../../api/axios";
import type { Song } from "../../components/ui/SongListItem";

const TOTAL = 5;
const MAX_TRIES = 5;
const BLUR_LEVELS = [40, 30, 20, 10, 0];

type Phase = "playing" | "result";
type Feedback = "correct" | "partial" | "wrong" | null;

const AlbumQuizPage = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [titleInput, setTitleInput] = useState("");
  const [artistInput, setArtistInput] = useState("");
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
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

  const calcScore = (tries: number, isPartial: boolean) => {
    const base = 10 - tries * 2;
    return isPartial ? base - 1 : base;
  };

  const goNext = () => {
    setTimeout(() => {
      setFeedback(null);
      setTitleInput("");
      setArtistInput("");
      setTries(0);
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

    const titleCorrect =
      normalize(currentSong.trackName).includes(normalize(titleInput)) ||
      normalize(titleInput).includes(normalize(currentSong.trackName));
    const artistCorrect =
      normalize(currentSong.artistName).includes(normalize(artistInput)) ||
      normalize(artistInput).includes(normalize(currentSong.artistName));

    const bothCorrect = titleInput.trim() && artistInput.trim() && titleCorrect && artistCorrect;
    const partialCorrect =
      (titleCorrect && titleInput.trim()) || (artistCorrect && artistInput.trim());

    if (bothCorrect) {
      const gained = calcScore(tries, false);
      setScore((prev) => prev + gained);
      setFeedback("correct");
      setRevealed(true);
      goNext();
    } else if (partialCorrect) {
      const gained = calcScore(tries, true);
      setScore((prev) => prev + gained);
      setFeedback("partial");
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

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleRestart = () => {
    setScore(0);
    setCurrentIndex(0);
    setTitleInput("");
    setArtistInput("");
    setTries(0);
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
    const maxScore = TOTAL * 10;
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-white">
        <h2 className="text-3xl font-bold">최종 결과</h2>
        <p className="text-6xl font-extrabold text-indigo-400">
          {score} / {maxScore}
        </p>
        <p className="text-gray-400">
          {score === maxScore
            ? "완벽해요! 🎉"
            : score >= maxScore * 0.7
              ? "훌륭해요! 👏"
              : score >= maxScore * 0.4
                ? "잘 했어요! 😊"
                : "다음엔 더 잘할 수 있어요! 💪"}
        </p>
        <button
          onClick={handleRestart}
          className="rounded-full bg-indigo-600 px-8 py-3 font-semibold hover:bg-indigo-500"
        >
          다시 도전
        </button>
      </div>
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

      {/* 남은 기회 */}
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
              : feedback === "partial"
                ? "bg-yellow-800 text-yellow-300"
                : "bg-red-900 text-red-300"
          }`}
        >
          {feedback === "correct" && `완전 정답! 🎉 +${calcScore(tries - 1, false)}점`}
          {feedback === "partial" && `부분 정답! ✨ +${calcScore(tries - 1, true)}점`}
          {feedback === "wrong" && tries >= MAX_TRIES
            ? `정답: ${currentSong?.trackName} - ${currentSong?.artistName}`
            : "틀렸어요 😢 블러가 줄어들었어요!"}
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
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={handleEnter}
            placeholder="곡 제목..."
            disabled={!!feedback}
            className="rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          />
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
        </div>
      )}
    </div>
  );
};

export default AlbumQuizPage;
