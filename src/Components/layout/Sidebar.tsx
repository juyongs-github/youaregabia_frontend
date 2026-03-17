import { useState } from "react";
import { FaChevronDown, FaCompass, FaGamepad, FaHome, FaMinus, FaUsers, FaShoppingBag } from "react-icons/fa";
import { PiPlaylistBold } from "react-icons/pi";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  // 현재 어떤 메뉴가 열려 있는지 관리 (null이면 모두 닫힘)
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  // 토글메뉴와 연동하여 하나의 메뉴만 열리도록
  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const goPage = (path: string) => {
    if (location.pathname === path) {
      window.location.reload();
    } else {
      navigate(path);
    }
  };


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
            onClick={() => toggleMenu("recommend")}
            className="flex items-center w-full gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          >
            <FaCompass size={24} />
            <span>추천</span>
            <FaChevronDown
              size={16}
              className={`ml-auto transition-transform ${openMenu === "recommend" ? "rotate-180" : ""}`}
            />
          </button>

          {/* 추천 하위 메뉴 */}
          {openMenu === "recommend" && (
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
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/recommend/critic")}
              >
                <FaMinus size={12} />
                <span>음악 평론</span>
              </button>
            </div>
          )}
        </div>

        {/* 플레이리스트 메뉴 */}
        <div>
          <button
            onClick={() => toggleMenu("playlist")}
            className="flex items-center w-full gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          >
            <PiPlaylistBold size={24} />
            <span>플레이리스트</span>
            <FaChevronDown
              size={16}
              className={`ml-auto transition-transform ${openMenu === "playlist" ? "rotate-180" : ""}`}
            />
          </button>

          {/* 플레이리스트 하위 메뉴 */}
          {openMenu === "playlist" && (
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
            onClick={() => toggleMenu("community")}
            className="flex items-center w-full gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          >
            <FaUsers size={24} />
            <span>커뮤니티</span>
            <FaChevronDown
              size={16}
              className={`ml-auto transition-transform${openMenu === "community" ? "rotate-180" : ""}`}
            />
          </button>

          {/* 커뮤니티 하위 메뉴 */}
          {openMenu === "community" && (
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
        {/* 굿즈샵 메뉴 */}
        <button
          className="flex items-center gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          onClick={() => goPage("/goods")}
        >
          <FaShoppingBag size={24} />
          <span>굿즈샵</span>
        </button>

        {/* 게임 메뉴 */}
        <div>
          <button
            onClick={() => toggleMenu("game")}
            className="flex items-center w-full gap-5 px-3 py-2 text-white rounded-lg hover:bg-gray-800"
          >
            <FaGamepad size={24} />
            <span>게임</span>
            <FaChevronDown
              size={16}
              className={`ml-auto transition-transform ${openMenu === "game" ? "rotate-180" : ""}`}
            />
          </button>

          {/* 게임 하위 메뉴 */}
          {openMenu === "game" && (
            <div className="mt-3 ml-5 space-y-2 text-[17px] font-semibold">
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/game/music-quiz")}
              >
                <FaMinus size={12} />
                <span>노래 맞추기</span>
              </button>
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/game/album-quiz")}
              >
                <FaMinus size={12} />
                <span>앨범 맞추기</span>
              </button>
              <button
                className="flex items-center w-full gap-3 px-3 py-2 text-left text-gray-400 rounded-lg hover:bg-gray-800"
                onClick={() => goPage("/game/card-match")}
              >
                <FaMinus size={12} />
                <span>카드 맞추기</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
