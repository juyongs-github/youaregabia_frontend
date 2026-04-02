import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import type { Song } from "../../components/ui/SongListItem";
import GameResult from "../../components/ui/GameResult";
import GameCountdown from "../../components/ui/GameCountdown";

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
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [started, setStarted] = useState(false);

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
        if (artistSet.has(s.artistName) || titleSet.has(s.trackName)) continue;
        if (s.artistName.length >= 20 || s.trackName.length >= 20) continue;
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
      setStarted(true);
      setIsPeeking(true);

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

  const initiateGame = () => {
    setPhase("playing");
    loadGame();
  };

  useEffect(() => {
    if (phase !== "playing" || !started || isLoading) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, started, isLoading]);

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

  // ── 결과 ──────────────────────────────────────────────
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

  // ── 인트로 / 카운트다운 ────────────────────────────────
  if (phase === "intro") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[80vh] px-4"
        style={{ color: "var(--kf-text-main)" }}
      >
        <div className="text-center mb-16 space-y-4">
          <div className="text-6xl mb-6 animate-bounce">🃏</div>
          <h1
            className="text-4xl font-black mb-3 tracking-tight"
            style={{ color: "var(--kf-text-main)" }}
          >
            카드 맞추기
          </h1>
          <p style={{ color: "var(--kf-text-muted)", fontSize: "14px" }}>
            가수와 곡 제목을 매칭하여 짝을 찾으세요!
          </p>
        </div>
        <div className="w-full flex justify-center scale-110">
          <GameCountdown onStart={initiateGame} />
        </div>
      </div>
    );
  }

  // ── 로딩 ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--kf-brand)", borderTopColor: "transparent" }}
        />
        <p className="animate-pulse font-bold text-lg" style={{ color: "var(--kf-brand)" }}>
          카드를 섞는 중...
        </p>
      </div>
    );
  }

  // ── 게임 화면 ──────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl p-6" style={{ color: "var(--kf-text-main)" }}>
      {/* 상단 Progress / Timer */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div
          className="px-4 py-2 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.72)",
            border: "1px solid var(--kf-border)",
            boxShadow: "var(--kf-shadow-sm)",
          }}
        >
          <span
            className="text-[10px] uppercase font-black tracking-widest block"
            style={{ color: "var(--kf-text-muted)" }}
          >
            Progress
          </span>
          <div className="text-xl font-black" style={{ color: "var(--kf-brand)" }}>
            {matched.length}{" "}
            <span className="text-xs" style={{ color: "var(--kf-text-muted)" }}>
              /
            </span>{" "}
            {TOTAL_PAIRS}
          </div>
        </div>

        <div
          className="px-4 py-2 rounded-2xl min-w-[100px] text-right"
          style={{
            background: "rgba(255,255,255,0.72)",
            border: "1px solid var(--kf-border)",
            boxShadow: "var(--kf-shadow-sm)",
          }}
        >
          <span
            className="text-[10px] uppercase font-black tracking-widest block"
            style={{ color: "var(--kf-text-muted)" }}
          >
            {isPeeking ? "Memorize" : "Timer"}
          </span>
          <div
            className="text-xl font-mono font-bold"
            style={{
              color: isPeeking ? "var(--kf-warning)" : "var(--kf-text-main)",
              animation: isPeeking ? "pulse 1s infinite" : "none",
            }}
          >
            {isPeeking ? `${Math.max(0, PEEK_TIME - timer)}s` : `${timer - PEEK_TIME}s`}
          </div>
        </div>
      </div>

      {/* 미리보기 배너 */}
      {isPeeking && (
        <div
          className="mb-6 rounded-xl py-4 text-center text-sm font-bold animate-pulse"
          style={{
            background: "rgba(109,94,252,0.08)",
            border: "1px solid rgba(109,94,252,0.22)",
            color: "var(--kf-brand)",
          }}
        >
          👀 카드의 위치를 잘 기억하세요! (10초)
        </div>
      )}

      {/* 카드 그리드 */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const isFlipped = isPeeking || flipped.includes(index) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);

          return (
            <div
              key={card.uniqueKey}
              onClick={() => handleCardClick(index)}
              className={`relative h-32 cursor-pointer transition-all duration-500 [transform-style:preserve-3d] ${
                isFlipped ? "[transform:rotateY(180deg)]" : "hover:scale-105"
              }`}
            >
              {/* 뒷면 */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl text-3xl shadow-md [backface-visibility:hidden]"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid var(--kf-border)",
                  boxShadow: "var(--kf-shadow-sm)",
                }}
              >
                <span className="font-black" style={{ color: "var(--kf-text-muted)" }}>
                  ?
                </span>
              </div>

              {/* 앞면 */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl p-4 text-center text-[11px] font-black leading-tight shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={{
                  background:
                    card.type === "title"
                      ? "linear-gradient(135deg, var(--kf-brand), #8b7ffc)"
                      : "linear-gradient(135deg, var(--kf-brand-mint), #5dd8c0)",
                  color: "#fff",
                  boxShadow: isMatched
                    ? "0 0 0 3px var(--kf-warning), var(--kf-shadow-md)"
                    : "var(--kf-shadow-sm)",
                }}
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
