import { useEffect, useState } from "react";
import api from "../../api/axios";
import MusicPlayer from "../../components/layout/MusicPlayer";
import type { Song } from "../../components/ui/SongListItem";

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
  }, []);

  const currentSong = songs[currentIndex];

  const normalize = (str: string) => str.toLowerCase().replace(/\s/g, "");

  const handleSubmit = () => {
    if (!currentSong || !input.trim()) return;

    const answer = normalize(currentSong.trackName);
    const userInput = normalize(input);

    const isCorrect = answer.includes(userInput) || userInput.includes(answer);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setFeedback("correct");
    } else {
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

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleSkip = () => {
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
    loadSongs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-white">🎵 곡 불러오는 중...</div>
    );
  }

  if (phase === "result") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-white">
        <h2 className="text-3xl font-bold">결과</h2>
        <p className="text-6xl font-extrabold text-indigo-400">
          {score} / {TOTAL}
        </p>
        <p className="text-gray-400">
          {score === TOTAL
            ? "완벽해요! 🎉"
            : score >= 7
              ? "훌륭해요! 👏"
              : score >= 4
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
      <div className="mb-6 flex items-center justify-between">
        <span className="text-gray-400">
          {currentIndex + 1} / {TOTAL}
        </span>
        <span className="text-indigo-400 font-semibold">점수: {score}</span>
      </div>

      {/* 진행 바 */}
      <div className="mb-8 h-2 w-full rounded-full bg-neutral-700">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all"
          style={{ width: `${(currentIndex / TOTAL) * 100}%` }}
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

      <button
        onClick={handleSkip}
        disabled={!!feedback}
        className="text-sm text-gray-500 hover:text-gray-300 disabled:opacity-50"
      >
        모르겠어요 → 넘기기
      </button>

      {/* 뮤직 플레이어 - blind 모드 */}
      {currentSong && !feedback && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer song={currentSong} setIsPlayerVisible={handleSkip} blind={true} />
        </div>
      )}
    </div>
  );
};

export default MusicQuizPage;
