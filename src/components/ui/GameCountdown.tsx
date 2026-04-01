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
      <div className="flex flex-col items-center justify-center gap-8 animate-in fade-in zoom-in duration-700">
        {/* 버튼 주위에 은은한 후광 효과를 주기 위한 컨테이너 */}
        <div className="relative group">
          {/* 배경에 깔리는 퍼지는 빛 효과 (Hover 시 더 진해짐) */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#6d5efc] to-[#ff5ca8] rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

          <button
            onClick={handleStart}
            className="relative px-20 py-5 text-xl font-black tracking-widest
                     bg-white/70 backdrop-blur-xl border border-white/80
                     text-[#2f3863] rounded-[22px]
                     shadow-[0_20px_40px_rgba(109,94,252,0.1)]
                     hover:shadow-[0_25px_50px_rgba(109,94,252,0.2)]
                     hover:scale-[1.03] hover:text-[#6d5efc]
                     active:scale-95 transition-all duration-300
                     flex items-center gap-3"
          >
            <span className="relative">START!</span>
          </button>
        </div>

        {/* 버튼 하단에 부드러운 가이드 문구 추가 (선택 사항) */}
        <p className="text-slate-400 font-bold text-sm animate-pulse">클릭하여 시작하기</p>
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
