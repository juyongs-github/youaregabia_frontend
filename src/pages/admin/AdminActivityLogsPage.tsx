import { useEffect, useState } from "react";
import api from "../../api/axios";

interface ActivityLog {
  type: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/logs/activity")
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-center mt-20">로딩 중...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">활동 로그</h1>
        <p className="text-gray-400 text-sm mt-1">최근 {logs.length}건</p>
      </div>

      <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
        <table className="min-w-[780px] w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 whitespace-nowrap">
              <th className="text-left px-5 py-4 font-medium">유형</th>
              <th className="text-left px-5 py-4 font-medium">이름</th>
              <th className="text-left px-5 py-4 font-medium">이메일</th>
              <th className="text-left px-5 py-4 font-medium">내용</th>
              <th className="text-left px-5 py-4 font-medium">작성 시간</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.type === "게시글" ? "bg-blue-900/50 text-blue-300" : "bg-purple-900/50 text-purple-300"}`}>
                    {log.type}
                  </span>
                </td>
                <td className="px-5 py-4 font-medium">{log.name}</td>
                <td className="px-5 py-4 text-gray-300">{log.email}</td>
                <td className="px-5 py-4 text-gray-300 max-w-xs truncate">{log.content}</td>
                <td className="px-5 py-4 text-gray-400">{log.createdAt?.replace("T", " ").slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-gray-500 text-center py-12">활동 기록이 없습니다.</p>}
      </div>
    </div>
  );
}
