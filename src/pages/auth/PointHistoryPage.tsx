import { useEffect, useState } from "react";
import { pointApi, type PointHistoryDto } from "../../api/pointApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import type { PageResult } from "../../types/board";
import Pagination from "../../components/ui/Pagination";

const POINT_TYPE_LABEL: Record<string, string> = {
  BOARD_WRITE: "게시글 작성",
  REPLY_WRITE: "댓글 작성",
  CHILD_REPLY_WRITE: "대댓글 작성",
  BOARD_LIKE_RECEIVED: "게시글 좋아요 받기",
  REPLY_LIKE_RECEIVED: "댓글 좋아요 받기",
  MUSIC_QUIZ: "음악 퀴즈",
  ALBUM_QUIZ: "앨범 퀴즈",
  CARD_QUIZ: "카드 퀴즈",
  CRITIC_WRITE: "평론 작성",
  POINT_DEDUCT: "포인트 차감",
};

const PointHistoryPage = () => {
  const [pageData, setPageData] = useState<PageResult<PointHistoryDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector((state: RootState) => state.auth.user);

  const loadPage = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await pointApi.getHistory({ page, size: 15 });
      setPageData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    loadPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  if (isLoading) return <div className="text-center text-white py-20">로딩 중...</div>;

  return (
    <div className="mx-auto max-w-2xl p-6 text-white">
      {/* 헤더 */}
      <div className="mb-8 rounded-xl border border-neutral-700 bg-neutral-900 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">현재 등급</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                user?.grade === "LEGEND"
                  ? "text-cyan-400"
                  : user?.grade === "MAESTRO"
                    ? "text-yellow-400"
                    : user?.grade === "SOLOIST"
                      ? "text-gray-300"
                      : user?.grade === "SESSION"
                        ? "text-amber-600"
                        : "text-black-400"
              }`}
            >
              {user?.grade ?? "ENSEMBLE"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">보유 포인트</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">
              {(user?.totalPoint ?? 0).toLocaleString()} P
            </p>
          </div>
        </div>

        {/* 등급 진행 바 */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>다음 등급까지</span>
            <span>
              {user?.grade === "SESSION"
                ? `${10000 - (user?.totalPoint ?? 0)}P`
                : user?.grade === "SOLOIST"
                  ? `${50000 - (user?.totalPoint ?? 0)}P`
                  : user?.grade === "MAESTRO"
                    ? `${100000 - (user?.totalPoint ?? 0)}P`
                    : user?.grade === "LEGEND"
                      ? `${200000 - (user?.totalPoint ?? 0)}P`
                      : "최고 등급"}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-700">
            <div
              className="h-2 rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${Math.min(
                  user?.grade === "BRONZE"
                    ? ((user?.totalPoint ?? 0) / 10000) * 100
                    : user?.grade === "SILVER"
                      ? (((user?.totalPoint ?? 0) - 10000) / 40000) * 100
                      : user?.grade === "GOLD"
                        ? (((user?.totalPoint ?? 0) - 50000) / 50000) * 100
                        : 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 포인트 내역 */}
      <h2 className="text-xl font-bold mb-4">포인트 내역</h2>

      {!pageData || pageData.dtoList.length === 0 ? (
        <p className="text-center text-gray-500 py-12">포인트 내역이 없어요.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {pageData.dtoList.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded border border-neutral-700 bg-neutral-900 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {POINT_TYPE_LABEL[item.pointType] ?? item.pointType}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span
                  className={`font-bold text-sm ${
                    item.amount > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {item.amount > 0 ? `+${item.amount}` : item.amount} P
                </span>
              </li>
            ))}
          </ul>

          {/* 페이지네이션 */}
          {pageData.pageNumList.length > 0 && (
            <div className="mt-6">
              <Pagination
                pageNumList={pageData.pageNumList}
                current={pageData.current}
                prev={pageData.prev}
                next={pageData.next}
                prevPage={pageData.prevPage}
                nextPage={pageData.nextPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          <div className="mt-4 text-center text-sm text-gray-400">
            전체 {pageData.totalCount}개 · {pageData.current} 페이지
          </div>
        </>
      )}
    </div>
  );
};

export default PointHistoryPage;
