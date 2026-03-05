import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import { updateProfile } from "../../store/authSlice";
import { useRef } from "react";
import { MdEdit } from "react-icons/md";
import axios from "axios";

function MyPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 업로드 버튼 클릭 시 숨겨진 input 호출
  const handleEditClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.email) return;

    const formData = new FormData();
    formData.append("email", user.email);
    formData.append("image", file);

    const res = await axios.patch("http://localhost:8080/api/auth/update-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    dispatch(updateProfile({ imgUrl: res.data.imgUrl }));
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
    </div>
  );
}

export default MyPage;
