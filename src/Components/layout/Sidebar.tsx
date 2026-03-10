import { useState } from "react";
import { FaChevronDown, FaCompass, FaHome, FaMinus, FaUsers } from "react-icons/fa";
import { PiPlaylistBold } from "react-icons/pi";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  const goPage = (path: string) => {
    if (location.pathname === path) {
      window.location.reload();
    } else {
      navigate(path);
    }
  };

  const [isRecommendMenuOpen, setIsRecommendMenuOpen] = useState<boolean>(false);
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState<boolean>(false);
  const [isCommunityMenuOpen, setIsCommunityMenuOpen] = useState<boolean>(false);

  return (
    <aside className="fixed left-0 border-r border-gray-800 w-80 top-20 h-[calc(100vh-5rem)]">
      <nav className="flex flex-col p-5 pt-10 text-xl font-bold gap-7">
        <button
          className="flex items-center gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          onClick={() => goPage(userRole === "ADMIN" ? "/admin" : "/home")}
        >
          <FaHome size={24} />
          <span>홈</span>
        </button>
        {/* 추천 메뉴 */}
        <div>
          <button
            onClick={() => setIsRecommendMenuOpen(!isRecommendMenuOpen)}
            className="flex items-center w-full gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          >
            <FaCompass size={24} />
            <span>추천</span>
            <FaChevronDown
              size={16}
              className={`ml-auto transition-transform ${isRecommendMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* 추천 하위 메뉴 */}
          {isRecommendMenuOpen && (
            <div className="mt-3 ml-5 space-y-2 text-[17px] font-semibold">
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/recommend/blind")}
              >
                <FaMinus size={12} />
                <span>블라인드 곡 추천</span>
              </button>
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/recommend/worldcup")}
              >
                <FaMinus size={12} />
                <span>이상형 월드컵 곡 추천</span>
              </button>
            </div>
          )}
        </div>

        {/* 플레이리스트 메뉴 */}
        <div>
          <button
            onClick={() => setIsPlaylistMenuOpen(!isPlaylistMenuOpen)}
            className="flex items-center w-full gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          >
            <PiPlaylistBold size={24} />
            <span>플레이리스트</span>
            <FaChevronDown
              size={16}
              className={`ml-auto transition-transform ${isPlaylistMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* 플레이리스트 하위 메뉴 */}
          {isPlaylistMenuOpen && (
            <div className="mt-3 ml-5 space-y-2 text-[17px] font-semibold">
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/playlist/me")}
              >
                <FaMinus size={12} />
                <span>내 플레이리스트</span>
              </button>
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/playlist/review")}
              >
                <FaMinus size={12} />
                <span>추천 플레이리스트 리뷰</span>
              </button>
            </div>
          )}
        </div>

        {/* 커뮤니티 메뉴 */}
        <div>
          <button
            onClick={() => setIsCommunityMenuOpen(!isCommunityMenuOpen)}
            className="flex items-center w-full gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          >
            <FaUsers size={24} />
            <span>커뮤니티</span>
            <FaChevronDown
              size={16}
              className={`ml-auto transition-transform ${isCommunityMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* 커뮤니티 하위 메뉴 */}
          {isCommunityMenuOpen && (
            <div className="mt-3 ml-5 space-y-2 text-[17px] font-semibold">
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/community/share")}
              >
                <FaMinus size={12} />
                <span>플레이리스트 공유</span>
              </button>
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/community/collabo")}
              >
                <FaMinus size={12} />
                <span>공동 플레이리스트 제작</span>
              </button>
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/community/free")}
              >
                <FaMinus size={12} />
                <span>자유게시판</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
