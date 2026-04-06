import { useEffect, useState } from "react";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ConfirmToast from "../../components/ui/ConfirmToast";
import { useConfirmToast } from "../../hooks/useConfirmToast";

interface OrderRow {
  orderId: number;
  tossOrderId: string;
  totalAmount: number;
  status: string;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  createdAt: string;
  items: { goodsId: number; goodsName: string; price: number; quantity: number }[];
  carrierId: string | null;
  trackingNumber: string | null;
  userEmail: string | null;
}

const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
const CARRIERS = [
  { id: "04", name: "CJ대한통운" },
  { id: "05", name: "한진택배" },
  { id: "08", name: "롯데택배" },
  { id: "01", name: "우체국택배" },
  { id: "06", name: "로젠택배" },
  { id: "23", name: "경동택배" },
];
const orderStatusLabel: Record<string, { text: string; color: string }> = {
  PENDING:   { text: "주문접수",  color: "text-yellow-400" },
  PAID:      { text: "결제완료",  color: "text-green-400"  },
  SHIPPED:   { text: "배송중",    color: "text-blue-400"   },
  DELIVERED: { text: "배송완료",  color: "text-gray-300"   },
  CANCELLED: { text: "취소",      color: "text-red-400"    },
};

export default function AdminOrdersPage() {
  const { toast, showToast, closeToast } = useToast();
  const { confirmToast, confirm, closeConfirm } = useConfirmToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingEdit, setTrackingEdit] = useState<{ orderId: number; carrierId: string; trackingNumber: string } | null>(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = () => {
    api.get("/api/admin/orders")
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o.orderId === orderId ? { ...o, status } : o));
    } catch {
      showToast("상태 변경에 실패했습니다.", "error");
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const confirmed = await confirm(`주문 #${orderId}을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;
    try {
      await api.delete(`/api/admin/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    } catch {
      showToast("주문 삭제에 실패했습니다.", "error");
    }
  };

  const handleTrackingSubmit = async (orderId: number) => {
    if (!trackingEdit) return;
    try {
      await api.patch(`/api/admin/orders/${orderId}/tracking`, {
        carrierId: trackingEdit.carrierId,
        trackingNumber: trackingEdit.trackingNumber,
      });
      setOrders((prev) => prev.map((o) => o.orderId === orderId
        ? { ...o, carrierId: trackingEdit.carrierId, trackingNumber: trackingEdit.trackingNumber }
        : o));
      setTrackingEdit(null);
    } catch {
      showToast("운송장 등록에 실패했습니다.", "error");
    }
  };

  if (loading) return <div className="text-center mt-20" style={{color:"#64748b"}}>로딩 중...</div>;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <ConfirmToast state={confirmToast} onClose={closeConfirm} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">결제 내역</h1>
          <p className="text-sm mt-1" style={{color:"#4b5563"}}>총 {orders.length}건</p>
        </div>
        <button onClick={loadOrders} className="kf-admin-btn-secondary rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
          새로고침
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="text-center py-16" style={{color:"#64748b"}}>결제 내역이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const sl = orderStatusLabel[o.status] ?? { text: o.status, color: "text-gray-400" };
            const itemSummary = o.items.length === 1
              ? `${o.items[0].goodsName} ×${o.items[0].quantity}`
              : `${o.items[0]?.goodsName} 외 ${o.items.length - 1}건`;
            const isEditing = trackingEdit?.orderId === o.orderId;
            const carrierName = CARRIERS.find((c) => c.id === o.carrierId)?.name ?? o.carrierId;
            const isWithdrawn = o.userEmail?.includes("@delete.com");

            return (
              <div key={o.orderId} className={`kf-admin-order-card ${isWithdrawn ? "border-l-4 border-l-red-400 opacity-80" : ""}`}>
                {/* 탈퇴 회원 배너 */}
                {isWithdrawn && (
                  <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold text-xs">⚠ 탈퇴한 회원의 주문입니다</span>
                      <span className="text-red-400 text-xs">{o.userEmail}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteOrder(o.orderId)}
                      className="text-xs font-semibold px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      내역 삭제
                    </button>
                  </div>
                )}
                {/* 상단 */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm items-center">
                    <span className="text-xs" style={{color:"#64748b"}}>#{o.orderId}</span>
                    <span className="font-semibold" style={{color:"#1f2430"}}>{itemSummary}</span>
                    <span style={{color:"#4b5563"}}>{o.receiverName} · {o.receiverPhone}</span>
                    <span className="text-xs" style={{color:"#64748b"}}>{o.createdAt?.replace("T", " ").slice(0, 16)}</span>
                  </div>
                  <span className="font-bold text-base">{o.totalAmount.toLocaleString()}원</span>
                </div>

                {/* 하단: 상태 + 운송장 */}
                <div className="flex flex-wrap items-start gap-4 pt-3 kf-divider">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs mb-1" style={{color:"#64748b"}}>주문 상태</p>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.orderId, e.target.value)}
                      disabled={isWithdrawn}
                      className={`pl-3 pr-7 py-2 text-sm font-semibold ${isWithdrawn ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer"} ${sl.color}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s} className="text-gray-900 bg-white">
                          {orderStatusLabel[s]?.text ?? s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[260px]">
                    <p className="text-xs mb-1.5" style={{color:"#64748b"}}>운송장</p>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={trackingEdit.carrierId}
                          onChange={(e) => setTrackingEdit((t) => t && ({ ...t, carrierId: e.target.value }))}
                          className="px-3 py-2 text-sm"
                        >
                          {CARRIERS.map((c) => <option key={c.id} value={c.id} className="text-gray-900 bg-white">{c.name}</option>)}
                        </select>
                        <input
                          value={trackingEdit.trackingNumber}
                          onChange={(e) => setTrackingEdit((t) => t && ({ ...t, trackingNumber: e.target.value }))}
                          placeholder="운송장 번호 입력"
                          className="flex-1 min-w-[140px] px-3 py-2 text-sm"
                        />
                        <button onClick={() => handleTrackingSubmit(o.orderId)} className="kf-admin-btn-primary rounded-lg px-4 py-2 text-sm font-semibold transition-colors">저장</button>
                        <button onClick={() => setTrackingEdit(null)} className="kf-admin-btn-secondary rounded-lg px-4 py-2 text-sm font-semibold transition-colors">취소</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {o.trackingNumber ? (
                          <span className="text-sm" style={{color:"#4b5563"}}>{carrierName} · {o.trackingNumber}</span>
                        ) : (
                          <span className="text-sm" style={{color:"#64748b"}}>미등록</span>
                        )}
                        {!isWithdrawn && (
                          <button
                            onClick={() => setTrackingEdit({ orderId: o.orderId, carrierId: o.carrierId ?? "04", trackingNumber: o.trackingNumber ?? "" })}
                            className="kf-admin-btn-secondary rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                          >
                            {o.trackingNumber ? "수정" : "등록"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
