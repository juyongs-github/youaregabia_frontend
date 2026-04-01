import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import type { Board, PageResult } from "../../types/board";
import Pagination from "../../Components/ui/Pagination";
import "../../styles/CriticListPage.kfandom.css";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import BoardSortBar from "../../Components/ui/BoardSortBar";
import BoardItem from "../../Components/ui/BoardItem";

const CriticListPage = () => {
  const [pageData, setPageData] = useState<PageResult<Board> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const [sortBy, setSortBy] = useState("latest");

  const loadPage = async (page: number, search?: string, sort?: string) => {
    try {
      // params 객체 타입을 명시하여 타입 에러 방지
      const params: {
        page: number;
        size: number;
        sort?: string;
      } = {
        page,
        size: 10,
        sort: sort ?? sortBy,
      };

      const data = await boardApi.getCriticList(params, search);
      setPageData(data);
    } catch (error) {
      console.error("평론 목록 로드 실패:", error);
    }
  };
  // 초기 로드
  useEffect(() => {
    loadPage(1);
  }, []);

  // 검색 실행
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

  // 페이지 변경
  const handlePageChange = (page: number) => {
    loadPage(page, searchKeyword);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 정렬 바뀔 때 1페이지로 이동
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    loadPage(1, searchKeyword, sort);
  };

  if (!pageData) {
    return <div className="p-4 text-center text-white">로딩 중...</div>;
  }

  return (
    <div className="kf-expansion-page kf-critic-list">
      {/* 헤더 */}
      <div className="flex items-end justify-between px-6 py-5">
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
      <div className="mt-5 mb-4 flex gap-2">
        <input
          type="text"
          placeholder="검색"
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

      {/* 정렬 바 */}
      <div className="mb-4">
        <BoardSortBar sortBy={sortBy} onChange={handleSortChange} />
      </div>

      {/* 평론 목록 */}
      <ul className="divide-y divide-neutral-700 rounded border border-neutral-700">
        {pageData.dtoList.length > 0 ? (
          pageData.dtoList.map((board) => (
            <BoardItem key={board.boardId} board={board} basePath="/recommend/critic" />
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
