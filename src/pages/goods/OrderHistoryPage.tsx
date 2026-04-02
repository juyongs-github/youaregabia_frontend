import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBoxOpen, FaTruck } from "react-icons/fa";
import api from "../../api/axios";
import "../../styles/OrderHistoryPage.kfandom.css";

interface OrderItem {
  goodsId: number;
  goodsName: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: number;
  tossOrderId: string;
  totalAmount: number;
  status: string;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  createdAt: string;
  items: OrderItem[];
  carrierId: string | null;
  trackingNumber: string | null;
}

interface TrackingEvent {
  timeString: string;
  where: string;
  kind: string;
  level: number;
}

const STATUS_LABEL: Record<string, { text: string; color: string; borderColor: string }> = {
  PENDING:   { text: "주문접수",  color: "text-amber-700 bg-amber-100 border border-amber-300",  borderColor: "border-l-4 border-l-amber-400"  },
  PAID:      { text: "결제완료",  color: "text-green-700 bg-green-100 border border-green-300",  borderColor: "border-l-4 border-l-green-400"  },
  SHIPPED:   { text: "배송중",    color: "text-blue-700 bg-blue-100 border border-blue-300",     borderColor: "border-l-4 border-l-blue-400"   },
  DELIVERED: { text: "배송완료",  color: "text-gray-600 bg-gray-100 border border-gray-300",     borderColor: "border-l-4 border-l-gray-400"   },
  CANCELLED: { text: "취소",      color: "text-red-700 bg-red-100 border border-red-300",        borderColor: "border-l-4 border-l-red-400"    },
};

const CARRIER_LABEL: Record<string, string> = {
  "04": "CJ대한통운",
  "05": "한진택배",
  "08": "롯데택배",
  "01": "우체국택배",
  "06": "로젠택배",
  "23": "경동택배",
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<Record<number, TrackingEvent[] | null>>({});
  const [trackingLoading, setTrackingLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.get<Order[]>("/api/orders/me")
      .then((res) => setOrders(res.data))
      .catch(() => alert("주문 내역을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const handleTrack = async (order: Order) => {
    if (!order.carrierId || !order.trackingNumber) return;
    if (trackingData[order.orderId] !== undefined) {
      setTrackingData((prev) => {
        const next = { ...prev };
        delete next[order.orderId];
        return next;
      });
      return;
    }
    setTrackingLoading((prev) => ({ ...prev, [order.orderId]: true }));
    try {
      const res = await api.get<{ trackingDetails: TrackingEvent[] }>(
        `/orders/track?carrierId=${order.carrierId}&trackingNumber=${order.trackingNumber}`
      );
      setTrackingData((prev) => ({ ...prev, [order.orderId]: res.data.trackingDetails ?? [] }));
    } catch (e: unknown) {
      const status = (e as { response?: { status: number } })?.response?.status;
      if (status === 404) {
        alert("아직 배송 정보가 등록되지 않았습니다.\n운송장 번호를 확인해주세요.");
      } else {
        alert("배송 조회에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
      setTrackingData((prev) => ({ ...prev, [order.orderId]: null }));
    } finally {
      setTrackingLoading((prev) => ({ ...prev, [order.orderId]: false }));
    }
  };

  if (loading) return <div className="text-white text-center mt-20">로딩 중...</div>;

  return (
    <div className="kf-expansion-page kf-order-history">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/goods")} className="text-gray-400 hover:text-white transition-colors">
          <FaArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">주문 내역</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <FaBoxOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>주문 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {orders.map((order) => {
            const sl = STATUS_LABEL[order.status] ?? { text: order.status, color: "text-gray-400 bg-gray-800" };
            const itemSummary = order.items.length === 1
              ? `${order.items[0].goodsName} ×${order.items[0].quantity}`
              : `${order.items[0]?.goodsName} 외 ${order.items.length - 1}건`;
            const hasTracking = order.carrierId && order.trackingNumber;
            const events = trackingData[order.orderId];
            const milestoneEvents = (() => {
              if (!events) return [];
              const result: TrackingEvent[] = [];
              // 간선상차(level 3, 첫 번째만)
              const firstSangcha = events.find((e) => e.level === 3 && e.kind.includes("상차"));
              if (firstSangcha) result.push(firstSangcha);
              // 배송출발(level 5, 마지막 1개만) - 가장 최신
              const lastDepart = [...events].reverse().find((e) => e.level === 5);
              if (lastDepart) result.push(lastDepart);
              // 배송완료(level 6)
              events.filter((e) => e.level === 6).forEach((e) => result.push(e));
              // 오래된순 → 최신순 (그대로 반환)
              return result;
            })();

            return (
              <div key={order.orderId} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${sl.borderColor}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">#{order.orderId}</span>
                      <span className="text-xs text-gray-500">{order.createdAt?.replace("T", " ").slice(0, 16)}</span>
                    </div>
                    <p className="font-semibold text-base">{itemSummary}</p>
                  </div>
                  <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${sl.color}`}>{sl.text}</span>
                </div>

                <div className="text-sm text-gray-500 space-y-1 mb-4">
                  <p>받는 분: <span className="text-gray-900 font-medium">{order.receiverName}</span></p>
                  <p>배송지: <span className="text-gray-900 font-medium">{order.deliveryAddress}</span></p>
                  <p>결제금액: <span className="text-gray-900 font-semibold">{order.totalAmount.toLocaleString()}원</span></p>
                  {hasTracking && (
                    <p>택배사: <span className="text-gray-900 font-medium">{CARRIER_LABEL[order.carrierId!] ?? order.carrierId}</span> | 운송장: <span className="text-gray-900 font-medium">{order.trackingNumber}</span></p>
                  )}
                </div>

                {hasTracking && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTrack(order)}
                      disabled={trackingLoading[order.orderId]}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <FaTruck size={13} />
                      {trackingLoading[order.orderId] ? "조회 중..." : events !== undefined ? "조회 닫기" : "배송 조회"}
                    </button>
                    <button
                      onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/api/orders/track-popup?carrierId=${order.carrierId}&trackingNumber=${order.trackingNumber}`, "_blank", "width=500,height=700")}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 border-2 border-gray-900 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <FaTruck size={13} />
                      상세 조회
                    </button>
                  </div>
                )}

                {/* 배송 추적 이벤트 */}
                {milestoneEvents.length > 0 && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <p className="text-sm font-semibold text-gray-300 mb-3">배송 현황</p>
                    <div className="relative flex flex-col gap-3 pl-5">
                      <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-700" />
                      {milestoneEvents.map((e, i) => (
                        <div key={i} className="relative flex gap-3 items-start">
                          <div className={`absolute -left-3.5 w-2.5 h-2.5 rounded-full border-2 mt-0.5 ${i === milestoneEvents.length - 1 ? "border-blue-400 bg-blue-400" : "border-gray-600 bg-gray-900"}`} />
                          <div>
                            <p className={`text-sm font-medium ${i === milestoneEvents.length - 1 ? "text-blue-300" : "text-gray-300"}`}>{e.kind}</p>
                            {e.where && <p className="text-xs text-gray-500">{e.where}</p>}
                            <p className="text-xs text-gray-600">{e.timeString}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {events && events.length === 0 && (
                  <p className="mt-3 text-sm text-gray-500">아직 배송 정보가 없습니다.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
