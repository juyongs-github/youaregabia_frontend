import { useEffect, useState, useMemo } from "react";
import { pointApi, type PointHistoryDto } from "../../api/pointApi";
import { rankingApi, type UserRankingDto } from "../../api/rankingApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import "../../styles/PointHistoryPage.kfandom.css";
import type { PageResult } from "../../types/board";
import Pagination from "../../components/ui/Pagination";

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

const GRADE_BADGE: Record<string, string> = {
  ENSEMBLE: "text-gray-400",
  SESSION: "text-amber-600",
  SOLOIST: "text-red-300",
  MAESTRO: "text-yellow-400",
  LEGEND: "text-cyan-400",
};

// ── 랭킹 리스트 컴포넌트 ──────────────────────────────
const RankingSection = ({
  title,
  data,
  scoreLabel,
  scoreFormat,
}: {
  title: string;
  data: UserRankingDto[];
  scoreLabel: string;
  scoreFormat: (score: number) => string;
}) => (
  <div className="mb-6 rounded-xl border border-neutral-700 bg-neutral-900 px-6 py-5 shadow-lg">
    <h3 className="text-base font-bold mb-4 text-white">{title}</h3>
    {data.length === 0 ? (
      <p className="text-gray-500 text-sm text-center py-4">데이터가 없습니다.</p>
    ) : (
      <ul className="flex flex-col gap-2">
        {data.map((item, index) => (
          <li
            key={item.userId}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 hover:border-neutral-700 transition-colors"
          >
            {/* 순위 */}
            <span
              className={`w-7 text-center font-black text-sm shrink-0 ${
                index === 0
                  ? "text-yellow-400"
                  : index === 1
                    ? "text-gray-300"
                    : index === 2
                      ? "text-amber-600"
                      : "text-gray-600"
              }`}
            >
              {index + 1}
            </span>

            {/* 이름 + 등급 */}
            <div className="flex-1 mx-3">
              <span className="text-sm font-semibold text-gray-200">{item.name}</span>
              <span
                className={`ml-2 text-xs font-bold ${GRADE_BADGE[item.grade] ?? "text-gray-400"}`}
              >
                {item.grade}
              </span>
            </div>

            {/* 점수 */}
            <div className="text-right shrink-0">
              <span className="text-sm font-black text-indigo-400">{scoreFormat(item.score)}</span>
              <span className="ml-1 text-xs text-gray-500">{scoreLabel}</span>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// ── 메인 페이지 ───────────────────────────────────────
const PointHistoryPage = () => {
  const [activeTab, setActiveTab] = useState<"history" | "ranking">("history");

  // 포인트 내역
  const [pageData, setPageData] = useState<PageResult<PointHistoryDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PLUS" | "MINUS">("ALL");

  // 랭킹
  const [likeRanking, setLikeRanking] = useState<UserRankingDto[]>([]);
  const [pointRanking, setPointRanking] = useState<UserRankingDto[]>([]);
  const [rankingLoaded, setRankingLoaded] = useState(false); // 중복 호출 방지
  const [showGradeInfo, setShowGradeInfo] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);

  // 포인트 내역 로드
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

  // 랭킹 탭 클릭 시 최초 1회만 로드
  const handleTabChange = (tab: "history" | "ranking") => {
    setActiveTab(tab);
    if (tab === "ranking" && !rankingLoaded) {
      Promise.all([rankingApi.getLikeUsers(), rankingApi.getPointUsers()])
        .then(([like, point]) => {
          setLikeRanking(like);
          setPointRanking(point);
          setRankingLoaded(true);
        })
        .catch(console.error);
    }
  };

  const handleFilterChange = (newFilter: "ALL" | "PLUS" | "MINUS") => {
    setFilter(newFilter);
    loadPage(1, newFilter);
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  const progressInfo = useMemo(() => {
    const accPoint = user?.accumulatedPoint ?? 0; // totalPoint → accumulatedPoint
    const grade = user?.grade ?? "ENSEMBLE";
    const config = GRADE_CONFIG[grade];
    if (grade === "LEGEND") return { percent: 100, remaining: 0 };

    const grades = Object.keys(GRADE_CONFIG);
    const currentIndex = grades.indexOf(grade);
    const prevThreshold = currentIndex > 0 ? GRADE_CONFIG[grades[currentIndex - 1]].next : 0;
    const range = config.next - prevThreshold;
    const currentInRange = accPoint - prevThreshold;
    const percent = Math.min(Math.max((currentInRange / range) * 100, 0), 100);

    return { percent, remaining: config.next - accPoint };
  }, [user]);

  const dtoList = pageData?.dtoList ?? [];

  return (
    <div className="kf-expansion-page kf-point-history">
      {/* 등급 요약 카드 */}
      <div className="mb-6 rounded-xl border border-neutral-700 bg-neutral-900/50 px-6 py-5 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">
              Current Grade
            </p>
            <div className="flex items-center gap-3 mt-1">
              <p
                className={`text-3xl font-black tracking-tighter ${GRADE_CONFIG[user?.grade ?? "ENSEMBLE"].color}`}
              >
                {user?.grade ?? "ENSEMBLE"}
              </p>
              {/* 텍스트 대신 아이콘 버튼으로 변경 */}
              <button
                onClick={() => setShowGradeInfo((prev) => !prev)}
                className={`p-1 rounded-full hover:bg-neutral-800 transition-all duration-300 ${
                  showGradeInfo ? "rotate-180 text-indigo-400" : "text-gray-500"
                }`}
                aria-label="등급 상세 보기"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">
              My Points
            </p>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {(user?.totalPoint ?? 0).toLocaleString()}{" "}
              <span className="text-sm font-normal text-gray-500">P</span>
            </p>
          </div>
        </div>

        {/* 등급 안내 펼침 영역 */}
        {showGradeInfo && (
          <div className="mt-5 pt-5 border-t border-neutral-800 space-y-2 text-[11px] text-gray-400 animate-fadeIn">
            <p className="font-bold text-gray-400 mb-3 px-1">등급 구간 안내 (누적 포인트)</p>
            {[
              { grade: "ENSEMBLE", range: "0 ~ 9,999 P" },
              { grade: "SESSION", range: "10,000 ~ 49,999 P" },
              { grade: "SOLOIST", range: "50,000 ~ 99,999 P" },
              { grade: "MAESTRO", range: "100,000 ~ 199,999 P" },
              { grade: "LEGEND", range: "200,000 P 이상" },
            ].map(({ grade, range }) => {
              const isCurrentGrade = user?.grade === grade;
              return (
                <div
                  key={grade}
                  className={`flex justify-between items-center px-3 py-2 rounded-lg border transition-all ${
                    isCurrentGrade
                      ? "border-indigo-500/40 bg-indigo-500/5 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  <span
                    className={`font-bold tracking-tight ${GRADE_CONFIG[grade as keyof typeof GRADE_CONFIG].color}`}
                  >
                    {grade}
                  </span>
                  <span className={isCurrentGrade ? "font-semibold text-indigo-300/80" : ""}>
                    {range}
                  </span>
                </div>
              );
            })}
            <p className="mt-4 px-1 text-[10px] text-neutral-600 leading-relaxed italic">
              * 등급은 누적 획득 포인트를 기준으로 산정되며, 포인트를 사용해도 하락하지 않습니다.
            </p>
          </div>
        )}

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

      {/* ── 탭 ── */}
      <div className="flex gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 mb-6">
        {(["history", "ranking"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === tab ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "history" ? "포인트 내역" : "랭킹"}
          </button>
        ))}
      </div>

      {/* ── 포인트 내역 탭 ── */}
      {activeTab === "history" && (
        <>
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

          {isLoading ? (
            <div className="text-center text-white py-20">로딩 중...</div>
          ) : dtoList.length === 0 ? (
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
        </>
      )}

      {/* ── 랭킹 탭 ── */}
      {activeTab === "ranking" && (
        <>
          {!rankingLoaded ? (
            <div className="text-center text-white py-20">로딩 중...</div>
          ) : (
            <>
              <RankingSection
                title="❤️ 좋아요 유저 TOP 10"
                data={likeRanking}
                scoreLabel="좋아요"
                scoreFormat={(s) => s.toLocaleString()}
              />
              <RankingSection
                title="⭐ 포인트 유저 TOP 10"
                data={pointRanking}
                scoreLabel="P"
                scoreFormat={(s) => s.toLocaleString()}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PointHistoryPage;
