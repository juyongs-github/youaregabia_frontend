import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import { updateProfile, logout } from "../../store/authSlice";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdEdit } from "react-icons/md";
import api from "../../api/axios";

function MyPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.email) return;

    const formData = new FormData();
    formData.append("email", user.email);
    formData.append("image", file);

    const res = await api.patch("/api/auth/update-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    dispatch(updateProfile({ imgUrl: res.data.imgUrl }));
  };

  const handleWithdraw = async () => {
    const confirmed = window.confirm(
      "정말 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다."
    );
    if (!confirmed) return;

    try {
      const res = await api.delete("/api/auth/withdraw", {
        data: { email: user?.email },
      });
      if (res.status === 200) {
        alert("회원탈퇴가 완료됐습니다.");
        dispatch(logout());
        navigate("/login", { replace: true });
      }
    } catch {
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 text-white">
      {/* 상단 프로필 구역 */}
      <div className="flex items-center gap-8 mb-12">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 bg-gray-800 flex items-center justify-center">
            {user?.imgUrl ? (
              <img
                src={`http://localhost:8080${user.imgUrl}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-sm">이미지 없음</span>
            )}
          </div>

          <button
            onClick={handleEditClick}
            className="absolute bottom-1 right-1 p-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors shadow-lg z-10"
            style={{ transform: "translate(25%, 25%)" }}
          >
            <MdEdit size={20} color="white" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold">{user?.name}</h1>
          <p className="text-gray-400">구독자 없음</p>
        </div>
      </div>

      {/* 정보 수정 구역 */}
      <div className="space-y-6 bg-gray-900/50 p-6 rounded-xl border border-gray-800">
        <div>
          <label className="block text-sm text-gray-400 mb-1">이름</label>
          <input
            type="text"
            value={user?.name || ""}
            readOnly
            className="w-full bg-gray-800 border-none rounded-lg p-3"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">이메일</label>
          <input
            type="email"
            value={user?.email || ""}
            readOnly
            className="w-full bg-gray-800 border-none rounded-lg p-3"
          />
        </div>
      </div>

      {/* 회원탈퇴 */}
      <div className="mt-8 text-right">
        <button
          onClick={handleWithdraw}
          className="px-4 py-2 text-sm text-gray-500 border border-gray-700 rounded-lg hover:bg-red-900/30 hover:text-red-400 hover:border-red-700 transition-colors"
        >
          회원탈퇴
        </button>
      </div>
    </div>
  );
}

export default MyPage;
