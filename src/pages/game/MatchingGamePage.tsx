import { useEffect, useState } from "react";
import api from "../../api/axios";
import type { Song } from "../../Components/ui/SongListItem";
import GameResult from "../../Components/ui/GameResult";

interface Card {
  id: number;
  type: "title" | "artist";
  content: string;
  uniqueKey: string;
}

const TOTAL_PAIRS = 8;
const PEEK_TIME = 10; // 시작 시 보여줄 시간 (10초)

const MatchingGamePage = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPeeking, setIsPeeking] = useState(false); // 10초 미리보기 상태
  const [phase, setPhase] = useState<"playing" | "result">("playing");

  const loadGame = async () => {
    setPhase("playing");
    setIsLoading(true);
    setIsPeeking(true); // 게임 로드 직후 미리보기 시작
    setMatched([]);
    setFlipped([]);
    setTimer(0);

    try {
      const results: Song[] = [];
      const artistSet = new Set();
      const titleSet = new Set();

      // 8개의 고유한 쌍이 모일 때까지 반복
      while (results.length < TOTAL_PAIRS) {
        const res = await api.get("/random");
        const s = res.data;

        // 가수나 제목이 겹치면 패스
        if (artistSet.has(s.artistName) || titleSet.has(s.trackName)) continue;

        results.push(s);
        artistSet.add(s.artistName);
        titleSet.add(s.trackName);
      }

      setSongs(results);

      const deck: Card[] = [];
      results.forEach((song) => {
        deck.push({
          id: song.id,
          type: "title",
          content: song.trackName,
          uniqueKey: `title-${song.id}`,
        });
        deck.push({
          id: song.id,
          type: "artist",
          content: song.artistName,
          uniqueKey: `artist-${song.id}`,
        });
      });

      setCards(deck.sort(() => Math.random() - 0.5));

      // 10초 뒤에 미리보기 종료
      setTimeout(() => {
        setIsPeeking(false);
      }, PEEK_TIME * 1000);
    } catch (error) {
      console.error("게임 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGame();
  }, []);

  // 타이머 로직 (미리보기가 끝난 후부터 흐르도록 수정)
  useEffect(() => {
    if (phase !== "playing" || isLoading || isPeeking) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isLoading, isPeeking]);

  useEffect(() => {
    if (matched.length === TOTAL_PAIRS) {
      const finalScore = Math.max(0, 100 - timer);
      setScore(finalScore);
      setPhase("result");
    }
  }, [matched, timer]);

  const handleCardClick = (index: number) => {
    // 미리보기 중이거나, 이미 뒤집혔거나, 맞춘 카드면 무시
    if (
      isPeeking ||
      flipped.length === 2 ||
      matched.includes(cards[index].id) ||
      flipped.includes(index)
    ) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const first = cards[newFlipped[0]];
      const second = cards[newFlipped[1]];

      if (first.id === second.id) {
        setMatched((prev) => [...prev, first.id]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-white">🃏 카드 섞는 중...</div>
    );
  }

  if (phase === "result") {
    return (
      <GameResult songs={songs} score={score} maxScore={100} onRestart={loadGame} quizType="CARD" />
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-gray-400 text-sm uppercase tracking-widest">Progress</span>
          <div className="text-xl font-bold text-indigo-400">
            {matched.length} / {TOTAL_PAIRS} Pairs
          </div>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-sm uppercase tracking-widest">
            {isPeeking ? "Memorize!" : "Time"}
          </span>
          <div
            className={`text-xl font-mono ${isPeeking ? "text-yellow-400 animate-pulse" : "text-white"}`}
          >
            {isPeeking ? `Ready in ${PEEK_TIME - Math.floor(timer)}s` : `${timer}s`}
          </div>
        </div>
      </div>

      {/* 미리보기 안내 메시지 */}
      {isPeeking && (
        <div className="mb-4 rounded-lg bg-indigo-900/50 py-2 text-center text-sm font-semibold text-indigo-200 border border-indigo-500/30">
          👀 10초 동안 카드의 위치를 기억하세요!
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, index) => {
          // 미리보기 중이거나(isPeeking), 선택했거나, 맞춘 카드면 뒤집힌 상태(앞면) 유지
          const isFlipped = isPeeking || flipped.includes(index) || matched.includes(card.id);

          return (
            <div
              key={card.uniqueKey}
              onClick={() => handleCardClick(index)}
              className={`relative h-28 cursor-pointer transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
            >
              <div className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-neutral-700 bg-neutral-800 text-2xl shadow-lg [backface-visibility:hidden]">
                <span className="text-neutral-600">?</span>
              </div>

              <div
                className={`absolute inset-0 flex items-center justify-center rounded-xl p-3 text-center text-xs font-bold shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]
                ${card.type === "title" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"}`}
              >
                {card.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchingGamePage;
