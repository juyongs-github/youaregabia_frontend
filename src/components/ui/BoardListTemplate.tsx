import type { Board, PageResult } from "../../types/board";
import BoardItem from "./BoardItem";
import BoardSortBar from "./BoardSortBar";
import Pagination from "./Pagination";

interface Props {
  pageData: PageResult<Board>;
  keyword: string;
  searchKeyword: string;
  sortBy: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onEnter: (e: React.KeyboardEvent) => void;
  onReset: () => void;
  onSortChange: (sort: string) => void;
  onPageChange: (page: number) => void;
}

const BoardListTemplate = ({
  pageData,
  keyword,
  searchKeyword,
  sortBy,
  onKeywordChange,
  onSearch,
  onEnter,
  onReset,
  onSortChange,
  onPageChange,
}: Props) => {
  return (
    <>
      <BoardSortBar sortBy={sortBy} onChange={onSortChange} />

      <ul className="divide-y divide-gray-200 rounded border border-gray-200">
        {pageData.dtoList.length > 0 ? (
          pageData.dtoList.map((board) => <BoardItem key={board.boardId} board={board} />)
        ) : (
          <li className="px-4 py-8 text-center text-gray-400">게시글이 없습니다</li>
        )}
      </ul>

      {/* 검색바 */}
      <div className="mt-4 mb-4 flex gap-2">
        <input
          type="text"
          placeholder="검색"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onKeyDown={onEnter}
          className="flex-1 rounded border border-gray-200 bg-white/80 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none backdrop-blur-sm"
        />
        <button
          onClick={onSearch}
          className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-500"
        >
          검색
        </button>
        {searchKeyword && (
          <button
            onClick={onReset}
            className="rounded border border-gray-200 px-4 py-2 text-gray-500 hover:bg-gray-50"
          >
            전체글
          </button>
        )}
      </div>

      {searchKeyword && (
        <div className="mb-2 text-sm text-gray-500">
          '{searchKeyword}' 검색 결과: {pageData.totalCount}개
        </div>
      )}

      {pageData.pageNumList.length > 0 && (
        <div className="mt-6">
          <Pagination
            pageNumList={pageData.pageNumList}
            current={pageData.current}
            prev={pageData.prev}
            next={pageData.next}
            prevPage={pageData.prevPage}
            nextPage={pageData.nextPage}
            onPageChange={onPageChange}
          />
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-500">
        전체 {pageData.totalCount}개 · {pageData.current} 페이지
      </div>
    </>
  );
};

export default BoardListTemplate;
