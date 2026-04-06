import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ConfirmToast from "../../components/ui/ConfirmToast";
import { useConfirmToast } from "../../hooks/useConfirmToast";

interface Inquiry {
  id: number;
  type: string;
  content: string;
  status: string;
  createdAt: string;
  email: string | null;
  phone: string | null;
  userName: string | null;
  userEmail: string | null;
  answer: string | null;
  answeredAt: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  "서비스 이용": "kf-badge-blue",
  "결제/환불":   "kf-badge-purple",
  "계정":        "kf-badge-green",
  "버그 신고":   "kf-badge-red",
  "기타":        "kf-badge-gray",
};

export default function AdminInquiriesPage() {
  const { toast, showToast, closeToast } = useToast();
  const { confirmToast, confirm, closeConfirm } = useConfirmToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"전체" | "접수중" | "답변완료">("전체");
  const [answerDraft, setAnswerDraft] = useState<Record<number, string>>({});
  const [answerEditing, setAnswerEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    api.get("/api/admin/inquiries")
      .then((res) => setInquiries(res.data))
      .finally(() => setLoading(false));
  }, []);

const handleSaveAnswer = async (id: number) => {
    const answer = answerDraft[id]?.trim();
    if (!answer) { showToast("답변 내용을 입력해주세요.", "info"); return; }
    setSaving(id);
    try {
      const res = await api.put(`/api/admin/inquiries/${id}/answer`, { answer });
      setInquiries((prev) =>
        prev.map((q) => q.id === id ? { ...q, ...res.data } : q)
      );
      setAnswerEditing(null);
      setAnswerDraft((prev) => { const next = { ...prev }; delete next[id]; return next; });
    } catch {
      showToast("답변 저장에 실패했습니다.", "error");
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteAnswer = async (id: number) => {
    const confirmed = await confirm("답변을 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      const res = await api.delete(`/api/admin/inquiries/${id}/answer`);
      setInquiries((prev) =>
        prev.map((q) => q.id === id ? { ...q, ...res.data } : q)
      );
      setAnswerEditing(null);
      setAnswerDraft((prev) => { const next = { ...prev }; delete next[id]; return next; });
    } catch {
      showToast("답변 삭제에 실패했습니다.", "error");
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    const confirmed = await confirm("이 문의를 삭제하시겠습니까? 복구할 수 없습니다.");
    if (!confirmed) return;
    try {
      await api.delete(`/api/admin/inquiries/${id}`);
      setInquiries((prev) => prev.filter((q) => q.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {
      showToast("문의 삭제에 실패했습니다.", "error");
    }
  };

  const startEdit = (q: Inquiry) => {
    setAnswerEditing(q.id);
    setAnswerDraft((prev) => ({ ...prev, [q.id]: q.answer ?? "" }));
  };

  const cancelEdit = (id: number) => {
    setAnswerEditing(null);
    setAnswerDraft((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const filtered = filterStatus === "전체"
    ? inquiries
    : inquiries.filter((q) => q.status === filterStatus);

  const pendingCount = inquiries.filter((q) => q.status === "접수중").length;

  if (loading) return <div className="text-center mt-20" style={{ color: "#64748b" }}>로딩 중...</div>;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <ConfirmToast state={confirmToast} onClose={closeConfirm} />
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
            const isEditingAnswer = answerEditing === q.id;
            const draft = answerDraft[q.id] ?? "";
            return (
              <div key={q.id} className="kf-admin-order-card">
                {/* 헤더 행 */}
                <div className="w-full flex items-start justify-between gap-3">
                  <button
                    className="flex-1 flex items-start gap-3 text-left min-w-0"
                    onClick={() => setExpanded(isOpen ? null : q.id)}
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0 flex-1">
                      <span className="text-xs" style={{ color: "#64748b" }}>#{q.id}</span>
                      <span className={TYPE_COLORS[q.type] ?? "kf-badge-gray"}>{q.type}</span>
                      <span className="text-sm font-semibold truncate max-w-xs" style={{ color: "#1f2430" }}>
                        {q.content.length > 60 ? q.content.slice(0, 60) + "…" : q.content}
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isAnswered
                          ? "bg-green-100 text-green-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {q.status}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteInquiry(q.id); }}
                      title="문의 삭제"
                      className="rounded-lg p-1.5 transition-colors"
                      style={{ color: "#ef4444", background: "rgba(239,68,68,0.07)" }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                    <button
                      className="text-xs px-1"
                      style={{ color: "#64748b" }}
                      onClick={() => setExpanded(isOpen ? null : q.id)}
                    >
                      {isOpen ? "▲" : "▼"}
                    </button>
                  </div>
                </div>

                {/* 펼침 상세 */}
                {isOpen && (
                  <div className="mt-4 pt-4 kf-divider">
                    {/* 메타 정보 */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-3" style={{ color: "#4b5563" }}>
                      <span>
                        작성자: <strong style={{ color: "#1f2430" }}>{q.userName ?? "비회원"}</strong>
                        {q.userEmail && (
                          <span style={{ color: "#64748b" }}> ({q.userEmail})</span>
                        )}
                      </span>
                      {q.email
                        ? <span>이메일: <strong style={{ color: "#1f2430" }}>{q.email}</strong></span>
                        : q.phone
                          ? <span>전화번호: <strong style={{ color: "#1f2430" }}>{q.phone}</strong></span>
                          : <span>연락처: <strong style={{ color: "#1f2430" }}>—</strong></span>
                      }
                      <span>접수일: <strong style={{ color: "#1f2430" }}>{q.createdAt?.replace("T", " ").slice(0, 16)}</strong></span>
                    </div>

                    {/* 문의 내용 */}
                    <p className="text-sm leading-relaxed p-3 rounded-lg mb-4"
                      style={{ background: "rgba(109,94,252,0.04)", color: "#1f2430", border: "1px solid rgba(109,94,252,0.08)" }}>
                      {q.content}
                    </p>

                    {/* 답변 영역 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold" style={{ color: "#6d5efc" }}>관리자 답변</span>
                        {q.answer && !isEditingAnswer && (
                          <span className="text-xs" style={{ color: "#94a3b8" }}>
                            {q.answeredAt?.replace("T", " ").slice(0, 16)}
                          </span>
                        )}
                      </div>

                      {/* 기존 답변 표시 (편집 모드 아닐 때) */}
                      {q.answer && !isEditingAnswer && (
                        <div className="p-3 rounded-lg mb-2"
                          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "#1f2430" }}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                        </div>
                      )}

                      {/* 답변 textarea (신규 작성 또는 편집 모드) */}
                      {(!q.answer || isEditingAnswer) && (
                        <textarea
                          rows={4}
                          placeholder="답변 내용을 입력하세요..."
                          value={draft}
                          onChange={(e) =>
                            setAnswerDraft((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="w-full rounded-lg text-sm p-3 resize-none"
                          style={{
                            background: "rgba(255,255,255,0.9)",
                            border: "1.5px solid rgba(109,94,252,0.25)",
                            color: "#1f2430",
                            outline: "none",
                          }}
                        />
                      )}

                      {/* 답변 액션 버튼 */}
                      <div className="flex justify-end gap-2 mt-2">
                        {/* 신규 작성: 오른쪽 끝 저장 버튼 */}
                        {!q.answer && (
                          <button
                            onClick={() => handleSaveAnswer(q.id)}
                            disabled={saving === q.id}
                            className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                            style={{ background: "rgba(20,184,166,0.10)", color: "#0d9488", border: "1px solid rgba(20,184,166,0.3)" }}
                          >
                            {saving === q.id ? "저장 중..." : "저장"}
                          </button>
                        )}
                        {/* 기존 답변 있을 때: 수정/삭제 버튼 */}
                        {q.answer && !isEditingAnswer && (
                          <>
                            <button
                              onClick={() => handleDeleteAnswer(q.id)}
                              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                            >
                              삭제
                            </button>
                            <button
                              onClick={() => startEdit(q)}
                              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                              style={{ background: "rgba(20,184,166,0.10)", color: "#0d9488", border: "1px solid rgba(20,184,166,0.3)" }}
                            >
                              수정
                            </button>
                          </>
                        )}
                        {/* 수정 모드: 취소/저장 버튼 */}
                        {q.answer && isEditingAnswer && (
                          <>
                            <button
                              onClick={() => cancelEdit(q.id)}
                              className="kf-admin-btn-secondary rounded-lg px-4 py-2 text-xs font-semibold"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleSaveAnswer(q.id)}
                              disabled={saving === q.id}
                              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                              style={{ background: "rgba(20,184,166,0.10)", color: "#0d9488", border: "1px solid rgba(20,184,166,0.3)" }}
                            >
                              {saving === q.id ? "저장 중..." : "저장"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
