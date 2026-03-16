import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { FaBox, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import type { RootState } from "../../store";
import api from "../../api/axios";

interface UserRow {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  state: number;
  createdAt: string;
}

interface LoginLog {
  id: number;
  userId: number;
  name: string;
  email: string;
  loginType: string;
  ip: string;
  loginAt: string;
}

interface ActivityLog {
  type: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
}

const ROLES = ["USER", "CRITIC", "ADMIN"];
const CATEGORIES = [
  { key: "CLOTHING", label: "의류" },
  { key: "ACCESSORIES", label: "악세사리" },
  { key: "ALBUM", label: "앨범" },
  { key: "ETC", label: "기타" },
];
const categoryLabel: Record<string, string> = { CLOTHING: "의류", ACCESSORIES: "악세사리", ALBUM: "앨범", ETC: "기타" };

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

type Tab = "users" | "loginLogs" | "activityLogs" | "goods";

const EMPTY_FORM: GoodsForm = { name: "", description: "", price: "", stock: "", category: "CLOTHING", imageFile: null };

function AdminPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [goodsList, setGoodsList] = useState<GoodsRow[]>([]);
  const [showGoodsForm, setShowGoodsForm] = useState(false);
  const [goodsForm, setGoodsForm] = useState<GoodsForm>(EMPTY_FORM);
  const [goodsLoading, setGoodsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    api.get("/api/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => alert("유저 목록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    if (activeTab === "loginLogs" && loginLogs.length === 0) {
      api.get("/api/admin/logs/login").then((res) => setLoginLogs(res.data));
    }
    if (activeTab === "activityLogs" && activityLogs.length === 0) {
      api.get("/api/admin/logs/activity").then((res) => setActivityLogs(res.data));
    }
    if (activeTab === "goods") loadGoods();
  }, [activeTab, user?.role]);

  const loadGoods = () => {
    api.get("/api/goods").then((res) => setGoodsList(res.data)).catch(() => {});
  };

  const handleGoodsFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setGoodsForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleGoodsEdit = (g: GoodsRow) => {
    setGoodsForm({ goodsId: g.goodsId, name: g.name, description: g.description, price: String(g.price), stock: String(g.stock), category: g.category, imageFile: null });
    setShowGoodsForm(true);
  };

  const handleGoodsDelete = async (goodsId: number) => {
    if (!confirm("상품을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/goods/${goodsId}`);
      loadGoods();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleGoodsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goodsForm.name.trim() || !goodsForm.price || !goodsForm.stock) {
      alert("이름, 가격, 재고를 입력해주세요.");
      return;
    }
    setGoodsLoading(true);
    try {
      const formData = new FormData();
      formData.append("request", new Blob([JSON.stringify({
        name: goodsForm.name,
        description: goodsForm.description,
        price: Number(goodsForm.price),
        stock: Number(goodsForm.stock),
        category: goodsForm.category,
      })], { type: "application/json" }));
      if (goodsForm.imageFile) formData.append("image", goodsForm.imageFile);

      if (goodsForm.goodsId) {
        await api.put(`/api/goods/${goodsForm.goodsId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/api/goods", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setShowGoodsForm(false);
      setGoodsForm(EMPTY_FORM);
      loadGoods();
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setGoodsLoading(false);
    }
  };

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } catch {
      alert("권한 변경에 실패했습니다.");
    }
  };

  const roleLabel = (role: string) => {
    if (role === "ADMIN") return { text: "관리자", color: "text-red-400" };
    if (role === "CRITIC") return { text: "평론가", color: "text-yellow-400" };
    return { text: "일반", color: "text-gray-400" };
  };

  const loginTypeLabel = (type: string) => {
    if (type === "GOOGLE") return { text: "구글", color: "text-blue-400" };
    if (type === "KAKAO") return { text: "카카오", color: "text-yellow-400" };
    if (type === "NAVER") return { text: "네이버", color: "text-green-400" };
    return { text: "일반", color: "text-gray-400" };
  };

  if (user?.role !== "ADMIN") return <Navigate to="/home" replace />;
  if (loading) return <div className="text-white text-center mt-20">로딩 중...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "회원 관리" },
    { key: "loginLogs", label: "접속 로그" },
    { key: "activityLogs", label: "활동 로그" },
    { key: "goods", label: "굿즈 관리" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 text-white overflow-x-hidden">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">관리자 페이지</h1>
      <p className="text-gray-400 text-base mb-6">전체 회원 목록 및 권한 관리</p>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-base font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-blue-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 회원 관리 */}
      {activeTab === "users" && (
        <>
          <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
            <table className="min-w-[860px] w-full text-base">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 whitespace-nowrap">
                  <th className="text-left px-6 py-5">ID</th>
                  <th className="text-left px-6 py-5">이름</th>
                  <th className="text-left px-6 py-5">이메일</th>
                  <th className="text-left px-6 py-5">전화번호</th>
                  <th className="text-left px-6 py-5">현재 권한</th>
                  <th className="text-left px-6 py-5">권한 변경</th>
                  <th className="text-left px-6 py-5">가입일</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const label = roleLabel(u.role);
                  return (
                    <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors whitespace-nowrap">
                      <td className="px-6 py-5 text-gray-500">{u.id}</td>
                      <td className="px-6 py-5 font-medium">{u.name}</td>
                      <td className="px-6 py-5 text-gray-300">{u.email || "-"}</td>
                      <td className="px-6 py-5 text-gray-300">{u.phoneNumber}</td>
                      <td className={`px-6 py-5 font-medium ${label.color}`}>{label.text}</td>
                      <td className="px-6 py-5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-6 py-1.5 text-base text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r === "ADMIN" ? "관리자" : r === "CRITIC" ? "평론가" : "일반"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-5 text-gray-500">{u.createdAt?.slice(0, 10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-gray-500 text-center py-12">회원이 없습니다.</p>}
          </div>
          <p className="text-gray-600 text-sm mt-4">총 {users.length}명</p>
        </>
      )}

      {/* 접속 로그 */}
      {activeTab === "loginLogs" && (
        <>
          <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
            <table className="min-w-[780px] w-full text-base">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 whitespace-nowrap">
                  <th className="text-left px-6 py-5">이름</th>
                  <th className="text-left px-6 py-5">이메일</th>
                  <th className="text-left px-6 py-5">로그인 방식</th>
                  <th className="text-left px-6 py-5">IP</th>
                  <th className="text-left px-6 py-5">접속 시간</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.map((log) => {
                  const lt = loginTypeLabel(log.loginType);
                  return (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors whitespace-nowrap">
                      <td className="px-6 py-4 font-medium">{log.name}</td>
                      <td className="px-6 py-4 text-gray-300">{log.email}</td>
                      <td className={`px-6 py-4 font-medium ${lt.color}`}>{lt.text}</td>
                      <td className="px-6 py-4 text-gray-400">{log.ip}</td>
                      <td className="px-6 py-4 text-gray-400">{log.loginAt?.replace("T", " ").slice(0, 19)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loginLogs.length === 0 && <p className="text-gray-500 text-center py-12">접속 기록이 없습니다.</p>}
          </div>
          <p className="text-gray-600 text-sm mt-4">최근 {loginLogs.length}건</p>
        </>
      )}

      {/* 굿즈 관리 */}
      {activeTab === "goods" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm">총 {goodsList.length}개 상품</p>
            <button
              onClick={() => { setGoodsForm(EMPTY_FORM); setShowGoodsForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              <FaPlus size={12} /> 상품 등록
            </button>
          </div>

          {/* 상품 등록/수정 폼 */}
          {showGoodsForm && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">{goodsForm.goodsId ? "상품 수정" : "상품 등록"}</h3>
              <form onSubmit={handleGoodsSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">상품명 *</label>
                  <input name="name" value={goodsForm.name} onChange={handleGoodsFormChange} placeholder="상품명" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">카테고리 *</label>
                  <select name="category" value={goodsForm.category} onChange={handleGoodsFormChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                    {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">가격 (원) *</label>
                  <input name="price" type="number" value={goodsForm.price} onChange={handleGoodsFormChange} placeholder="0" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">재고 수량 *</label>
                  <input name="stock" type="number" value={goodsForm.stock} onChange={handleGoodsFormChange} placeholder="0" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-400 mb-1 block">상품 설명</label>
                  <textarea name="description" value={goodsForm.description} onChange={handleGoodsFormChange} placeholder="상품 설명을 입력하세요" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-400 mb-1 block">상품 이미지</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setGoodsForm((f) => ({ ...f, imageFile: e.target.files?.[0] ?? null }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-600 file:text-white file:cursor-pointer" />
                </div>
                <div className="md:col-span-2 flex gap-3 justify-end">
                  <button type="button" onClick={() => { setShowGoodsForm(false); setGoodsForm(EMPTY_FORM); }} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">취소</button>
                  <button type="submit" disabled={goodsLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">
                    {goodsLoading ? "저장 중..." : goodsForm.goodsId ? "수정" : "등록"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 상품 목록 */}
          <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
            <table className="min-w-[760px] w-full text-base">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 whitespace-nowrap">
                  <th className="text-left px-6 py-4">이미지</th>
                  <th className="text-left px-6 py-4">상품명</th>
                  <th className="text-left px-6 py-4">카테고리</th>
                  <th className="text-left px-6 py-4">가격</th>
                  <th className="text-left px-6 py-4">재고</th>
                  <th className="text-left px-6 py-4">관리</th>
                </tr>
              </thead>
              <tbody>
                {goodsList.map((g) => (
                  <tr key={g.goodsId} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors whitespace-nowrap">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {g.imageUrl ? <img src={`http://localhost:8080${g.imageUrl}`} alt={g.name} className="w-full h-full object-cover" /> : <FaBox size={16} className="text-gray-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{g.name}</td>
                    <td className="px-6 py-4 text-gray-300">{categoryLabel[g.category] ?? g.category}</td>
                    <td className="px-6 py-4 text-white">{g.price.toLocaleString()}원</td>
                    <td className={`px-6 py-4 font-semibold ${g.stock === 0 ? "text-red-400" : "text-white"}`}>{g.stock === 0 ? "품절" : `${g.stock}개`}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleGoodsEdit(g)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-semibold transition-colors">
                          <FaEdit size={11} /> 수정
                        </button>
                        <button onClick={() => handleGoodsDelete(g.goodsId)} className="flex items-center gap-1 px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg text-xs font-semibold transition-colors">
                          <FaTrash size={11} /> 삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {goodsList.length === 0 && <p className="text-gray-500 text-center py-12">등록된 상품이 없습니다.</p>}
          </div>
        </>
      )}

      {/* 활동 로그 */}
      {activeTab === "activityLogs" && (
        <>
          <div className="w-full overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
            <table className="min-w-[780px] w-full text-base">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 whitespace-nowrap">
                  <th className="text-left px-6 py-5">유형</th>
                  <th className="text-left px-6 py-5">이름</th>
                  <th className="text-left px-6 py-5">이메일</th>
                  <th className="text-left px-6 py-5">내용</th>
                  <th className="text-left px-6 py-5">작성 시간</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors whitespace-nowrap">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-sm font-medium ${log.type === "게시글" ? "bg-blue-900/50 text-blue-300" : "bg-purple-900/50 text-purple-300"}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{log.name}</td>
                    <td className="px-6 py-4 text-gray-300">{log.email}</td>
                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{log.content}</td>
                    <td className="px-6 py-4 text-gray-400">{log.createdAt?.replace("T", " ").slice(0, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activityLogs.length === 0 && <p className="text-gray-500 text-center py-12">활동 기록이 없습니다.</p>}
          </div>
          <p className="text-gray-600 text-sm mt-4">최근 {activityLogs.length}건</p>
        </>
      )}
    </div>
  );
}

export default AdminPage;
