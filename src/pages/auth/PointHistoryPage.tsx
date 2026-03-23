import { useEffect, useState, useMemo } from "react";
import { pointApi, type PointHistoryDto } from "../../api/pointApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import type { PageResult } from "../../types/board";
import Pagination from "../../Components/ui/Pagination";

const GRADE_CONFIG: Record<string, { label: string; color: string; next: number }> = {
  ENSEMBLE: { label: "ENSEMBLE", color: "text-gray-400", next: 10000 },
  SESSION: { label: "SESSION", color: "text-amber-600", next: 50000 },
  SOLOIST: { label: "SOLOIST", color: "text-gray-300", next: 100000 },
  MAESTRO: { label: "MAESTRO", color: "text-yellow-400", next: 200000 },
  LEGEND: { label: "LEGEND", color: "text-cyan-400", next: Infinity },
};

const POINT_TYPE_LABEL: Record<string, string> = {
  BOARD_WRITE: "게시글 작성",
  REPLY_WRITE: "댓글 작성",
  CHILD_REPLY_WRITE: "대댓글 작성",
  LIKE_GIVEN: "좋아요 클릭",
  MUSIC_QUIZ: "음악 퀴즈",
  ALBUM_QUIZ: "앨범 퀴즈",
  CARD_QUIZ: "카드 퀴즈",
  CRITIC_WRITE: "평론 작성",
  POINT_DEDUCT: "포인트 차감",
};

const PointHistoryPage = () => {
  const [pageData, setPageData] = useState<PageResult<PointHistoryDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PLUS" | "MINUS">("ALL");
  const user = useSelector((state: RootState) => state.auth.user);

  // 서버에 페이지와 필터를 함께 전달
  const loadPage = async (page: number, currentFilter = filter) => {
    setIsLoading(true);
    try {
      const data = await pointApi.getHistory({ page, size: 15, filter: currentFilter });
      setPageData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilter: "ALL" | "PLUS" | "MINUS") => {
    setFilter(newFilter);
    loadPage(1, newFilter); // 필터 변경 시 무조건 1페이지부터
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  const progressInfo = useMemo(() => {
    const currentPoint = user?.totalPoint ?? 0;
    const grade = user?.grade ?? "ENSEMBLE";
    const config = GRADE_CONFIG[grade];
    if (grade === "LEGEND") return { percent: 100, remaining: 0 };

    const grades = Object.keys(GRADE_CONFIG);
    const currentIndex = grades.indexOf(grade);
    const prevThreshold = currentIndex > 0 ? GRADE_CONFIG[grades[currentIndex - 1]].next : 0;

    const range = config.next - prevThreshold;
    const currentInRange = currentPoint - prevThreshold;
    const percent = Math.min(Math.max((currentInRange / range) * 100, 0), 100);

    return { percent, remaining: config.next - currentPoint };
  }, [user]);

  if (isLoading) return <div className="text-center text-white py-20">로딩 중...</div>;

  // 리스트 추출 (useMemo 제거됨)
  const dtoList = pageData?.dtoList ?? [];

  return (
    <div className="mx-auto max-w-2xl p-6 text-white">
      {/* 등급 요약 카드 */}
      <div className="mb-8 rounded-xl border border-neutral-700 bg-neutral-900 px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current Grade</p>
            <p
              className={`text-2xl font-black mt-1 ${GRADE_CONFIG[user?.grade ?? "ENSEMBLE"].color}`}
            >
              {user?.grade ?? "ENSEMBLE"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">My Points</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {(user?.totalPoint ?? 0).toLocaleString()}{" "}
              <span className="text-sm font-normal text-gray-400">P</span>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">Next Level Progress</span>
            <span className="font-medium text-indigo-300">
              {user?.grade === "LEGEND"
                ? "MAX LEVEL"
                : `${progressInfo.remaining.toLocaleString()}P Left`}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700 ease-out"
              style={{ width: `${progressInfo.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 헤더 및 필터링 탭 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">포인트 내역</h2>
        <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          {(["ALL", "PLUS", "MINUS"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleFilterChange(t)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === t ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "ALL" ? "전체" : t === "PLUS" ? "적립" : "차감"}
            </button>
          ))}
        </div>
      </div>

      {dtoList.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-xl">
          <p className="text-gray-500">표시할 내역이 없습니다.</p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {dtoList.map((item) => (
              <li
                key={item.id}
                className="group flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-5 py-4 transition-colors hover:border-neutral-700"
              >
                <div>
                  <p className="text-sm font-bold text-gray-200">
                    {POINT_TYPE_LABEL[item.pointType] ?? item.pointType}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1.5 uppercase">
                    {new Date(item.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-base font-black ${item.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {item.amount > 0 ? `+${item.amount}` : item.amount}
                  </span>
                  <span className="ml-1 text-xs text-gray-500 font-normal">P</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Pagination
              pageNumList={pageData!.pageNumList}
              current={pageData!.current}
              prev={pageData!.prev}
              next={pageData!.next}
              prevPage={pageData!.prevPage}
              nextPage={pageData!.nextPage}
              onPageChange={(p) => {
                loadPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PointHistoryPage;
