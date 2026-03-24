import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaBox, FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";
import { goodsApi, cartUtils, type Goods } from "../../api/goodsApi";

const categoryLabel: Record<string, string> = {
  CLOTHING: "의류", ACCESSORIES: "악세사리", ALBUM: "앨범", ETC: "기타",
};

export default function GoodsDetailPage() {
  const { goodsId } = useParams<{ goodsId: string }>();
  const navigate = useNavigate();
  const [goods, setGoods] = useState<Goods | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(cartUtils.count());
    if (goodsId) loadGoods(Number(goodsId));
  }, [goodsId]);

  const loadGoods = async (id: number) => {
    setLoading(true);
    try {
      const data = await goodsApi.getGoodsDetail(id);
      setGoods(data);
    } catch {
      // mock fallback
      setGoods({ goodsId: id, name: "GAP Music 후드티", description: "부드러운 소재의 오버핏 후드티입니다. GAP Music 로고가 가슴에 프린팅되어 있으며, 남녀 모두 착용 가능합니다.", price: 45000, stock: 10, category: "CLOTHING", imageUrl: null });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantity = (delta: number) => {
    if (!goods) return;
    setQuantity((prev) => Math.min(Math.max(1, prev + delta), goods.stock));
  };

  const handleAddCart = () => {
    if (!goods) return;
    cartUtils.addItem({ ...goods, quantity });
    setCartCount(cartUtils.count());
    alert(`"${goods.name}"을(를) 장바구니에 담았습니다.`);
  };

  const handleBuyNow = () => {
    if (!goods) return;
    cartUtils.addItem({ ...goods, quantity });
    navigate("/goods/cart");
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-400">불러오는 중...</div>;
  }

  if (!goods) {
    return <div className="flex justify-center items-center h-screen text-gray-400">상품을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="p-8 text-white min-h-screen max-w-5xl">
      {/* 상단 네비 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate("/goods")} className="text-gray-400 hover:text-white text-sm transition-colors">
          ← 굿즈 목록
        </button>
        <button
          onClick={() => navigate("/goods/cart")}
          className="relative flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <FaShoppingCart size={18} />
          <span className="font-semibold text-sm">장바구니</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </div>

      {/* 상품 상세 */}
      <div className="flex flex-col md:flex-row gap-10">
        {/* 이미지 */}
        <div className="w-full md:w-96 aspect-square bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
          {goods.imageUrl ? (
            <img src={`${import.meta.env.VITE_API_BASE_URL}${goods.imageUrl}`} alt={goods.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <FaBox size={80} className="text-gray-600" />
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <span className="text-sm text-red-400 font-semibold">{categoryLabel[goods.category]}</span>
            <h1 className="text-2xl font-bold mt-1">{goods.name}</h1>
          </div>

          <p className="text-3xl font-bold text-white">{goods.price.toLocaleString()}원</p>

          <p className="text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">{goods.description}</p>

          <div className="flex items-center gap-2 text-sm text-gray-400 border-t border-gray-800 pt-4">
            <span>재고</span>
            <span className={goods.stock === 0 ? "text-red-400 font-semibold" : "text-white font-semibold"}>
              {goods.stock === 0 ? "품절" : `${goods.stock}개`}
            </span>
          </div>

          {/* 수량 선택 */}
          {goods.stock > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">수량</span>
              <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-2 py-1">
                <button onClick={() => handleQuantity(-1)} className="p-1.5 hover:text-red-400 transition-colors">
                  <FaMinus size={12} />
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button onClick={() => handleQuantity(1)} className="p-1.5 hover:text-red-400 transition-colors">
                  <FaPlus size={12} />
                </button>
              </div>
              <span className="text-gray-400 text-sm">
                합계: <span className="text-white font-bold">{(goods.price * quantity).toLocaleString()}원</span>
              </span>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddCart}
              disabled={goods.stock === 0}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                goods.stock === 0 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              장바구니 담기
            </button>
            <button
              onClick={handleBuyNow}
              disabled={goods.stock === 0}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                goods.stock === 0 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              바로 구매
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
