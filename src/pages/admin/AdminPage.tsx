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

interface LoginLog {
  id: number;
  userId: number;
  name: string;
  email: string;
  loginType: string;
  ip: string;
  loginAt: string;
}

interface ActivityLog {
  type: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
}

const ROLES = ["USER", "CRITIC", "ADMIN"];
type Tab = "users" | "loginLogs" | "activityLogs";

function AdminPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    api.get("/api/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => alert("유저 목록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    if (activeTab === "loginLogs" && loginLogs.length === 0) {
      api.get("/api/admin/logs/login").then((res) => setLoginLogs(res.data));
    }
    if (activeTab === "activityLogs" && activityLogs.length === 0) {
      api.get("/api/admin/logs/activity").then((res) => setActivityLogs(res.data));
    }
  }, [activeTab, user?.role]);

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

  const loginTypeLabel = (type: string) => {
    if (type === "GOOGLE") return { text: "구글", color: "text-blue-400" };
    if (type === "KAKAO") return { text: "카카오", color: "text-yellow-400" };
    if (type === "NAVER") return { text: "네이버", color: "text-green-400" };
    return { text: "일반", color: "text-gray-400" };
  };

  if (user?.role !== "ADMIN") return <Navigate to="/home" replace />;
  if (loading) return <div className="text-white text-center mt-20">로딩 중...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "회원 관리" },
    { key: "loginLogs", label: "접속 로그" },
    { key: "activityLogs", label: "활동 로그" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 text-white overflow-x-hidden">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">관리자 페이지</h1>
      <p className="text-gray-400 text-base mb-6">전체 회원 목록 및 권한 관리</p>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-base font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-blue-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 회원 관리 */}
      {activeTab === "users" && (
        <>
          <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
            <table className="min-w-[860px] w-full text-base">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 whitespace-nowrap">
                  <th className="text-left px-6 py-5">ID</th>
                  <th className="text-left px-6 py-5">이름</th>
                  <th className="text-left px-6 py-5">이메일</th>
                  <th className="text-left px-6 py-5">전화번호</th>
                  <th className="text-left px-6 py-5">현재 권한</th>
                  <th className="text-left px-6 py-5">권한 변경</th>
                  <th className="text-left px-6 py-5">가입일</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const label = roleLabel(u.role);
                  return (
                    <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors whitespace-nowrap">
                      <td className="px-6 py-5 text-gray-500">{u.id}</td>
                      <td className="px-6 py-5 font-medium">{u.name}</td>
                      <td className="px-6 py-5 text-gray-300">{u.email || "-"}</td>
                      <td className="px-6 py-5 text-gray-300">{u.phoneNumber}</td>
                      <td className={`px-6 py-5 font-medium ${label.color}`}>{label.text}</td>
                      <td className="px-6 py-5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-6 py-1.5 text-base text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r === "ADMIN" ? "관리자" : r === "CRITIC" ? "평론가" : "일반"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-5 text-gray-500">{u.createdAt?.slice(0, 10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-gray-500 text-center py-12">회원이 없습니다.</p>}
          </div>
          <p className="text-gray-600 text-sm mt-4">총 {users.length}명</p>
        </>
      )}

      {/* 접속 로그 */}
      {activeTab === "loginLogs" && (
        <>
          <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
            <table className="min-w-[780px] w-full text-base">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 whitespace-nowrap">
                  <th className="text-left px-6 py-5">이름</th>
                  <th className="text-left px-6 py-5">이메일</th>
                  <th className="text-left px-6 py-5">로그인 방식</th>
                  <th className="text-left px-6 py-5">IP</th>
                  <th className="text-left px-6 py-5">접속 시간</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.map((log) => {
                  const lt = loginTypeLabel(log.loginType);
                  return (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors whitespace-nowrap">
                      <td className="px-6 py-4 font-medium">{log.name}</td>
                      <td className="px-6 py-4 text-gray-300">{log.email}</td>
                      <td className={`px-6 py-4 font-medium ${lt.color}`}>{lt.text}</td>
                      <td className="px-6 py-4 text-gray-400">{log.ip}</td>
                      <td className="px-6 py-4 text-gray-400">{log.loginAt?.replace("T", " ").slice(0, 19)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loginLogs.length === 0 && <p className="text-gray-500 text-center py-12">접속 기록이 없습니다.</p>}
          </div>
          <p className="text-gray-600 text-sm mt-4">최근 {loginLogs.length}건</p>
        </>
      )}

      {/* 활동 로그 */}
      {activeTab === "activityLogs" && (
        <>
          <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
            <table className="min-w-[780px] w-full text-base">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 whitespace-nowrap">
                  <th className="text-left px-6 py-5">유형</th>
                  <th className="text-left px-6 py-5">이름</th>
                  <th className="text-left px-6 py-5">이메일</th>
                  <th className="text-left px-6 py-5">내용</th>
                  <th className="text-left px-6 py-5">작성 시간</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors whitespace-nowrap">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-sm font-medium ${log.type === "게시글" ? "bg-blue-900/50 text-blue-300" : "bg-purple-900/50 text-purple-300"}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{log.name}</td>
                    <td className="px-6 py-4 text-gray-300">{log.email}</td>
                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{log.content}</td>
                    <td className="px-6 py-4 text-gray-400">{log.createdAt?.replace("T", " ").slice(0, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activityLogs.length === 0 && <p className="text-gray-500 text-center py-12">활동 기록이 없습니다.</p>}
          </div>
          <p className="text-gray-600 text-sm mt-4">최근 {activityLogs.length}건</p>
        </>
      )}
    </div>
  );
}

export default AdminPage;
