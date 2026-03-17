// pages/BoardListPage.tsx
import { useEffect, useState } from "react";
import { boardApi } from "../../api/boardApi";
import type { Board, PageResult } from "../../types/board";
import { useNavigate } from "react-router-dom";
import Pagination from "../../Components/ui/Pagination";
import BoardSortBar from "../../Components/ui/BoardSortBar";
import BoardItem from "../../Components/ui/BoardItem";

const FreeBoardListPage = () => {
  // 페이징 관리
  const [pageData, setPageData] = useState<PageResult<Board> | null>(null);
  // 검색기능
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const [genre] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState("latest");

  // 페이지 데이터 불러오기
  const loadPage = async (page: number, search?: string, currentGenre?: string, sort?: string) => {
    try {
      const params: {
        page: number;
        size: number;
        boardType?: "FREE";
        keyword?: string;
        genre?: string;
        sort?: string;
      } = {
        page,
        size: 10,
        boardType: "FREE" as const,
        sort: sort ?? sortBy,
      };
      if (search) {
        params.keyword = search;
      }
      if (currentGenre) {
        params.genre = currentGenre; // 클로저 대신 파라미터 사용
      }
      const data = await boardApi.getBoards(params);
      console.log(" 백엔드 응답:", data);
      console.log(" dtoList:", data.dtoList);
      setPageData(data);
    } catch (error) {
      console.error("게시글 로드 실패:", error);
    }
  };

  //  처음 로드
  useEffect(() => {
    loadPage(1, searchKeyword, genre); // genre를 파라미터로 전달
  }, [genre]);

  //  페이지 변경
  const handlePageChange = (page: number) => {
    loadPage(page, searchKeyword, genre); // genre를 파라미터로 전달
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 검색
  const handleSearch = () => {
    setSearchKeyword(keyword);
    loadPage(1, keyword, genre);
  };

  // 엔터키 검색
  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 검색 후 초기화
  const handleKeyReset = () => {
    setKeyword("");
    setSearchKeyword("");
    loadPage(1, undefined, genre);
  };

  // 정렬 바뀔 때 1페이지로 이동
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    loadPage(1, searchKeyword, genre, sort);
  };

  //  로딩 중
  if (!pageData) {
    return <div className="p-4 text-center">로딩 중...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* 상단 헤더 */}
      <div className="mt-8 mb-6 flex items-end justify-between border-b border-neutral-700 pb-5">
        <div>
          <h2 className="text-3xl font-bold text-white">자유게시판</h2>
          <p className="mt-2 text-sm text-gray-400">주제에 상관없이 편한 시간을 보내세요.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 글쓰기 버튼 */}
          <button
            // h-[42px]로 셀렉트박스와 높이를 맞췄습니다.
            className="h-[42px] flex items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
            onClick={() => navigate("/community/free/new")}
          >
            새 글 쓰기
          </button>
        </div>
      </div>

      <BoardSortBar sortBy={sortBy} onChange={handleSortChange} />
      {/* 게시글 목록 Item으로 뺌 */}
      <ul className="divide-y divide-neutral-700 rounded border border-neutral-700">
        {pageData.dtoList.length > 0 ? (
          pageData.dtoList.map((board) => <BoardItem key={board.boardId} board={board} />)
        ) : (
          <li className="px-4 py-8 text-center text-gray-500">게시글이 없습니다</li>
        )}
      </ul>

      {/* 검색바 */}
      <div className="mb-4 flex gap-2">
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
            전체글
          </button>
        )}
      </div>
      {/* 검색 결과 표시 */}
      {searchKeyword && (
        <div className="mb-2 text-sm text-gray-400">
          '{searchKeyword}' 검색 결과: {pageData.totalCount}개
        </div>
      )}
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

      {/* 페이지 정보 */}
      <div className="mt-4 text-center text-sm text-gray-400">
        전체 {pageData.totalCount}개 · {pageData.current} 페이지
      </div>
    </div>
  );
};

export default FreeBoardListPage;
