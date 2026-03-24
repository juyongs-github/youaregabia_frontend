import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaBox, FaShoppingCart, FaSignInAlt } from "react-icons/fa";
import api from "../../api/axios";

interface Stats {
  userCount: number;
  goodsCount: number;
  orderCount: number;
  loginCount: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/admin/users"),
      api.get("/api/goods"),
      api.get("/admin/orders"),
      api.get("/admin/logs/login"),
    ])
      .then(([users, goods, orders, logs]) => {
        setStats({
          userCount: users.data.length,
          goodsCount: goods.data.length,
          orderCount: orders.data.length,
          loginCount: logs.data.length,
        });
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      label: "전체 회원",
      value: stats?.userCount,
      icon: FaUsers,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      path: "/admin/users",
    },
    {
      label: "등록 상품",
      value: stats?.goodsCount,
      icon: FaBox,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      path: "/admin/goods",
    },
    {
      label: "전체 주문",
      value: stats?.orderCount,
      icon: FaShoppingCart,
      color: "text-green-400",
      bg: "bg-green-400/10",
      path: "/admin/orders",
    },
    {
      label: "접속 로그",
      value: stats?.loginCount,
      icon: FaSignInAlt,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      path: "/admin/login-logs",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-gray-400 text-sm mt-1">전체 서비스 현황</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400 font-medium">{label}</p>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className="text-3xl font-bold">
              {value == null ? (
                <span className="text-gray-600 text-xl">로딩중</span>
              ) : (
                value.toLocaleString()
              )}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
