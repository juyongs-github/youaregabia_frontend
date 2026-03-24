import { useEffect, useState } from "react";
import api from "../../api/axios";

interface LoginLog {
  id: number;
  userId: number;
  name: string;
  email: string;
  loginType: string;
  ip: string;
  loginAt: string;
}

const loginTypeLabel = (type: string) => {
  if (type === "GOOGLE") return { text: "구글", color: "text-blue-400" };
  if (type === "KAKAO") return { text: "카카오", color: "text-yellow-400" };
  if (type === "NAVER") return { text: "네이버", color: "text-green-400" };
  return { text: "일반", color: "text-gray-400" };
};

export default function AdminLoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/logs/login")
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-center mt-20">로딩 중...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">접속 로그</h1>
        <p className="text-gray-400 text-sm mt-1">최근 {logs.length}건</p>
      </div>

      <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
        <table className="min-w-[780px] w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 whitespace-nowrap">
              <th className="text-left px-5 py-4 font-medium">이름</th>
              <th className="text-left px-5 py-4 font-medium">이메일</th>
              <th className="text-left px-5 py-4 font-medium">로그인 방식</th>
              <th className="text-left px-5 py-4 font-medium">IP</th>
              <th className="text-left px-5 py-4 font-medium">접속 시간</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const lt = loginTypeLabel(log.loginType);
              return (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                  <td className="px-5 py-4 font-medium">{log.name}</td>
                  <td className="px-5 py-4 text-gray-300">{log.email}</td>
                  <td className={`px-5 py-4 font-medium ${lt.color}`}>{lt.text}</td>
                  <td className="px-5 py-4 text-gray-400">{log.ip}</td>
                  <td className="px-5 py-4 text-gray-400">{log.loginAt?.replace("T", " ").slice(0, 19)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-gray-500 text-center py-12">접속 기록이 없습니다.</p>}
      </div>
    </div>
  );
}
