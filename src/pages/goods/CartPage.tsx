import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox, FaMinus, FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa";
import { cartUtils, type CartItem } from "../../api/goodsApi";
import "../../styles/CartPage.kfandom.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const DELIVERY_FEE = 3000;
const FREE_DELIVERY_THRESHOLD = 50000;

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(cartUtils.getCart());
  }, []);

  const handleQuantity = (goodsId: number, delta: number) => {
    const item = cart.find((c) => c.goodsId === goodsId);
    if (!item) return;
    const newQty = Math.min(Math.max(1, item.quantity + delta), item.stock);
    cartUtils.updateQuantity(goodsId, newQty);
    setCart(cartUtils.getCart());
  };

  const handleRemove = (goodsId: number) => {
    cartUtils.removeItem(goodsId);
    setCart(cartUtils.getCart());
  };

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : cart.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="kf-expansion-page kf-cart-page">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/goods")} className="text-gray-400 hover:text-white transition-colors">
          <FaArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">장바구니</h1>
        <span className="text-gray-400 text-sm">({cart.length}개 상품)</span>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
          <FaBox size={48} />
          <p>장바구니가 비어있습니다.</p>
          <button onClick={() => navigate("/goods")} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors">
            굿즈 보러가기
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 상품 목록 */}
          <div className="flex-1 flex flex-col gap-4">
            {cart.map((item) => (
              <div key={item.goodsId} className="flex gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
                {/* 이미지 */}
                <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={`${API_BASE_URL}${item.imageUrl}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaBox size={24} className="text-gray-600" />
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{item.name}</p>
                  <p className="text-red-400 font-bold mt-1">{item.price.toLocaleString()}원</p>

                  <div className="flex items-center gap-3 mt-3">
                    {/* 수량 */}
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2 py-1">
                      <button onClick={() => handleQuantity(item.goodsId, -1)} className="p-1 hover:text-red-400 transition-colors">
                        <FaMinus size={10} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => handleQuantity(item.goodsId, 1)} className="p-1 hover:text-red-400 transition-colors">
                        <FaPlus size={10} />
                      </button>
                    </div>
                    <span className="text-sm text-gray-400">
                      소계: <span className="text-white font-semibold">{(item.price * item.quantity).toLocaleString()}원</span>
                    </span>
                  </div>
                </div>

                {/* 삭제 */}
                <button onClick={() => handleRemove(item.goodsId)} className="text-gray-600 hover:text-red-400 transition-colors self-start">
                  <FaTrash size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 결제 요약 */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-24">
              <h2 className="font-bold text-lg mb-4">주문 요약</h2>
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
                {subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD && (
                  <p className="text-xs text-gray-500">
                    {(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString()}원 더 구매 시 무료배송
                  </p>
                )}
                <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-base">
                  <span>총 결제금액</span>
                  <span className="text-red-400">{total.toLocaleString()}원</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/goods/order")}
                className="w-full mt-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
              >
                주문하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
