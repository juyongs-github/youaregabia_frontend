import { useEffect, useState } from "react";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ConfirmToast from "../../components/ui/ConfirmToast";
import { useConfirmToast } from "../../hooks/useConfirmToast";

interface ActivityLog {
  type: string;
  targetId: number;
  name: string;
  email: string;
  content: string;
  createdAt: string;
}

export default function AdminActivityLogsPage() {
  const { toast, showToast, closeToast } = useToast();
  const { confirmToast, confirm, closeConfirm } = useConfirmToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/logs/activity")
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (log: ActivityLog) => {
    const label = log.type === "게시글" ? "게시글" : "댓글";
    const confirmed = await confirm(`이 ${label}을 삭제하시겠습니까?`);
    if (!confirmed) return;
    const endpoint = log.type === "게시글"
      ? `/api/admin/boards/${log.targetId}`
      : `/api/admin/replies/${log.targetId}`;
    try {
      await api.delete(endpoint);
      setLogs((prev) => prev.filter((l) => !(l.type === log.type && l.targetId === log.targetId)));
    } catch {
      showToast("삭제에 실패했습니다.", "error");
    }
  };

  if (loading) return <div className="text-center mt-20" style={{color:"#64748b"}}>로딩 중...</div>;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <ConfirmToast state={confirmToast} onClose={closeConfirm} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">활동 로그</h1>
        <p className="text-sm mt-1" style={{color:"#4b5563"}}>최근 {logs.length}건</p>
      </div>

      <div className="kf-admin-table-wrap w-full overflow-x-auto">
        <table className="min-w-[880px] w-full text-sm">
          <thead>
            <tr className="whitespace-nowrap">
              <th className="text-left px-5 py-4 font-medium">유형</th>
              <th className="text-left px-5 py-4 font-medium">이름</th>
              <th className="text-left px-5 py-4 font-medium">이메일</th>
              <th className="text-left px-5 py-4 font-medium">내용</th>
              <th className="text-left px-5 py-4 font-medium">작성 시간</th>
              <th className="text-left px-5 py-4 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="whitespace-nowrap">
                <td className="px-5 py-4">
                  <span className={log.type === "게시글" ? "kf-badge-blue" : "kf-badge-purple"}>
                    {log.type}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold">{log.name}</td>
                <td className="px-5 py-4" style={{color:"#4b5563"}}>{log.email}</td>
                <td className="px-5 py-4 max-w-xs truncate" style={{color:"#4b5563"}}>{log.content}</td>
                <td className="px-5 py-4" style={{color:"#64748b"}}>{log.createdAt?.replace("T", " ").slice(0, 19)}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => handleDelete(log)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-gray-500 text-center py-12">활동 기록이 없습니다.</p>}
      </div>
    </div>
  );
}
