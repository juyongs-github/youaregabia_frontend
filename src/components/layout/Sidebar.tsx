import { useState } from "react";
import {
  FaChevronDown,
  FaCompass,
  FaGamepad,
  FaHome,
  FaUsers,
  FaShoppingBag,
} from "react-icons/fa";
import { PiPlaylistBold } from "react-icons/pi";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import "../../styles/sidebar-kfandom.css";

function Sidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role;

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const goPage = (path: string) => {
    onClose?.();
    if (location.pathname === path) {
      window.location.reload();
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  const profileInitial = user?.name?.trim()?.slice(0, 1) || "G";
  const roleLabel =
    userRole === "ADMIN" ? "Admin Hub" : userRole === "CRITIC" ? "Critic Mode" : "Fan Mode";

  return (
    <aside className={`kf-side-shell${isOpen ? " kf-sidebar-open" : ""}`}>
      <div className="kf-side-card">
        {/* Brand / user */}
        <div className="kf-side-brand">
          <div className="kf-side-brand__mark">{profileInitial}</div>
          <div className="kf-side-brand__copy">
            <strong>{user?.name || "GAP Music"}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>

        {/* Status chip */}
        <div className="kf-side-status">
          <span className="kf-side-status__dot" />
          모두가 소통하는 음악커뮤니티
        </div>

        {/* Nav */}
        <nav className="kf-side-nav">
          {/* 홈 */}
          <button
            className={`kf-side-item${isActive(userRole === "ADMIN" ? "/admin" : "/home") ? " is-active" : ""}`}
            onClick={() => goPage(userRole === "ADMIN" ? "/admin" : "/home")}
          >
            <span className="kf-side-item__icon">
              <FaHome size={18} />
            </span>
            홈
          </button>

          {/* 추천 */}
          <div className="kf-side-group">
            <button
              className={`kf-side-item${isActivePrefix("/recommend") ? " is-active" : ""}`}
              onClick={() => toggleMenu("recommend")}
            >
              <span className="kf-side-item__icon">
                <FaCompass size={18} />
              </span>
              추천
              <span className={`kf-side-chevron${openMenu === "recommend" ? " is-open" : ""}`}>
                <FaChevronDown size={13} />
              </span>
            </button>
            {openMenu === "recommend" && (
              <div className="kf-side-submenu">
                <button
                  className={`kf-side-subitem${isActive("/recommend/blind") ? " is-active" : ""}`}
                  onClick={() => goPage("/recommend/blind")}
                >
                  블라인드 곡 추천
                </button>
                <button
                  className={`kf-side-subitem${isActive("/recommend/worldcup") ? " is-active" : ""}`}
                  onClick={() => goPage("/recommend/worldcup")}
                >
                  이상형 월드컵 곡 추천
                </button>
                <button
                  className={`kf-side-subitem${isActive("/recommend/critic") ? " is-active" : ""}`}
                  onClick={() => goPage("/recommend/critic")}
                >
                  음악 평론
                </button>
              </div>
            )}
          </div>

          {/* 플레이리스트 */}
          <div className="kf-side-group">
            <button
              className={`kf-side-item${isActivePrefix("/playlist") ? " is-active" : ""}`}
              onClick={() => toggleMenu("playlist")}
            >
              <span className="kf-side-item__icon">
                <PiPlaylistBold size={18} />
              </span>
              플레이리스트
              <span className={`kf-side-chevron${openMenu === "playlist" ? " is-open" : ""}`}>
                <FaChevronDown size={13} />
              </span>
            </button>
            {openMenu === "playlist" && (
              <div className="kf-side-submenu">
                <button
                  className={`kf-side-subitem${isActive("/playlist/me") ? " is-active" : ""}`}
                  onClick={() => goPage("/playlist/me")}
                >
                  내 플레이리스트
                </button>
                <button
                  className={`kf-side-subitem${isActive("/playlist/review") ? " is-active" : ""}`}
                  onClick={() => goPage("/playlist/review")}
                >
                  추천 플레이리스트 리뷰
                </button>
              </div>
            )}
          </div>

          {/* 커뮤니티 */}
          <div className="kf-side-group">
            <button
              className={`kf-side-item${isActivePrefix("/community") ? " is-active" : ""}`}
              onClick={() => toggleMenu("community")}
            >
              <span className="kf-side-item__icon">
                <FaUsers size={18} />
              </span>
              커뮤니티
              <span className={`kf-side-chevron${openMenu === "community" ? " is-open" : ""}`}>
                <FaChevronDown size={13} />
              </span>
            </button>
            {openMenu === "community" && (
              <div className="kf-side-submenu">
                <button
                  className={`kf-side-subitem${isActive("/community/share") ? " is-active" : ""}`}
                  onClick={() => goPage("/community/share")}
                >
                  플레이리스트 공유
                </button>
                <button
                  className={`kf-side-subitem${isActive("/community/collabo") ? " is-active" : ""}`}
                  onClick={() => goPage("/community/collabo")}
                >
                  공동 플레이리스트 제작
                </button>
                <button
                  className={`kf-side-subitem${isActive("/community/free") ? " is-active" : ""}`}
                  onClick={() => goPage("/community/free")}
                >
                  자유게시판
                </button>
              </div>
            )}
          </div>

          {/* 굿즈샵 */}
          <button
            className={`kf-side-item${isActivePrefix("/goods") ? " is-active" : ""}`}
            onClick={() => goPage("/goods")}
          >
            <span className="kf-side-item__icon">
              <FaShoppingBag size={18} />
            </span>
            굿즈샵
          </button>

          {/* 게임 */}
          <div className="kf-side-group">
            <button
              className={`kf-side-item${isActivePrefix("/game") ? " is-active" : ""}`}
              onClick={() => toggleMenu("game")}
            >
              <span className="kf-side-item__icon">
                <FaGamepad size={18} />
              </span>
              게임
              <span className={`kf-side-chevron${openMenu === "game" ? " is-open" : ""}`}>
                <FaChevronDown size={13} />
              </span>
            </button>
            {openMenu === "game" && (
              <div className="kf-side-submenu">
                <button
                  className={`kf-side-subitem${isActive("/game/music-quiz") ? " is-active" : ""}`}
                  onClick={() => goPage("/game/music-quiz")}
                >
                  노래 맞추기
                </button>
                <button
                  className={`kf-side-subitem${isActive("/game/album-quiz") ? " is-active" : ""}`}
                  onClick={() => goPage("/game/album-quiz")}
                >
                  앨범 맞추기
                </button>
                <button
                  className={`kf-side-subitem${isActive("/game/card-match") ? " is-active" : ""}`}
                  onClick={() => goPage("/game/card-match")}
                >
                  카드 맞추기
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
