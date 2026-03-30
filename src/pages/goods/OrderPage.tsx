import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCreditCard, FaMoneyBill, FaSearch } from "react-icons/fa";
import "../../styles/OrderPage.kfandom.css";
import { SiKakaotalk } from "react-icons/si";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { cartUtils, goodsApi, type CartItem } from "../../api/goodsApi";
import api from "../../api/axios";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

const DELIVERY_FEE = 3000;
const FREE_DELIVERY_THRESHOLD = 50000;
const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string;
const POINT_SESSION_KEY = "order_points_to_use";

const PAYMENT_METHODS = [
  { key: "CARD", label: "카드", icon: <FaCreditCard size={18} /> },
  { key: "TRANSFER", label: "계좌이체", icon: <FaMoneyBill size={18} /> },
  { key: "KAKAOPAY", label: "카카오페이", icon: <SiKakaotalk size={18} /> },
] as const;

type PaymentMethodKey = typeof PAYMENT_METHODS[number]["key"];

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const isValidPhone = (value: string) => /^01[0-9]-\d{3,4}-\d{4}$/.test(value);

export default function OrderPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ receiverName: "", receiverPhone: "", deliveryAddress: "", detailAddress: "" });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [useSameInfo, setUseSameInfo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodKey>("CARD");
  const [loading, setLoading] = useState(false);
  const [myPoint, setMyPoint] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointInput, setPointInput] = useState("");
  const detailAddressRef = useRef<HTMLInputElement>(null);

  // 카카오(다음) 주소 API 스크립트 로드
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).daum?.Postcode) return;
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const items = cartUtils.getCart();
    if (items.length === 0) {
      navigate("/goods/cart");
      return;
    }
    setCart(items);
    if (user) setForm((f) => ({ ...f, receiverName: user.name || "" }));
  }, []);

  // 포인트 조회
  useEffect(() => {
    api.get<{ totalPoint: number }>("/api/points/me")
      .then((res) => setMyPoint(res.data.totalPoint))
      .catch(() => {});
  }, []);

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const finalAmount = Math.max(0, total - pointsToUse);

  const phoneValid = isValidPhone(form.receiverPhone);

  const getPhoneBorderClass = () => {
    if (!phoneTouched) return "border-gray-700";
    return phoneValid ? "border-green-500" : "border-red-500";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "receiverPhone") {
      setForm((f) => ({ ...f, receiverPhone: formatPhone(value) }));
      setPhoneTouched(true);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSameInfo = async (checked: boolean) => {
    setUseSameInfo(checked);
    if (checked) {
      try {
        const res = await api.get<{ name: string; phoneNumber: string; address: string; addressDetail: string }>("/api/auth/me");
        setForm((f) => ({
          ...f,
          receiverName: res.data.name || f.receiverName,
          receiverPhone: formatPhone(res.data.phoneNumber || ""),
          deliveryAddress: res.data.address || f.deliveryAddress,
          detailAddress: res.data.addressDetail || "",
        }));
        if (res.data.phoneNumber) setPhoneTouched(true);
      } catch {
        setForm((f) => ({ ...f, receiverName: user?.name || "" }));
      }
    }
  };

  const openAddressSearch = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (window as any).daum.Postcode({
      oncomplete: (data: { address: string }) => {
        setForm((f) => ({ ...f, deliveryAddress: data.address, detailAddress: "" }));
        setTimeout(() => detailAddressRef.current?.focus(), 0);
      },
    }).open();
  };

  const handleOrder = async () => {
    setPhoneTouched(true);
    if (!form.receiverName.trim() || !phoneValid || !form.deliveryAddress.trim()) {
      alert("배송 정보를 모두 올바르게 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await goodsApi.createOrder({
        items: cart.map((c) => ({ goodsId: c.goodsId, quantity: c.quantity })),
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        deliveryAddress: `${form.deliveryAddress} ${form.detailAddress}`.trim(),
        totalAmount: finalAmount,
      });

      // 결제 완료 후 포인트 차감을 위해 사용 포인트 저장
      sessionStorage.setItem(POINT_SESSION_KEY, String(pointsToUse));

      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: user!.email });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payment.requestPayment as any)({
        method: paymentMethod,
        amount: { currency: "KRW", value: finalAmount },
        orderId: result.tossOrderId,
        orderName: cart.length === 1 ? cart[0].name : `${cart[0].name} 외 ${cart.length - 1}건`,
        customerName: form.receiverName,
        customerEmail: user?.email,
        successUrl: `${window.location.origin}/goods/order/success`,
        failUrl: `${window.location.origin}/goods/order/fail`,
      });
    } catch (e: unknown) {
      setLoading(false);
      const err = e as { code?: string };
      if (err?.code !== "USER_CANCEL") {
        alert("결제 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  return (
    <div className="kf-expansion-page kf-order-page">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/goods/cart")} className="text-gray-400 hover:text-white transition-colors">
          <FaArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">주문/결제</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-5">
          {/* 배송 정보 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">배송 정보</h2>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useSameInfo}
                  onChange={(e) => handleSameInfo(e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
                회원정보와 동일
              </label>
            </div>

            <div className="flex flex-col gap-4">
              {/* 받는 분 */}
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

              {/* 연락처 */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">연락처 *</label>
                <input
                  name="receiverPhone"
                  value={form.receiverPhone}
                  onChange={handleChange}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white focus:outline-none transition-colors border-b-2 ${getPhoneBorderClass()}`}
                />
                {phoneTouched && form.receiverPhone && !phoneValid && (
                  <p className="text-red-400 text-xs mt-1">올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)</p>
                )}
                {phoneTouched && phoneValid && (
                  <p className="text-green-400 text-xs mt-1">올바른 형식입니다.</p>
                )}
              </div>

              {/* 주소 */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">주소 *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={form.deliveryAddress}
                    readOnly
                    placeholder="주소 검색 버튼을 눌러주세요"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white cursor-default"
                  />
                  <button
                    type="button"
                    onClick={openAddressSearch}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    <FaSearch size={13} /> 주소 검색
                  </button>
                </div>
                <input
                  ref={detailAddressRef}
                  name="detailAddress"
                  value={form.detailAddress}
                  onChange={handleChange}
                  placeholder="상세 주소 입력"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* 포인트 사용 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold text-lg mb-4">포인트 사용</h2>
            <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
              <span>보유 포인트</span>
              <span className="text-yellow-400 font-semibold">{myPoint.toLocaleString()}P</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={Math.min(myPoint, total)}
                value={pointInput}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), Math.min(myPoint, total));
                  setPointInput(String(val));
                  setPointsToUse(val);
                }}
                placeholder="사용할 포인트 입력"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500"
              />
              <button
                type="button"
                onClick={() => {
                  const max = Math.min(myPoint, total);
                  setPointInput(String(max));
                  setPointsToUse(max);
                }}
                className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors"
              >
                모두 사용
              </button>
            </div>
            {pointsToUse > 0 && (
              <p className="text-yellow-400 text-xs mt-2">
                {pointsToUse.toLocaleString()}P 사용 → {(myPoint - pointsToUse).toLocaleString()}P 남음
              </p>
            )}
          </div>

          {/* 결제 수단 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold text-lg mb-4">결제 수단</h2>
            <div className="flex gap-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                    paymentMethod === m.key
                      ? "border-red-500 bg-red-500/10 text-red-400"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
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
              {pointsToUse > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>포인트 차감</span>
                  <span className="text-yellow-400">-{pointsToUse.toLocaleString()}P</span>
                </div>
              )}
              <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-base">
                <span>최종 결제금액</span>
                <span className="text-red-400">{finalAmount.toLocaleString()}원</span>
              </div>
            </div>
            <button
              onClick={handleOrder}
              disabled={loading}
              className="w-full mt-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl transition-colors"
            >
              {loading ? "처리 중..." : `${finalAmount.toLocaleString()}원 결제하기`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
