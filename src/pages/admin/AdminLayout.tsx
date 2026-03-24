import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
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
];

export default function AdminLayout() {
  const isLogin = useSelector((state: RootState) => state.auth.isLoggedIn);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  if (!isLogin) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/home" replace />;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen text-white bg-gray-950">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col py-6 sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Admin Panel
          </p>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <FaSignOutAlt size={14} />
            관리자 접속 종료
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
