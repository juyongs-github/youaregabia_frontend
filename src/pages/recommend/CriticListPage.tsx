import { useEffect, useState } from "react";
import { boardApi } from "../../api/boardApi";
import type { Board, PageResult, TabType } from "../../types/board";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import BoardTabBar from "../../Components/ui/BoardTabBar";
import PopularTab from "../../Components/ui/PopularTab";
import BoardListTemplate from "../../Components/ui/BoardListTemplate";

const CriticListPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  // 전체글 상태
  const [pageData, setPageData] = useState<PageResult<Board> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // 인기글 상태
  const [popularBoards, setPopularBoards] = useState<Board[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  const loadPage = async (page: number, search?: string, sort?: string) => {
    try {
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

  const loadPopularBoards = async () => {
    if (popularBoards.length > 0) return;
    try {
      setPopularLoading(true);
      const data = await boardApi.getPopularBoards("CRITIC");
      setPopularBoards(data);
    } catch (error) {
      console.error("인기글 로드 실패:", error);
    } finally {
      setPopularLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "POPULAR") loadPopularBoards();
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    loadPage(page, searchKeyword);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    loadPage(1, searchKeyword, sort);
  };

  if (!pageData) return <div className="p-4 text-center text-white">로딩 중...</div>;

  return (
    <div className="mx-auto max-w-4xl p-4 text-white">
      {/* 상단 헤더 */}
      <div className="mt-8 mb-6 flex items-end justify-between border-b border-neutral-700 pb-5">
        <div>
          <h2 className="text-3xl font-bold text-white">음악 평론</h2>
          <p className="mt-2 text-sm text-gray-400">전문 평론가들의 음악 이야기를 만나보세요.</p>
        </div>
        {userRole === "CRITIC" && (
          <button
            onClick={() => navigate("/recommend/critic/write")}
            className="h-[42px] flex items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
          >
            평론 작성
          </button>
        )}
      </div>

      <BoardTabBar activeTab={activeTab} onChange={handleTabChange} />

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

export default CriticListPage;
