// src/components/ui/GameCountdown.tsx
import { useState, useEffect } from "react";

interface Props {
  onStart: () => void;
}

type Phase = "idle" | "counting" | "go";

export default function GameCountdown({ onStart }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);

  const handleStart = () => {
    setCount(3);
    setPhase("counting");
  };

  useEffect(() => {
    if (phase !== "counting") return;

    if (count === 0) {
      setPhase("go");
      onStart(); // setTimeout 없이 즉시 호출
      return; // 클린업 없음
    }

    const t = setTimeout(() => setCount((c) => c - 1), 950);
    return () => clearTimeout(t);
  }, [phase, count, onStart]);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleStart}
          className="px-14 py-3 text-lg font-medium border rounded-xl
                     hover:bg-gray-100 transition-colors active:scale-95"
        >
          START!
        </button>
      </div>
    );
  }

  if (phase === "counting") {
    return (
      <div className="flex flex-col items-center gap-3">
        <span key={count} className="text-8xl font-medium animate-ping-once">
          {count}
        </span>
        <span className="text-sm text-gray-400 tracking-widest">준비하세요</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-6xl font-medium">GO!</span>
    </div>
  );
}
