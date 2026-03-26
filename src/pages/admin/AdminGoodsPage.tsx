import { useEffect, useRef, useState } from "react";
import { FaBox, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import api from "../../api/axios";

interface GoodsRow {
  goodsId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string | null;
}

interface GoodsForm {
  goodsId?: number;
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  imageFile?: File | null;
}

const CATEGORIES = [
  { key: "CLOTHING", label: "의류" },
  { key: "ACCESSORIES", label: "악세사리" },
  { key: "ALBUM", label: "앨범" },
  { key: "ETC", label: "기타" },
];
const categoryLabel: Record<string, string> = { CLOTHING: "의류", ACCESSORIES: "악세사리", ALBUM: "앨범", ETC: "기타" };
const EMPTY_FORM: GoodsForm = { name: "", description: "", price: "", stock: "", category: "CLOTHING", imageFile: null };

export default function AdminGoodsPage() {
  const [goodsList, setGoodsList] = useState<GoodsRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<GoodsForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadGoods(); }, []);

  const loadGoods = () => {
    api.get("/api/goods").then((res) => setGoodsList(res.data)).catch(() => {});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEdit = (g: GoodsRow) => {
    setForm({ goodsId: g.goodsId, name: g.name, description: g.description, price: String(g.price), stock: String(g.stock), category: g.category, imageFile: null });
    setShowForm(true);
  };

  const handleDelete = async (goodsId: number) => {
    if (!confirm("상품을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/goods/${goodsId}`);
      loadGoods();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.stock) {
      alert("이름, 가격, 재고를 입력해주세요.");
      return;
    }
    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append("request", new Blob([JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
      })], { type: "application/json" }));
      if (form.imageFile) formData.append("image", form.imageFile);

      if (form.goodsId) {
        await api.put(`/api/goods/${form.goodsId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/api/goods", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadGoods();
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">굿즈 관리</h1>
          <p className="text-gray-400 text-sm mt-1">총 {goodsList.length}개 상품</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <FaPlus size={12} /> 상품 등록
        </button>
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-base mb-4">{form.goodsId ? "상품 수정" : "상품 등록"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">상품명 *</label>
              <input name="name" value={form.name} onChange={handleFormChange} placeholder="상품명" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">카테고리 *</label>
              <select name="category" value={form.category} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">가격 (원) *</label>
              <input name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="0" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">재고 수량 *</label>
              <input name="stock" type="number" value={form.stock} onChange={handleFormChange} placeholder="0" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 mb-1.5 block">상품 설명</label>
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="상품 설명을 입력하세요" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 mb-1.5 block">상품 이미지</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, imageFile: e.target.files?.[0] ?? null }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-600 file:text-white file:text-xs file:cursor-pointer" />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">취소</button>
              <button type="submit" disabled={formLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">
                {formLoading ? "저장 중..." : form.goodsId ? "수정" : "등록"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 상품 목록 */}
      <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 whitespace-nowrap">
              <th className="text-left px-5 py-4 font-medium">이미지</th>
              <th className="text-left px-5 py-4 font-medium">상품명</th>
              <th className="text-left px-5 py-4 font-medium">카테고리</th>
              <th className="text-left px-5 py-4 font-medium">가격</th>
              <th className="text-left px-5 py-4 font-medium">재고</th>
              <th className="text-left px-5 py-4 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {goodsList.map((g) => (
              <tr key={g.goodsId} className="border-b border-gray-800 hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                <td className="px-5 py-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {g.imageUrl ? <img src={`${import.meta.env.VITE_API_BASE_URL}${g.imageUrl}`} alt={g.name} className="w-full h-full object-cover" /> : <FaBox size={14} className="text-gray-500" />}
                  </div>
                </td>
                <td className="px-5 py-4 font-medium">{g.name}</td>
                <td className="px-5 py-4 text-gray-400">{categoryLabel[g.category] ?? g.category}</td>
                <td className="px-5 py-4 text-white">{g.price.toLocaleString()}원</td>
                <td className={`px-5 py-4 font-semibold ${g.stock === 0 ? "text-red-400" : "text-white"}`}>{g.stock === 0 ? "품절" : `${g.stock}개`}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(g)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-semibold transition-colors">
                      <FaEdit size={10} /> 수정
                    </button>
                    <button onClick={() => handleDelete(g.goodsId)} className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-300 rounded-lg text-xs font-semibold transition-colors">
                      <FaTrash size={10} /> 삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {goodsList.length === 0 && <p className="text-gray-500 text-center py-12">등록된 상품이 없습니다.</p>}
      </div>
    </div>
  );
}
