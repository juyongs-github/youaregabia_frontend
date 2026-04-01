import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useEffect, useRef, useState } from "react";
import { FaSearch, FaTimes, FaShoppingCart, FaClipboardList } from "react-icons/fa";
import { BiSolidUser } from "react-icons/bi";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import { logout } from "../../store/authSlice";
import api from "../../api/axios";
import { usePoint } from "../../store/usePoint";
import "../../styles/header-kfandom.css";

interface NotificationItem {
  id: number;
  message: string;
  boardId: number;
  isRead: boolean;
  createdAt: string;
}

function Header({ showSearch = true }: { showSearch?: boolean }) {
  const isLogin = useSelector((state: RootState) => state.auth.isLoggedIn);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { totalPoint, grade } = usePoint();

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate("/login");
  };

  const goPage = (path: string) => {
    if (location.pathname === path) {
      window.location.reload();
    } else {
      navigate(path);
    }
  };

  const [searchValue, setSearchValue] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: NotificationItem) => !n.isRead).length);
    } catch {
      // 비로그인 시 무시
    }
  };

  useEffect(() => {
    if (!isLogin) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isLogin]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleNotifClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await api.patch(`/api/notifications/${n.id}/read`);
    }
    setNotifOpen(false);
    if (n.boardId) navigate(`/community/share/${n.boardId}`);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await api.patch("/api/notifications/read-all");
    fetchNotifications();
  };

  return (
    <div className="kf-header-wrap">
      <header className="kf-header">
        {/* 브랜드 */}
        <button
          className="kf-header__brand"
          onClick={() => goPage(user?.role === "ADMIN" ? "/admin" : "/home")}
        >
          <span className="kf-header__brandMark">G</span>
          <span className="kf-header__brandCopy">
            <strong className="kf-header__brandTitle">GAP Music</strong>
            <span className="kf-header__brandSub">K-Fandom Hub Edition</span>
          </span>
        </button>

        {/* 검색바 */}
        {showSearch && (
          <div className="kf-header__search">
            <input
              type="text"
              placeholder="검색"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!searchValue.trim()) {
                    alert("검색어를 입력해주세요.");
                    return;
                  }
                  const url = `/search?q=${encodeURIComponent(searchValue)}`;
                  if (location.pathname + location.search === url) {
                    navigate(url, { replace: true, state: { refresh: Date.now() } });
                  } else {
                    navigate(url);
                  }
                }
              }}
              className="kf-header__searchInput"
            />
            {searchValue ? (
              <button className="kf-header__searchClear" onClick={() => setSearchValue("")}>
                <FaTimes size={16} />
              </button>
            ) : (
              <span className="kf-header__searchIcon">
                <FaSearch size={16} />
              </span>
            )}
          </div>
        )}

        {/* 우측 액션 영역 */}
        <div className="kf-header__actions">
          {/* 등급/포인트 칩 */}
          {isLogin && (
            <button
              className="kf-header__chip"
              onClick={() => navigate("/profile/points")}
            >
              <span className="kf-header__chipDot" />
              {grade} · {totalPoint.toLocaleString()}P
            </button>
          )}

          {/* 알림 버튼 */}
          {isLogin && (
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                className="kf-header__iconBtn"
                aria-label="알림"
                onClick={() => setNotifOpen((prev) => !prev)}
              >
                {unreadCount > 0 && (
                  <span className="kf-header__iconBadge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 17a2 2 0 0 0 4 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {notifOpen && (
                <div className="kf-notif-dropdown">
                  <div className="kf-notif-header">
                    <span>알림</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead}>모두 읽음</button>
                    )}
                  </div>
                  <div className="kf-notif-list">
                    {notifications.length === 0 ? (
                      <p className="kf-notif-empty">알림이 없습니다.</p>
                    ) : (
                      notifications.slice(0, 4).map((n) => (
                        <button
                          key={n.id}
                          className={`kf-notif-item${!n.isRead ? " unread" : ""}`}
                          onClick={() => handleNotifClick(n)}
                        >
                          {!n.isRead && <span className="kf-notif-dot" />}
                          <div style={n.isRead ? { marginLeft: 18 } : {}}>
                            <p className="kf-notif-msg">{n.message}</p>
                            <p className="kf-notif-date">{n.createdAt.slice(0, 10)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 프로필 버튼 */}
          <button
            className="kf-header__profileBtn"
            aria-label="프로필"
            onClick={handleClick}
          >
            {user?.imgUrl ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL ?? ""}${user.imgUrl}`}
                alt="프로필"
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              user?.name ? user.name[0] : "U"
            )}
          </button>

          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            slotProps={{
              paper: {
                style: {
                  backgroundColor: "rgba(255,255,255,0.96)",
                  backdropFilter: "blur(18px)",
                  borderRadius: 16,
                  border: "1px solid rgba(88,95,138,0.10)",
                  boxShadow: "0 24px 60px rgba(80,90,140,0.16)",
                  marginTop: 8,
                },
              },
            }}
          >
            <MenuItem
              onClick={() => goPage("/profile/me")}
              sx={{ color: "#1f2430", fontWeight: 700, py: 1.5, "&:hover": { backgroundColor: "rgba(109,94,252,0.06)" } }}
            >
              <ListItemIcon sx={{ color: "#6d5efc" }}>
                <BiSolidUser size={20} />
              </ListItemIcon>
              <ListItemText>내 프로필</ListItemText>
            </MenuItem>
            {user?.role !== "ADMIN" && (
              <MenuItem
                onClick={() => goPage("/goods/cart")}
                sx={{ color: "#1f2430", fontWeight: 700, py: 1.5, "&:hover": { backgroundColor: "rgba(109,94,252,0.06)" } }}
              >
                <ListItemIcon sx={{ color: "#6d5efc" }}>
                  <FaShoppingCart size={18} />
                </ListItemIcon>
                <ListItemText>장바구니</ListItemText>
              </MenuItem>
            )}
            {user?.role !== "ADMIN" && (
              <MenuItem
                onClick={() => goPage("/goods/orders")}
                sx={{ color: "#1f2430", fontWeight: 700, py: 1.5, "&:hover": { backgroundColor: "rgba(109,94,252,0.06)" } }}
              >
                <ListItemIcon sx={{ color: "#6d5efc" }}>
                  <FaClipboardList size={18} />
                </ListItemIcon>
                <ListItemText>주문 내역</ListItemText>
              </MenuItem>
            )}
            <MenuItem
              onClick={handleLogout}
              sx={{ color: "#ff5b6e", fontWeight: 700, py: 1.5, "&:hover": { backgroundColor: "rgba(255,91,110,0.06)" } }}
            >
              <ListItemIcon sx={{ color: "#ff5b6e" }}>
                <RiLogoutBoxRLine size={20} />
              </ListItemIcon>
              <ListItemText>로그아웃</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </header>
    </div>
  );
}

export default Header;
