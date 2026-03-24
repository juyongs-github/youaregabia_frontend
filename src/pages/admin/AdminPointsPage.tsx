import { useEffect, useState } from "react";
import api from "../../api/axios";

interface UserPointRow {
  userId: number;
  name: string;
  email: string;
  totalPoint: number;
  grade: string;
}

interface PointLog {
  id: number;
  name: string;
  email: string;
  pointType: string;
  description: string;
  amount: number;
  createdAt: string;
}

const GRADE_LABEL: Record<string, { text: string; color: string }> = {
  ENSEMBLE: { text: "앙상블", color: "text-gray-400" },
  SESSION:  { text: "세션",   color: "text-blue-400" },
  SOLOIST:  { text: "솔로이스트", color: "text-green-400" },
  MAESTRO:  { text: "마에스트로", color: "text-yellow-400" },
  LEGEND:   { text: "레전드",  color: "text-red-400" },
};

export default function AdminPointsPage() {
  const [tab, setTab] = useState<"manage" | "logs">("manage");
  const [rows, setRows] = useState<UserPointRow[]>([]);
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustInputs, setAdjustInputs] = useState<Record<number, string>>({});
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchPoints();
  }, []);

  useEffect(() => {
    if (tab === "logs") fetchLogs();
  }, [tab]);

  const fetchPoints = () => {
    api.get<UserPointRow[]>("/api/admin/points")
      .then((res) => setRows(res.data))
      .catch(() => alert("포인트 목록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  };

  const fetchLogs = () => {
    api.get<PointLog[]>("/api/admin/points/logs")
      .then((res) => setLogs(res.data))
      .catch(() => alert("로그를 불러오는데 실패했습니다."));
  };

  const handleAdjust = async (userId: number, type: "grant" | "deduct") => {
    const raw = adjustInputs[userId];
    const value = parseInt(raw || "0", 10);
    if (!value || isNaN(value) || value <= 0) {
      alert("포인트를 1 이상 입력해주세요.");
      return;
    }
    const amount = type === "grant" ? value : -value;
    setProcessing(userId);
    try {
      await api.post(`/api/admin/points/${userId}/adjust`, { amount });
      setAdjustInputs((prev) => ({ ...prev, [userId]: "" }));
      fetchPoints();
    } catch {
      alert("포인트 조정에 실패했습니다.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="text-gray-400 text-center mt-20">로딩 중...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">포인트 관리</h1>
        <p className="text-gray-400 text-sm mt-1">총 {rows.length}명</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-5 border-b border-gray-800">
        <button
          onClick={() => setTab("manage")}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "manage"
              ? "border-yellow-500 text-yellow-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          포인트 관리
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "logs"
              ? "border-yellow-500 text-yellow-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          지급 / 차감 로그
        </button>
      </div>

      {/* 포인트 관리 탭 */}
      {tab === "manage" && (
        <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
          <table className="min-w-[860px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 whitespace-nowrap">
                <th className="text-left px-5 py-4 font-medium">ID</th>
                <th className="text-left px-5 py-4 font-medium">이름</th>
                <th className="text-left px-5 py-4 font-medium">이메일</th>
                <th className="text-left px-5 py-4 font-medium">등급</th>
                <th className="text-left px-5 py-4 font-medium">보유 포인트</th>
                <th className="text-left px-5 py-4 font-medium">포인트 조정</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const grade = GRADE_LABEL[row.grade] ?? { text: row.grade, color: "text-gray-400" };
                return (
                  <tr key={row.userId} className="border-b border-gray-800 hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                    <td className="px-5 py-4 text-gray-600">{row.userId}</td>
                    <td className="px-5 py-4 font-medium">{row.name}</td>
                    <td className="px-5 py-4 text-gray-300">{row.email || "-"}</td>
                    <td className={`px-5 py-4 font-medium ${grade.color}`}>{grade.text}</td>
                    <td className="px-5 py-4 text-yellow-400 font-semibold">
                      {row.totalPoint.toLocaleString()}P
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min={1}
                          value={adjustInputs[row.userId] ?? ""}
                          onChange={(e) =>
                            setAdjustInputs((prev) => ({ ...prev, [row.userId]: e.target.value }))
                          }
                          placeholder="포인트 입력"
                          className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                        />
                        <button
                          onClick={() => handleAdjust(row.userId, "grant")}
                          disabled={processing === row.userId}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-colors"
                        >
                          {processing === row.userId ? "..." : "지급"}
                        </button>
                        <button
                          onClick={() => handleAdjust(row.userId, "deduct")}
                          disabled={processing === row.userId}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-colors"
                        >
                          {processing === row.userId ? "..." : "차감"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-gray-500 text-center py-12">포인트 데이터가 없습니다.</p>
          )}
        </div>
      )}

      {/* 지급/차감 로그 탭 */}
      {tab === "logs" && (
        <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
          <table className="min-w-[860px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 whitespace-nowrap">
                <th className="text-left px-5 py-4 font-medium">이름</th>
                <th className="text-left px-5 py-4 font-medium">이메일</th>
                <th className="text-left px-5 py-4 font-medium">유형</th>
                <th className="text-left px-5 py-4 font-medium">포인트</th>
                <th className="text-left px-5 py-4 font-medium">일시</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                  <td className="px-5 py-4 font-medium">{log.name}</td>
                  <td className="px-5 py-4 text-gray-300">{log.email || "-"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.pointType === "ADMIN_GRANT"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {log.description}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-semibold ${log.amount > 0 ? "text-blue-400" : "text-red-400"}`}>
                    {log.amount > 0 ? `+${log.amount.toLocaleString()}` : log.amount.toLocaleString()}P
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {log.createdAt?.slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-gray-500 text-center py-12">지급/차감 내역이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
