import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { goodsApi, cartUtils } from "../../api/goodsApi";

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const confirmed = useRef(false);

  useEffect(() => {
    if (confirmed.current) return;
    confirmed.current = true;

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      navigate("/goods");
      return;
    }

    const amountNum = parseInt(amount, 10);
    setTotalAmount(amountNum);

    goodsApi
      .confirmPayment({ paymentKey, orderId, amount: amountNum })
      .then(() => {
        cartUtils.clear();
        setConfirming(false);
      })
      .catch(() => {
        setError("결제 확인에 실패했습니다. 고객센터에 문의해주세요.");
        setConfirming(false);
      });
  }, []);

  if (confirming) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">결제 확인 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white p-8">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg mb-6">{error}</p>
          <button
            onClick={() => navigate("/goods")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-colors"
          >
            굿즈샵으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-white p-8">
      <div className="text-center max-w-md w-full">
        <FaCheckCircle className="text-green-400 mx-auto mb-5" size={64} />
        <h1 className="text-2xl font-bold mb-2">결제가 완료되었습니다!</h1>
        <p className="text-gray-400 mb-6">
          결제 금액: <span className="text-white font-semibold">{totalAmount.toLocaleString()}원</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/goods")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors"
          >
            굿즈샵으로 이동
          </button>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-colors"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
