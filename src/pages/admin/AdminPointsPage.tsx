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

  if (loading) return <div className="text-center mt-20" style={{color:"#64748b"}}>로딩 중...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">포인트 관리</h1>
        <p className="text-sm mt-1" style={{color:"#4b5563"}}>총 {rows.length}명</p>
      </div>

      {/* 탭 */}
      <div className="kf-admin-tab-bar flex gap-1 mb-5">
        <button
          onClick={() => setTab("manage")}
          className={`kf-admin-tab${tab === "manage" ? " active" : ""}`}
        >
          포인트 관리
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`kf-admin-tab${tab === "logs" ? " active" : ""}`}
        >
          지급 / 차감 로그
        </button>
      </div>

      {/* 포인트 관리 탭 */}
      {tab === "manage" && (
        <div className="kf-admin-table-wrap w-full overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead>
              <tr className="whitespace-nowrap">
                <th className="text-left px-5 py-4 font-medium">ID</th>
                <th className="text-left px-5 py-4 font-medium">이름</th>
                <th className="text-left px-5 py-4 font-medium">이메일</th>
                <th className="text-left px-5 py-4 font-medium">등급</th>
                <th className="text-left px-5 py-4 font-medium">보유 포인트</th>
                <th className="text-left px-5 py-4 font-medium">포인트 조정</th>
              </tr>
            </thead>
            <tbody>
              {rows.filter((row) => row.email !== "admin@naver.com").map((row) => {
                const grade = GRADE_LABEL[row.grade] ?? { text: row.grade, color: "text-gray-400" };
                const isWithdrawn = row.email?.includes("@delete.com");
                const isDisabled = isWithdrawn || processing === row.userId;
                return (
                  <tr key={row.userId} className={`whitespace-nowrap ${isWithdrawn ? "opacity-50" : ""}`}>
                    <td className="px-5 py-4" style={{color:"#64748b"}}>{row.userId}</td>
                    <td className="px-5 py-4 font-medium">
                      {row.name}
                      {isWithdrawn && <span className="ml-2 text-xs text-red-400">(탈퇴)</span>}
                    </td>
                    <td className="px-5 py-4" style={{color:"#4b5563"}}>{row.email || "-"}</td>
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
                          placeholder={isWithdrawn ? "탈퇴한 회원" : "포인트 입력"}
                          disabled={isDisabled}
                          className="w-32 px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                        <button
                          onClick={() => handleAdjust(row.userId, "grant")}
                          disabled={isDisabled}
                          className="kf-admin-btn-primary rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                        >
                          {processing === row.userId ? "..." : "지급"}
                        </button>
                        <button
                          onClick={() => handleAdjust(row.userId, "deduct")}
                          disabled={isDisabled}
                          className="kf-admin-btn-danger rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
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
            <p className="text-center py-12" style={{color:"#64748b"}}>포인트 데이터가 없습니다.</p>
          )}
        </div>
      )}

      {/* 지급/차감 로그 탭 */}
      {tab === "logs" && (
        <div className="kf-admin-table-wrap w-full overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead>
              <tr className="whitespace-nowrap">
                <th className="text-left px-5 py-4 font-medium">이름</th>
                <th className="text-left px-5 py-4 font-medium">이메일</th>
                <th className="text-left px-5 py-4 font-medium">유형</th>
                <th className="text-left px-5 py-4 font-medium">포인트</th>
                <th className="text-left px-5 py-4 font-medium">일시</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="whitespace-nowrap">
                  <td className="px-5 py-4 font-medium">{log.name}</td>
                  <td className="px-5 py-4" style={{color:"#4b5563"}}>{log.email || "-"}</td>
                  <td className="px-5 py-4">
                    <span className={log.pointType === "ADMIN_GRANT" ? "kf-badge-blue" : "kf-badge-red"}>
                      {log.description}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-semibold ${log.amount > 0 ? "text-blue-500" : "text-red-500"}`}>
                    {log.amount > 0 ? `+${log.amount.toLocaleString()}` : log.amount.toLocaleString()}P
                  </td>
                  <td className="px-5 py-4" style={{color:"#64748b"}}>
                    {log.createdAt?.slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-center py-12" style={{color:"#64748b"}}>지급/차감 내역이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
