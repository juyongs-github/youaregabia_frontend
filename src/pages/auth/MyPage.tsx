import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import { updateProfile, logout } from "../../store/authSlice";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdEdit } from "react-icons/md";
import { FaBell } from "react-icons/fa";
import api from "../../api/axios";
import { cartUtils } from "../../api/goodsApi";

interface NotificationItem {
  id: number;
  message: string;
  boardId: number;
  isRead: boolean;
  createdAt: string;
}

type Tab = "profile" | "boards" | "replies";

interface MyBoard {
  boardId: number;
  title: string;
  boardType: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

interface MyReply {
  replyId: number;
  boardId: number;
  boardTitle: string;
  content: string;
  likeCount: number;
  createdAt: string;
}

function MyPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [myBoards, setMyBoards] = useState<MyBoard[]>([]);
  const [myReplies, setMyReplies] = useState<MyReply[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (activeTab === "boards" && myBoards.length === 0) {
      api
        .get("/api/mypage/boards")
        .then((res) => setMyBoards(res.data))
        .catch(() => {});
    }
    if (activeTab === "replies" && myReplies.length === 0) {
      api
        .get("/api/mypage/replies")
        .then((res) => setMyReplies(res.data))
        .catch(() => {});
    }
    if (activeTab === "profile") {
      api
        .get("/api/notifications")
        .then((res) => setNotifications(res.data))
        .catch(() => {});
    }
  }, [activeTab]);

  const handleNotifClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await api.patch(`/api/notifications/${n.id}/read`);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.boardId) navigate(`/community/share/${n.boardId}`);
  };

  const handleMarkAllRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

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
      const res = await api.delete("/api/auth/withdraw");
      if (res.status === 200) {
        alert("회원탈퇴가 완료됐습니다.");
        cartUtils.clear();
        dispatch(logout());
        navigate("/login", { replace: true });
      }
    } catch {
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  const tabStyle = (tab: Tab) =>
    `px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? "border-red-500 text-white"
        : "border-transparent text-gray-400 hover:text-white"
    }`;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 text-white">
      {/* 상단 프로필 */}
      <div className="flex items-center gap-8 mb-8">
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
          <p className="text-gray-400 text-sm mt-1">
            {user?.role === "ADMIN" ? "관리자" : user?.role === "CRITIC" ? "평론가" : "일반 회원"}
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-700 mb-6">
        <button className={tabStyle("profile")} onClick={() => setActiveTab("profile")}>
          내 정보
        </button>
        <button className={tabStyle("boards")} onClick={() => setActiveTab("boards")}>
          내가 쓴 게시글
        </button>
        <button className={tabStyle("replies")} onClick={() => setActiveTab("replies")}>
          내가 쓴 댓글
        </button>
      </div>

      {/* 내 정보 탭 */}
      {activeTab === "profile" && (
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
          <div className="pt-4 text-right">
            <button
              onClick={handleWithdraw}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-700 rounded-lg hover:bg-red-900/30 hover:text-red-400 hover:border-red-700 transition-colors"
            >
              회원탈퇴
            </button>
          </div>
        </div>
      )}

      {/* 알림 이력 (내 정보 탭 하단) */}
      {activeTab === "profile" && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaBell size={15} className="text-gray-400" />
              <h2 className="text-base font-semibold text-white">알림 이력</h2>
              <span className="text-xs text-gray-500">({notifications.length}건)</span>
            </div>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                모두 읽음
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">알림 이력이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    n.isRead
                      ? "bg-gray-900/50 border-gray-800 hover:border-gray-600"
                      : "bg-blue-950/30 border-blue-900/50 hover:border-blue-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                    <div className={!n.isRead ? "" : "ml-5"}>
                      <p className="text-sm text-white leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.createdAt?.slice(0, 10)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 내가 쓴 게시글 탭 */}
      {activeTab === "boards" && (
        <div className="space-y-3">
          {myBoards.length === 0 ? (
            <p className="text-gray-500 text-center py-12">작성한 게시글이 없습니다.</p>
          ) : (
            myBoards.map((b) => (
              <div
                key={b.boardId}
                onClick={() => navigate(`/community/board/${b.boardId}`)}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-500 mr-2">[{b.boardType}]</span>
                    <span className="font-medium">{b.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">{b.createdAt?.slice(0, 10)}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>조회 {b.viewCount}</span>
                  <span>좋아요 {b.likeCount}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 내가 쓴 댓글 탭 */}
      {activeTab === "replies" && (
        <div className="space-y-3">
          {myReplies.length === 0 ? (
            <p className="text-gray-500 text-center py-12">작성한 댓글이 없습니다.</p>
          ) : (
            myReplies.map((r) => (
              <div
                key={r.replyId}
                onClick={() => navigate(`/community/board/${r.boardId}`)}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-600 transition-colors"
              >
                <p className="text-xs text-gray-500 mb-1">{r.boardTitle}</p>
                <p className="text-sm">{r.content}</p>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>좋아요 {r.likeCount}</span>
                  <span>{r.createdAt?.slice(0, 10)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MyPage;
