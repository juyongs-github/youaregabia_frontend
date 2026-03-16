import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useEffect, useRef, useState } from "react";
import { FaHeadphones, FaSearch, FaTimes, FaBell } from "react-icons/fa";
import { BiSolidUser } from "react-icons/bi";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import { logout } from "../../store/authSlice";
import api from "../../api/axios";
import { usePoint } from "../../store/usePoint";

interface NotificationItem {
  id: number;
  message: string;
  boardId: number;
  isRead: boolean;
  createdAt: string;
}

function Header() {
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

  const gradeColor = {
    ENSEMBLE: "text-black-400",
    SESSION: "text-amber-600",
    SOLOIST: "text-gray-300",
    MAESTRO: "text-yellow-400",
    LEGEND: "text-cyan-400",
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

  // 알림 상태
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
    const interval = setInterval(fetchNotifications, 30000); // 30초마다 폴링
    return () => clearInterval(interval);
  }, [isLogin]);

  // 외부 클릭 시 드롭다운 닫기
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
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-10 py-5 bg-black border-b border-gray-800 gap-7">
      {/* 로고 부분 */}
      <div className="flex items-center flex-shrink-0 gap-8">
        <button
          className="flex items-center gap-3"
          onClick={() => goPage(user?.role === "ADMIN" ? "/admin" : "/home")}
        >
          <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full">
            <FaHeadphones size={20} color="white" />
          </div>
          <span className="text-2xl font-semibold">GAP Music</span>
        </button>
      </div>

      {/* 검색바 부분 */}
      <div className="relative flex-shrink-0">
        <input
          type="text"
          placeholder="검색"
          value={searchValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (!searchValue.trim()) {
                alert("검색어를 입력 해주세요.");
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
          className="px-16 py-3 text-white bg-gray-800 rounded-full w-[50rem] focus:outline-none focus:ring-2 focus:ring-white"
        />
        <FaSearch className="absolute text-gray-400 left-6 top-3.5" size={20} />
        {searchValue && (
          <button
            onClick={() => setSearchValue("")}
            className="absolute text-gray-400 right-6 top-3.5 hover:text-white transition-colors"
          >
            <FaTimes size={20} />
          </button>
        )}
      </div>

      {/* 알림 + 유저 프로필 */}
      <div className="flex items-center gap-4">
        {/* 포인트/등급 표시 */}
        {isLogin && (
          <button
            onClick={() => navigate("/profile/points")}
            className="flex items-center gap-2 rounded-full border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800 transition-colors"
          >
            <span
              className={`text-xs font-bold ${gradeColor[grade as keyof typeof gradeColor] ?? "text-amber-600"}`}
            >
              {grade}
            </span>
            <span className="text-xs text-gray-400">{totalPoint.toLocaleString()}P</span>
          </button>
        )}
        {/* 알림 벨 */}
        {isLogin && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2 text-gray-300 hover:text-white transition-colors"
            >
              <FaBell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* 알림 드롭다운 */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                  <span className="font-bold text-white text-sm">알림</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">알림이 없습니다.</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                          !n.isRead ? "bg-gray-800/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          <div className={!n.isRead ? "" : "ml-4"}>
                            <p className="text-sm text-white leading-snug">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{n.createdAt.slice(0, 10)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 아바타 메뉴 */}
        <IconButton onClick={handleClick} size="small">
          <Avatar
            src={user?.imgUrl ? `http://localhost:8080${user.imgUrl}` : undefined}
            sx={{
              width: 35,
              height: 35,
              bgcolor: user?.imgUrl ? "transparent" : "#3b82f6",
            }}
          >
            {!user?.imgUrl && (user?.name ? user.name[0] : "U")}
          </Avatar>
        </IconButton>

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
              style: { backgroundColor: "#2c2c2c", marginTop: "8px" },
            },
          }}
        >
          <MenuItem
            onClick={() => goPage("/profile/me")}
            sx={{
              color: "white",
              fontWeight: "bold",
              py: 1.5,
              "&:hover": { backgroundColor: "#3d3d3d" },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <BiSolidUser size={20} />
            </ListItemIcon>
            <ListItemText>내 프로필</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{
              color: "white",
              fontWeight: "bold",
              py: 1.5,
              "&:hover": { backgroundColor: "#3d3d3d" },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <RiLogoutBoxRLine size={20} />
            </ListItemIcon>
            <ListItemText>로그아웃</ListItemText>
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
}

export default Header;
