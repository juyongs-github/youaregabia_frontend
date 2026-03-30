// pages/BoardListPage.tsx
import { useEffect, useState } from "react";
import { boardApi } from "../../api/boardApi";
import type { Board, PageResult, TabType } from "../../types/board";
import { useNavigate } from "react-router-dom";
import BoardTabBar from "../../Components/ui/BoardTabBar";
import PopularTab from "../../Components/ui/PopularTab";
import BoardListTemplate from "../../Components/ui/BoardListTemplate";

const BoardListPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  // 전체글 상태
  const [pageData, setPageData] = useState<PageResult<Board> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [genre, setGenre] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState("latest");

  // 인기글 상태
  const [popularBoards, setPopularBoards] = useState<Board[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

  const navigate = useNavigate();

  // 전체글 로드
  const loadPage = async (page: number, search?: string, currentGenre?: string, sort?: string) => {
    try {
      const params: {
        page: number;
        size: number;
        keyword?: string;
        genre?: string;
        boardType?: "PLAYLIST_SHARE";
        sort?: string;
      } = {
        page,
        size: 10,
        boardType: "PLAYLIST_SHARE" as const,
        sort: sort ?? sortBy,
      };
      if (search) params.keyword = search;
      if (currentGenre) params.genre = currentGenre;

      const data = await boardApi.getBoards(params);
      setPageData(data);
    } catch (error) {
      console.error("게시글 로드 실패:", error);
    }
  };

  // 인기글 로드 - 탭 진입 시 한 번만
  const loadPopularBoards = async () => {
    if (popularBoards.length > 0) return;
    try {
      setPopularLoading(true);
      const data = await boardApi.getPopularBoards("PLAYLIST_SHARE");
      setPopularBoards(data);
    } catch (error) {
      console.error("인기글 로드 실패:", error);
    } finally {
      setPopularLoading(false);
    }
  };

  // 탭 변경 시
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "POPULAR") loadPopularBoards();
  };

  // 처음 로드
  useEffect(() => {
    loadPage(1, searchKeyword, genre);
  }, [genre]);

  const handlePageChange = (page: number) => {
    loadPage(page, searchKeyword, genre);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = () => {
    setSearchKeyword(keyword);
    loadPage(1, keyword, genre);
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleKeyReset = () => {
    setKeyword("");
    setSearchKeyword("");
    loadPage(1, undefined, genre);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    loadPage(1, searchKeyword, genre, sort);
  };

  if (!pageData) return <div className="p-4 text-center">로딩 중...</div>;

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* 상단 헤더 */}
      <div className="mt-8 mb-6 flex items-end justify-between border-b border-neutral-700 pb-5">
        <div>
          <h2 className="text-3xl font-bold text-white">플레이리스트 공유</h2>
          <p className="mt-2 text-sm text-gray-400">다양한 장르의 음악을 함께 나눠보세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={genre || ""}
              onChange={(e) => setGenre(e.target.value === "" ? undefined : e.target.value)}
              className="h-[42px] appearance-none rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 pr-10 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">모든 장르</option>
              <option value="KPOP">KPOP</option>
              <option value="JPOP">JPOP</option>
              <option value="POP">POP</option>
              <option value="HIPHOP">HIPHOP</option>
              <option value="ROCK">ROCK</option>
            </select>
          </div>
          <button
            className="h-[42px] flex items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
            onClick={() => navigate("/community/share/new")}
          >
            새 글 쓰기
          </button>
        </div>
      </div>

      {/* 탭 버튼 */}
      <BoardTabBar activeTab={activeTab} onChange={handleTabChange} />

      {/* 탭 컨텐츠 */}
      {activeTab === "POPULAR" && <PopularTab boards={popularBoards} loading={popularLoading} />}
      {activeTab === "ALL" && (
        <BoardListTemplate
          pageData={pageData}
          keyword={keyword}
          searchKeyword={searchKeyword}
          sortBy={sortBy}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onEnter={handleEnter}
          onReset={handleKeyReset}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default BoardListPage;
