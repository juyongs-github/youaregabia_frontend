import { useEffect, useState } from "react";
import api from "../../api/axios";
import MusicPlayer from "../../components/layout/MusicPlayer";
import type { Song } from "../../components/ui/SongListItem";
import GameResult from "../../components/ui/GameResult";

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
    let isTransitioning = false; // 해당 이펙트 안에서만 사용할 로컬 플래그
    setTimer(0);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev >= 29) {
          if (!isTransitioning) {
            isTransitioning = true; // 중복 호출 방지
            handleSkip();
          }
          clearInterval(interval);
          return 30;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      isTransitioning = true; // 언마운트 시 플래그 정리
      clearInterval(interval);
    };
  }, [currentIndex, songs]);

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
    loadSongs();
    setCorrectSongIds(new Set());
    setWrongSongIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-white">🎵 곡 불러오는 중...</div>
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

      <div className="mb-4 flex flex-col gap-1 text-sm text-gray-400">
        {timer >= 10 && currentSong && (
          <p>
            🎤 힌트 1: 가수는{" "}
            <span className="text-indigo-400 font-semibold">{currentSong.artistName}</span> 이에요
          </p>
        )}
        {timer >= 20 && currentSong && (
          <p>
            🔤 힌트 2: 제목은{" "}
            <span className="text-indigo-400 font-semibold">
              {currentSong.trackName.length}글자
            </span>{" "}
            예요
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
