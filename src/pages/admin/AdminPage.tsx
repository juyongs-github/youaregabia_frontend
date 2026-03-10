import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../../store";
import api from "../../api/axios";

interface UserRow {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  state: number;
  createdAt: string;
}

const ROLES = ["USER", "CRITIC", "ADMIN"];

function AdminPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    api.get("/api/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => alert("유저 목록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } catch {
      alert("권한 변경에 실패했습니다.");
    }
  };

  const roleLabel = (role: string) => {
    if (role === "ADMIN") return { text: "관리자", color: "text-red-400" };
    if (role === "CRITIC") return { text: "평론가", color: "text-yellow-400" };
    return { text: "일반", color: "text-gray-400" };
  };

  if (user?.role !== "ADMIN") return <Navigate to="/home" replace />;
  if (loading) return <div className="text-white text-center mt-20">로딩 중...</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-8 text-white">
      <h1 className="text-2xl font-bold mb-2">관리자 페이지</h1>
      <p className="text-gray-400 text-sm mb-8">전체 회원 목록 및 권한 관리</p>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">이름</th>
              <th className="text-left p-4">이메일</th>
              <th className="text-left p-4">전화번호</th>
              <th className="text-left p-4">현재 권한</th>
              <th className="text-left p-4">권한 변경</th>
              <th className="text-left p-4">가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const label = roleLabel(u.role);
              return (
                <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 text-gray-500">{u.id}</td>
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-gray-300">{u.email || "-"}</td>
                  <td className="p-4 text-gray-300">{u.phoneNumber}</td>
                  <td className={`p-4 font-medium ${label.color}`}>{label.text}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r === "ADMIN" ? "관리자" : r === "CRITIC" ? "평론가" : "일반"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-gray-500">{u.createdAt?.slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="text-gray-500 text-center py-12">회원이 없습니다.</p>
        )}
      </div>

      <p className="text-gray-600 text-xs mt-4">총 {users.length}명</p>
    </div>
  );
}

export default AdminPage;
