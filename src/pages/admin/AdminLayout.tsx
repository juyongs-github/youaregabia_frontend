import "../../styles/admin-kfandom.css";
import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaUsers,
  FaSignInAlt,
  FaListAlt,
  FaBox,
  FaShoppingCart,
  FaHome,
  FaSignOutAlt,
  FaCoins,
  FaCommentDots,
  FaBars,
} from "react-icons/fa";
import type { RootState } from "../../store";
import { logout } from "../../store/authSlice";

const navItems = [
  { to: "/admin", label: "대시보드", icon: FaHome, end: true },
  { to: "/admin/users", label: "회원 관리", icon: FaUsers },
  { to: "/admin/login-logs", label: "접속 로그", icon: FaSignInAlt },
  { to: "/admin/activity-logs", label: "활동 로그", icon: FaListAlt },
  { to: "/admin/goods", label: "굿즈 관리", icon: FaBox },
  { to: "/admin/orders", label: "결제 내역", icon: FaShoppingCart },
  { to: "/admin/points", label: "포인트 관리", icon: FaCoins },
  { to: "/admin/inquiries", label: "문의 내역", icon: FaCommentDots },
];

export default function AdminLayout() {
  const isLogin = useSelector((state: RootState) => state.auth.isLoggedIn);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLogin) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/home" replace />;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="kf-admin flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="kf-admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`kf-admin-sidebar w-52 shrink-0 flex flex-col py-6 sticky top-0 h-screen overflow-y-auto${sidebarOpen ? " open" : ""}`}>
        <div className="px-5 mb-6">
          <p className="kf-admin-label">Admin Panel</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `kf-admin-nav-link${isActive ? " active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3">
          <button onClick={handleLogout} className="kf-admin-logout">
            <FaSignOutAlt size={14} />
            관리자 접속 종료
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="kf-admin-content flex-1 overflow-auto p-8">
        {/* Mobile header row */}
        <div className="kf-admin-mobile-header">
          <button
            className="kf-admin-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="메뉴 열기"
          >
            <FaBars size={16} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1f2430" }}>Admin Panel</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
