import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaBox, FaShoppingCart, FaSignInAlt } from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend,
} from "recharts";
import api from "../../api/axios";

interface Stats {
  userCount: number;
  goodsCount: number;
  orderCount: number;
  loginCount: number;
}

interface LoginLog {
  loginAt: string;
}

interface OrderRow {
  status: string;
  createdAt: string;
}

interface UserRow {
  createdAt: string;
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "주문접수",
  PAID: "결제완료",
  SHIPPED: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "취소",
};
const PIE_COLORS = ["#f59e0b", "#34d399", "#60a5fa", "#9ca3af", "#f87171"];

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return days;
}

function toMMDD(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/users"),
      api.get("/api/goods"),
      api.get("/api/admin/orders"),
      api.get("/api/admin/logs/login"),
    ]).then(([usersRes, goodsRes, ordersRes, logsRes]) => {
      setStats({
        userCount: usersRes.data.length,
        goodsCount: goodsRes.data.length,
        orderCount: ordersRes.data.length,
        loginCount: logsRes.data.length,
      });
      setLoginLogs(logsRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
    }).catch(() => {});
  }, []);

  const cards = [
    { label: "전체 회원", value: stats?.userCount, icon: FaUsers, color: "text-blue-400", path: "/admin/users" },
    { label: "등록 상품", value: stats?.goodsCount, icon: FaBox, color: "text-purple-400", path: "/admin/goods" },
    { label: "전체 주문", value: stats?.orderCount, icon: FaShoppingCart, color: "text-green-400", path: "/admin/orders" },
    { label: "접속 로그", value: stats?.loginCount, icon: FaSignInAlt, color: "text-yellow-400", path: "/admin/login-logs" },
  ];

  // 최근 7일 접속 현황
  const days7 = getLast7Days();
  const loginChartData = days7.map((day) => ({
    day,
    접속수: loginLogs.filter((l) => toMMDD(l.loginAt) === day).length,
  }));

  // 최근 7일 신규 가입
  const joinChartData = days7.map((day) => ({
    day,
    가입수: users.filter((u) => toMMDD(u.createdAt) === day).length,
  }));

  // 주문 상태 분포
  const statusMap: Record<string, number> = {};
  orders.forEach((o) => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
  const orderPieData = Object.entries(statusMap).map(([status, count], i) => ({
    name: ORDER_STATUS_LABEL[status] ?? status,
    value: count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm mt-1" style={{ color: "#4b5563" }}>전체 서비스 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, path }) => (
          <button key={label} onClick={() => navigate(path)} className="kf-admin-stat-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: "#4b5563" }}>{label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(109,94,252,0.10)" }}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: "#1f2430" }}>
              {value == null
                ? <span className="text-xl" style={{ color: "#c0c6d4" }}>로딩중</span>
                : value.toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      {/* 차트 2열 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        {/* 최근 7일 접속 */}
        <div className="kf-admin-card p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: "#1f2430" }}>최근 7일 접속 현황</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={loginChartData} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e8ef", borderRadius: 8, fontSize: 13 }}
                cursor={{ fill: "rgba(109,94,252,0.06)" }}
              />
              <Bar dataKey="접속수" fill="#6d5efc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 최근 7일 신규 가입 */}
        <div className="kf-admin-card p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: "#1f2430" }}>최근 7일 신규 가입</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={joinChartData} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e8ef", borderRadius: 8, fontSize: 13 }}
                cursor={{ fill: "rgba(52,211,153,0.06)" }}
              />
              <Bar dataKey="가입수" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 주문 상태 분포 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="kf-admin-card p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: "#1f2430" }}>주문 상태 분포</p>
          {orderPieData.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: "#64748b" }}>주문 데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry) => `${value} ${(entry as { payload?: { value: number } }).payload?.value ?? ""}건`}
                  wrapperStyle={{ fontSize: 12, color: "#4b5563", paddingTop: 8 }}
                />
                <Tooltip
                  formatter={(value, name) => [`${value}건`, name]}
                  contentStyle={{ background: "#fff", border: "1px solid #e5e8ef", borderRadius: 8, fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 최근 접속 목록 */}
        <div className="kf-admin-card p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: "#1f2430" }}>최근 접속 회원</p>
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 220 }}>
            {loginLogs.slice(0, 8).map((log, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 kf-divider">
                <span className="text-sm font-medium truncate max-w-[180px]" style={{ color: "#1f2430" }}>
                  {(log as LoginLog & { email?: string }).email ?? "—"}
                </span>
                <span className="text-xs" style={{ color: "#64748b" }}>
                  {log.loginAt?.replace("T", " ").slice(0, 16)}
                </span>
              </div>
            ))}
            {loginLogs.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "#64748b" }}>접속 기록이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
