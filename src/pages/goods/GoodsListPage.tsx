import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaBox } from "react-icons/fa";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { goodsApi, cartUtils, type Goods } from "../../api/goodsApi";

const CATEGORIES = [
  { key: "", label: "전체" },
  { key: "CLOTHING", label: "의류" },
  { key: "ACCESSORIES", label: "악세사리" },
  { key: "ALBUM", label: "앨범" },
  { key: "ETC", label: "기타" },
];

const MOCK_GOODS: Goods[] = [
  { goodsId: 1, name: "GAP Music 후드티", description: "편안한 착용감의 후드티", price: 45000, stock: 10, category: "CLOTHING", imageUrl: null },
  { goodsId: 2, name: "GAP Music 에코백", description: "튼튼한 에코백", price: 18000, stock: 5, category: "ACCESSORIES", imageUrl: null },
  { goodsId: 3, name: "GAP Music 한정 앨범", description: "아티스트 사인 앨범", price: 32000, stock: 3, category: "ALBUM", imageUrl: null },
  { goodsId: 4, name: "GAP Music 키링", description: "귀여운 키링", price: 9000, stock: 20, category: "ACCESSORIES", imageUrl: null },
  { goodsId: 5, name: "GAP Music 반팔티", description: "여름용 반팔티", price: 28000, stock: 8, category: "CLOTHING", imageUrl: null },
  { goodsId: 6, name: "GAP Music 포토카드", description: "한정판 포토카드 세트", price: 12000, stock: 15, category: "ETC", imageUrl: null },
];

const categoryLabel: Record<string, string> = {
  CLOTHING: "의류", ACCESSORIES: "악세사리", ALBUM: "앨범", ETC: "기타",
};

export default function GoodsListPage() {
  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const isAdmin = userRole === "ADMIN";
  const [goods, setGoods] = useState<Goods[]>([]);
  const [category, setCategory] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCartCount(cartUtils.count());
    loadGoods(category);
  }, [category]);

  const loadGoods = async (cat: string) => {
    setLoading(true);
    try {
      const data = await goodsApi.getGoodsList(cat || undefined);
      setGoods(data);
    } catch {
      // 백엔드 미연결 시 mock 데이터 사용
      const filtered = cat ? MOCK_GOODS.filter((g) => g.category === cat) : MOCK_GOODS;
      setGoods(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCart = (e: React.MouseEvent, item: Goods) => {
    e.stopPropagation();
    if (item.stock === 0) return;
    cartUtils.addItem({ ...item, quantity: 1 });
    setCartCount(cartUtils.count());
    alert(`"${item.name}"을(를) 장바구니에 담았습니다.`);
  };

  return (
    <div className="p-8 text-white min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">굿즈</h1>
          <p className="text-gray-400 mt-1">GAP Music 공식 굿즈샵</p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => navigate("/goods/cart")}
            className="relative flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
          >
            <FaShoppingCart size={20} />
            <span className="font-semibold">장바구니</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              category === c.key
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 상품 그리드 */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-400">불러오는 중...</div>
      ) : goods.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
          <FaBox size={40} />
          <p>상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {goods.map((item) => (
            <div
              key={item.goodsId}
              onClick={() => navigate(`/goods/${item.goodsId}`)}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-gray-600 transition-colors group"
            >
              {/* 이미지 */}
              <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  <img src={`${import.meta.env.VITE_API_BASE_URL}${item.imageUrl}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <FaBox size={48} className="text-gray-600" />
                )}
              </div>
              {/* 정보 */}
              <div className="p-4">
                <span className="text-xs text-red-400 font-semibold">{categoryLabel[item.category]}</span>
                <h3 className="text-sm font-semibold mt-1 text-white truncate">{item.name}</h3>
                <p className="text-base font-bold text-white mt-1">{item.price.toLocaleString()}원</p>
                {item.stock === 0 && (
                  <p className="text-xs text-gray-500 mt-1">품절</p>
                )}
                {!isAdmin && (
                  <button
                    onClick={(e) => handleAddCart(e, item)}
                    disabled={item.stock === 0}
                    className={`w-full mt-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      item.stock === 0
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {item.stock === 0 ? "품절" : "장바구니 담기"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
