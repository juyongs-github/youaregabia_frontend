import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Inquiry {
  id: number;
  type: string;
  content: string;
  status: string;
  createdAt: string;
  email: string | null;
  userName: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  "서비스 이용": "kf-badge-blue",
  "결제/환불":   "kf-badge-purple",
  "계정":        "kf-badge-green",
  "버그 신고":   "kf-badge-red",
  "기타":        "kf-badge-gray",
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"전체" | "접수중" | "답변완료">("전체");

  useEffect(() => {
    api.get("/api/inquiry")
      .then((res) => setInquiries(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: number, status: "PENDING" | "ANSWERED") => {
    try {
      await api.patch(`/api/inquiry/${id}/status`, { status });
      setInquiries((prev) =>
        prev.map((q) => q.id === id
          ? { ...q, status: status === "PENDING" ? "접수중" : "답변완료" }
          : q)
      );
    } catch {
      alert("상태 변경에 실패했습니다.");
    }
  };

  const filtered = filterStatus === "전체"
    ? inquiries
    : inquiries.filter((q) => q.status === filterStatus);

  const pendingCount = inquiries.filter((q) => q.status === "접수중").length;

  if (loading) return <div className="text-center mt-20" style={{ color: "#64748b" }}>로딩 중...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">문의 내역</h1>
          <p className="text-sm mt-1" style={{ color: "#4b5563" }}>
            전체 {inquiries.length}건
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-500">
                미답변 {pendingCount}건
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {(["전체", "접수중", "답변완료"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === s
                  ? "bg-[#6d5efc] text-white"
                  : "kf-admin-btn-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-16" style={{ color: "#64748b" }}>문의 내역이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((q) => {
            const isOpen = expanded === q.id;
            const isAnswered = q.status === "답변완료";
            return (
              <div key={q.id} className="kf-admin-order-card">
                {/* 헤더 행 */}
                <button
                  className="w-full flex items-start justify-between gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : q.id)}
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
                    <span className="text-xs" style={{ color: "#64748b" }}>#{q.id}</span>
                    <span className={TYPE_COLORS[q.type] ?? "kf-badge-gray"}>{q.type}</span>
                    <span className="text-sm font-semibold truncate max-w-xs" style={{ color: "#1f2430" }}>
                      {q.content.length > 60 ? q.content.slice(0, 60) + "…" : q.content}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isAnswered
                          ? "bg-green-100 text-green-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {q.status}
                    </span>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* 펼침 상세 */}
                {isOpen && (
                  <div className="mt-4 pt-4 kf-divider">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-3" style={{ color: "#4b5563" }}>
                      <span>작성자: <strong style={{ color: "#1f2430" }}>{q.userName ?? "비회원"}</strong></span>
                      <span>이메일: <strong style={{ color: "#1f2430" }}>{q.email ?? "—"}</strong></span>
                      <span>접수일: <strong style={{ color: "#1f2430" }}>{q.createdAt?.replace("T", " ").slice(0, 16)}</strong></span>
                    </div>
                    <p className="text-sm leading-relaxed p-3 rounded-lg mb-4"
                      style={{ background: "rgba(109,94,252,0.04)", color: "#1f2430", border: "1px solid rgba(109,94,252,0.08)" }}>
                      {q.content}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(q.id, "ANSWERED")}
                        disabled={isAnswered}
                        className={`kf-admin-btn-primary rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                          isAnswered ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                        }`}
                      >
                        답변완료 처리
                      </button>
                      <button
                        onClick={() => handleStatusChange(q.id, "PENDING")}
                        disabled={!isAnswered}
                        className={`kf-admin-btn-secondary rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                          !isAnswered ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                        }`}
                      >
                        접수중으로 되돌리기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
