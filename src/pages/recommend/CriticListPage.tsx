import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import type { Board, PageResult } from "../../types/board";
import Pagination from "../../components/ui/Pagination";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

const CriticListPage = () => {
  const [pageData, setPageData] = useState<PageResult<Board> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  const loadPage = async (page: number, search?: string) => {
    try {
      const data = await boardApi.getCriticList({ page, size: 10 }, search);
      setPageData(data);
    } catch (error) {
      console.error("평론 목록 로드 실패:", error);
    }
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  const handleSearch = () => {
    setSearchKeyword(keyword);
    loadPage(1, keyword);
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleKeyReset = () => {
    setKeyword("");
    setSearchKeyword("");
    loadPage(1);
  };

  const handlePageChange = (page: number) => {
    loadPage(page, searchKeyword);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!pageData) {
    return <div className="p-4 text-center text-white">로딩 중...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4 text-white">
      {/* 헤더 */}
      <div className="mt-8 mb-6 flex items-end justify-between border-b border-neutral-700 pb-5">
        <div>
          <h2 className="text-3xl font-bold text-white">음악 평론</h2>
          <p className="mt-2 text-sm text-gray-400">전문 평론가들의 음악 이야기를 만나보세요.</p>
        </div>
        {userRole === "CRITIC" && (
          <button
            onClick={() => navigate("/recommend/critic/write")}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            평론 작성
          </button>
        )}
      </div>

      {/* 검색바 */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="평론 제목으로 검색..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleEnter}
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-500"
        >
          검색
        </button>
        {searchKeyword && (
          <button
            onClick={handleKeyReset}
            className="rounded border border-neutral-700 px-4 py-2 text-gray-400 hover:bg-neutral-800"
          >
            전체
          </button>
        )}
      </div>

      {searchKeyword && (
        <div className="mb-2 text-sm text-gray-400">
          '{searchKeyword}' 검색 결과: {pageData.totalCount}개
        </div>
      )}

      {/* 평론 목록 */}
      <ul className="divide-y divide-neutral-700 rounded border border-neutral-700">
        {pageData.dtoList.length > 0 ? (
          pageData.dtoList.map((board) => (
            <li key={board.boardId}>
              <button
                className="block w-full px-4 py-4 text-left hover:bg-neutral-800"
                onClick={() => navigate(`/recommend/critic/${board.boardId}`)}
              >
                {/* 평론 대상 곡 */}
                {board.songs && board.songs.length > 0 && (
                  <div className="mb-2 flex items-center gap-2">
                    <img src={board.songs[0].imgUrl} className="w-8 h-8 rounded object-cover" />
                    <span className="text-xs text-gray-400">
                      {board.songs[0].trackName} - {board.songs[0].artistName}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{board.title}</span>
                  <span className="text-sm text-gray-500">{board.writer}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span>{new Date(board.createdAt).toLocaleDateString("ko-KR")}</span>
                  <span>조회 {board.viewCount}</span>
                </div>
              </button>
            </li>
          ))
        ) : (
          <li className="px-4 py-8 text-center text-gray-500">평론이 없습니다.</li>
        )}
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
    </div>
  );
};

export default CriticListPage;
