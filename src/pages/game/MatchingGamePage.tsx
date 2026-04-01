import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import type { Song } from "../../components/ui/SongListItem";
import GameResult from "../../components/ui/GameResult";
import GameCountdown from "../../components/ui/GameCountdown"; // 추가

interface Card {
  id: number;
  type: "title" | "artist";
  content: string;
  uniqueKey: string;
}

const TOTAL_PAIRS = 8;
const PEEK_TIME = 10;

const MatchingGamePage = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro"); // intro 추가
  const [started, setStarted] = useState(false);

  // 1. 게임 데이터 로드 및 카드 섞기
  const loadGame = useCallback(async () => {
    setIsLoading(true);
    setMatched([]);
    setFlipped([]);
    setTimer(0);

    try {
      const results: Song[] = [];
      const artistSet = new Set();
      const titleSet = new Set();

      while (results.length < TOTAL_PAIRS) {
        const res = await api.get("/api/random");
        const s = res.data;

        // 1. 중복 체크 (가수명 또는 곡명)
        if (artistSet.has(s.artistName) || titleSet.has(s.trackName)) continue;

        // 2. 글자 수 제한 체크 (가수명 또는 곡명이 20자를 초과하면 패스)
        if (s.artistName.length >= 20 || s.trackName.length >= 20) {
          console.log(`너무 긴 제목/가수 제외: ${s.trackName} - ${s.artistName}`);
          continue;
        }

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

      // 데이터 로드 완료 후 게임 시작 상태로 전환
      setStarted(true);
      setIsPeeking(true);

      // 10초 뒤 미리보기 종료
      setTimeout(() => {
        setIsPeeking(false);
      }, PEEK_TIME * 1000);
    } catch (error) {
      console.error("게임 로드 실패:", error);
      setPhase("intro");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. 카운트다운 완료 시 호출
  const initiateGame = () => {
    setPhase("playing");
    loadGame();
  };

  // 3. 타이머 로직 (미리보기 중에도 숫자가 변해야 하므로 isPeeking 조건 제거)
  useEffect(() => {
    if (phase !== "playing" || !started || isLoading) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, started, isLoading]);

  // 4. 게임 종료 감시
  useEffect(() => {
    if (started && matched.length === TOTAL_PAIRS) {
      const finalScore = Math.max(0, 100 - timer);
      setScore(finalScore);
      setPhase("result");
    }
  }, [matched, timer, started]);

  const handleCardClick = (index: number) => {
    if (
      isPeeking ||
      flipped.length === 2 ||
      matched.includes(cards[index].id) ||
      flipped.includes(index)
    )
      return;

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

  const handleRestart = () => {
    setPhase("intro");
    setStarted(false);
    setSongs([]);
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
        maxScore={100}
        onRestart={handleRestart}
        quizType="CARD"
      />
    );
  }

  // 2. 인트로 및 카운트다운 화면
  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white px-4 animate-in fade-in duration-700">
        <div className="text-center mb-16 space-y-4">
          <div className="text-6xl mb-6 animate-bounce">🃏</div>
          <h1 className="text-4xl font-black mb-3 tracking-tight">카드 맞추기</h1>
          <p className="text-gray-400 text-sm">가수와 곡 제목을 매칭하여 짝을 찾으세요!</p>
        </div>
        <div className="w-full flex justify-center scale-110">
          <GameCountdown onStart={initiateGame} />
        </div>
      </div>
    );
  }

  // 3. 로딩 화면
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="animate-pulse font-bold text-indigo-300 text-lg">카드를 섞는 중...</p>
      </div>
    );
  }

  // 4. 실제 게임 화면 (started === true)
  return (
    <div className="mx-auto max-w-2xl p-6 text-white animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div className="bg-neutral-900/50 px-4 py-2 rounded-2xl border border-neutral-800">
          <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block">
            Progress
          </span>
          <div className="text-xl font-black text-indigo-400">
            {matched.length} <span className="text-xs text-gray-600">/</span> {TOTAL_PAIRS}
          </div>
        </div>
        {/* 우측 상단 타이머 영역 수정 */}
        <div className="text-right bg-neutral-900/50 px-4 py-2 rounded-2xl border border-neutral-800 min-w-[100px]">
          <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block">
            {isPeeking ? "Memorize" : "Timer"}
          </span>
          <div
            className={`text-xl font-mono font-bold ${isPeeking ? "text-yellow-400 animate-pulse" : "text-white"}`}
          >
            {/* isPeeking일 때는 남은 시간(10, 9, 8...), 아닐 때는 진행 시간(1s, 2s...) 표시 */}
            {isPeeking ? `${Math.max(0, PEEK_TIME - timer)}s` : `${timer - PEEK_TIME}s`}
          </div>
        </div>
      </div>

      {isPeeking && (
        <div className="mb-6 rounded-xl bg-indigo-600/20 py-4 text-center text-sm font-bold text-indigo-300 border border-indigo-500/30 animate-pulse">
          👀 카드의 위치를 잘 기억하세요! (10초)
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const isFlipped = isPeeking || flipped.includes(index) || matched.includes(card.id);

          return (
            <div
              key={card.uniqueKey}
              onClick={() => handleCardClick(index)}
              className={`relative h-32 cursor-pointer transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : "hover:scale-105"}`}
            >
              {/* 뒷면 (물음표) */}
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-neutral-800 bg-neutral-900 text-3xl shadow-lg [backface-visibility:hidden]">
                <span className="text-neutral-700 font-black">?</span>
              </div>

              {/* 앞면 (내용) */}
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-2xl p-4 text-center text-[11px] font-black leading-tight shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]
                ${card.type === "title" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"} 
                ${matched.includes(card.id) ? "ring-4 ring-yellow-400/50 ring-offset-2 ring-offset-black" : ""}`}
              >
                <span className="text-sm md:text-base font-black leading-[1.2] break-keep">
                  {card.content}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchingGamePage;
