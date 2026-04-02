import { useEffect, useState } from "react";
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

const roleLabel = (role: string) => {
  if (role === "ADMIN") return { text: "관리자", color: "text-red-400" };
  if (role === "CRITIC") return { text: "평론가", color: "text-yellow-400" };
  return { text: "일반", color: "text-gray-400" };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => alert("유저 목록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } catch {
      alert("권한 변경에 실패했습니다.");
    }
  };

  if (loading) return <div className="text-center mt-20" style={{color:"#64748b"}}>로딩 중...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <p className="text-sm mt-1" style={{color:"#4b5563"}}>총 {users.length}명</p>
      </div>

      <div className="kf-admin-table-wrap w-full overflow-x-auto">
        <table className="min-w-[860px] w-full text-sm">
          <thead>
            <tr className="whitespace-nowrap">
              <th className="text-left px-5 py-4 font-medium">ID</th>
              <th className="text-left px-5 py-4 font-medium">이름</th>
              <th className="text-left px-5 py-4 font-medium">이메일</th>
              <th className="text-left px-5 py-4 font-medium">전화번호</th>
              <th className="text-left px-5 py-4 font-medium">현재 권한</th>
              <th className="text-left px-5 py-4 font-medium">권한 변경</th>
              <th className="text-left px-5 py-4 font-medium">가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const label = roleLabel(u.role);
              return (
                <tr key={u.id} className="whitespace-nowrap">
                  <td className="px-5 py-4" style={{color:"#c0c6d4"}}>{u.id}</td>
                  <td className="px-5 py-4 font-semibold">{u.name}</td>
                  <td className="px-5 py-4" style={{color:"#4b5563"}}>{u.email || "-"}</td>
                  <td className="px-5 py-4" style={{color:"#4b5563"}}>{u.phoneNumber}</td>
                  <td className={`px-5 py-4 font-semibold ${label.color}`}>{label.text}</td>
                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="pl-3 pr-6 py-1.5 text-sm cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r === "ADMIN" ? "관리자" : r === "CRITIC" ? "평론가" : "일반"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4" style={{color:"#64748b"}}>{u.createdAt?.slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center py-12" style={{color:"#64748b"}}>회원이 없습니다.</p>}
      </div>
    </div>
  );
}
