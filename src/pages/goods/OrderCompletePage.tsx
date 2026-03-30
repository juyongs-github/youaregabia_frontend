import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import "../../styles/OrderCompletePage.kfandom.css";

export default function OrderCompletePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const orderId = state?.orderId;
  const total = state?.total;

  return (
    <div className="kf-expansion-page kf-order-complete">
      <FaCheckCircle size={64} className="text-green-400" />
      <h1 className="text-3xl font-bold">주문이 완료됐습니다!</h1>
      {orderId && <p className="text-gray-400 text-sm">주문번호: #{orderId}</p>}
      {total && (
        <p className="text-lg">
          결제 금액: <span className="text-red-400 font-bold">{total.toLocaleString()}원</span>
        </p>
      )}
      <p className="text-gray-400 text-sm">배송 준비 후 순차적으로 발송됩니다.</p>
      <div className="flex gap-3 mt-4">
        <button onClick={() => navigate("/goods")} className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-colors">
          굿즈 더 보기
        </button>
        <button onClick={() => navigate("/home")} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors">
          홈으로
        </button>
      </div>
    </div>
  );
}
