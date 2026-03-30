import { useNavigate, useSearchParams } from "react-router-dom";
import { FaTimesCircle } from "react-icons/fa";
import "../../styles/OrderFailPage.kfandom.css";

export default function OrderFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");

  return (
    <div className="kf-expansion-page kf-order-fail">
      <div className="text-center max-w-md w-full">
        <FaTimesCircle className="text-red-400 mx-auto mb-5" size={64} />
        <h1 className="text-2xl font-bold mb-2">결제에 실패했습니다</h1>
        <p className="text-gray-400 mb-2">
          {errorMessage || "결제가 취소되었거나 오류가 발생했습니다."}
        </p>
        {errorCode && (
          <p className="text-gray-600 text-sm mb-6">오류 코드: {errorCode}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/goods/cart")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors"
          >
            장바구니로 돌아가기
          </button>
          <button
            onClick={() => navigate("/goods")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-colors"
          >
            굿즈샵으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
