import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { cartUtils, goodsApi, type CartItem } from "../../api/goodsApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

const DELIVERY_FEE = 3000;
const FREE_DELIVERY_THRESHOLD = 50000;

export default function OrderPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ receiverName: "", receiverPhone: "", deliveryAddress: "", detailAddress: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const items = cartUtils.getCart();
    if (items.length === 0) {
      navigate("/goods/cart");
      return;
    }
    setCart(items);
    // 로그인 유저 정보 자동 입력
    if (user) setForm((f) => ({ ...f, receiverName: user.name || "" }));
  }, []);

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleOrder = async () => {
    if (!form.receiverName.trim() || !form.receiverPhone.trim() || !form.deliveryAddress.trim()) {
      alert("배송 정보를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await goodsApi.createOrder({
        items: cart.map((c) => ({ goodsId: c.goodsId, quantity: c.quantity })),
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        deliveryAddress: `${form.deliveryAddress} ${form.detailAddress}`.trim(),
        totalAmount: total,
      });
      cartUtils.clear();
      navigate("/goods/order/complete", { state: { orderId: result.orderId, total } });
    } catch {
      // TODO: 추후 Toss Payments 연동 시 실제 결제 처리
      alert("결제 기능은 준비 중입니다. (토스페이먼츠 연동 예정)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 text-white min-h-screen max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/goods/cart")} className="text-gray-400 hover:text-white transition-colors">
          <FaArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">주문/결제</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 배송 정보 */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold text-lg mb-4">배송 정보</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">받는 분 *</label>
                <input
                  name="receiverName"
                  value={form.receiverName}
                  onChange={handleChange}
                  placeholder="이름 입력"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">연락처 *</label>
                <input
                  name="receiverPhone"
                  value={form.receiverPhone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">주소 *</label>
                <input
                  name="deliveryAddress"
                  value={form.deliveryAddress}
                  onChange={handleChange}
                  placeholder="주소 입력"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 mb-2"
                />
                <input
                  name="detailAddress"
                  value={form.detailAddress}
                  onChange={handleChange}
                  placeholder="상세 주소"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* 결제 수단 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold text-lg mb-4">결제 수단</h2>
            <div className="flex items-center gap-3 p-3 bg-gray-800 border border-red-600 rounded-lg">
              <div className="w-4 h-4 bg-red-600 rounded-full flex-shrink-0" />
              <span className="text-sm font-semibold">토스페이먼츠 (연동 예정)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">카드, 계좌이체, 카카오페이 등 지원 예정</p>
          </div>

          {/* 주문 상품 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold text-lg mb-4">주문 상품 ({cart.length}개)</h2>
            <div className="flex flex-col gap-3">
              {cart.map((item) => (
                <div key={item.goodsId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{item.name} × {item.quantity}</span>
                  <span className="font-semibold">{(item.price * item.quantity).toLocaleString()}원</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 결제 요약 */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-24">
            <h2 className="font-bold text-lg mb-4">결제 금액</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>상품 금액</span>
                <span className="text-white">{subtotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>배송비</span>
                <span className={deliveryFee === 0 ? "text-green-400" : "text-white"}>
                  {deliveryFee === 0 ? "무료" : `${deliveryFee.toLocaleString()}원`}
                </span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-base">
                <span>최종 결제금액</span>
                <span className="text-red-400">{total.toLocaleString()}원</span>
              </div>
            </div>
            <button
              onClick={handleOrder}
              disabled={loading}
              className="w-full mt-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl transition-colors"
            >
              {loading ? "처리 중..." : `${total.toLocaleString()}원 결제하기`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
