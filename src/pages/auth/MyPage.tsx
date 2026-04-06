import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import { updateProfile, logout } from "../../store/authSlice";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdEdit } from "react-icons/md";
import { FaBell } from "react-icons/fa";
import api from "../../api/axios";
import { cartUtils } from "../../api/goodsApi";
import "../../styles/mypage-kfandom.css";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ConfirmToast from "../../components/ui/ConfirmToast";
import { useConfirmToast } from "../../hooks/useConfirmToast";

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
  boardType: string;
  content: string;
  likeCount: number;
  createdAt: string;
}

function MyPage() {
  const { toast, showToast, closeToast } = useToast();
  const { confirmToast, confirm, closeConfirm } = useConfirmToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [myBoards, setMyBoards] = useState<MyBoard[]>([]);
  const [myReplies, setMyReplies] = useState<MyReply[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const checked = useSelector((state: RootState) => state.attendance.checked);

  useEffect(() => {
    if (activeTab === "boards" && myBoards.length === 0) {
      api.get("/api/mypage/boards").then((res) => setMyBoards(res.data)).catch(() => {});
    }
    if (activeTab === "replies" && myReplies.length === 0) {
      api.get("/api/mypage/replies").then((res) => setMyReplies(res.data)).catch(() => {});
    }
    if (activeTab === "profile") {
      api.get("/api/notifications").then((res) => setNotifications(res.data)).catch(() => {});
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
    await api.patch("/api/notifications/read-all");
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
    const confirmed = await confirm(
      "정말 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다."
    );
    if (!confirmed) return;
    try {
      const res = await api.delete("/api/auth/withdraw");
      if (res.status === 200) {
        showToast("회원탈퇴가 완료됐습니다.", "success");
        cartUtils.clear();
        dispatch(logout());
        navigate("/login", { replace: true });
      }
    } catch {
      showToast("탈퇴 처리 중 오류가 발생했습니다.", "error");
    }
  };

  const roleLabel =
    user?.role === "ADMIN" ? "관리자" : user?.role === "CRITIC" ? "평론가" : "일반 회원";

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <ConfirmToast state={confirmToast} onClose={closeConfirm} />
    <div className="kf-my-page">
      {/* 프로필 헤더 */}
      <div className="kf-my-hero">
        <div className="kf-my-avatar-wrap">
          <div className="kf-my-avatar">
            {user?.imgUrl ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL ?? ""}${user.imgUrl}`}
                alt="Profile"
              />
            ) : (
              <span className="kf-my-avatar__placeholder">이미지 없음</span>
            )}
          </div>
          <button className="kf-my-edit-btn" onClick={handleEditClick} aria-label="프로필 사진 변경">
            <MdEdit size={14} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
        <div className="kf-my-hero-info">
          <h1 className="kf-my-name">{user?.name}</h1>
          <span className="kf-my-role">{roleLabel}</span>
        </div>
      </div>

      {/* 탭 + 출석 버튼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div className="kf-my-tabs" style={{ flex: 1, marginBottom: 0 }}>
          {(["profile", "boards", "replies"] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`kf-my-tab${activeTab === tab ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "profile" ? "내 정보" : tab === "boards" ? "내가 쓴 게시글" : "내가 쓴 댓글"}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate("/profile/check")}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            border: checked ? "1px solid rgba(109,94,252,0.3)" : "1px solid rgba(234,179,8,0.4)",
            background: checked ? "rgba(109,94,252,0.08)" : "rgba(234,179,8,0.08)",
            color: checked ? "#6d5efc" : "#a16207",
            cursor: "pointer",
          }}
        >
          <span>📅</span>
          <span>{checked ? "출석 완료" : "출석 체크"}</span>
        </button>
      </div>

      {/* 내 정보 탭 */}
      {activeTab === "profile" && (
        <>
          <div className="kf-my-card">
            <div className="kf-my-field">
              <label>이름</label>
              <input type="text" value={user?.name || ""} readOnly />
            </div>
            <div className="kf-my-field">
              <label>이메일</label>
              <input type="email" value={user?.email || ""} readOnly />
            </div>
            <div className="kf-my-withdraw">
              <button className="kf-my-withdraw-btn" onClick={handleWithdraw}>
                회원탈퇴
              </button>
            </div>
          </div>

          {/* 알림 이력 */}
          <div className="kf-my-notif-wrap">
            <div className="kf-my-notif-header">
              <div className="kf-my-notif-title">
                <FaBell size={14} />
                알림 이력
                <span className="kf-my-notif-count">({notifications.length}건)</span>
              </div>
              {notifications.some((n) => !n.isRead) && (
                <button className="kf-my-notif-read-all" onClick={handleMarkAllRead}>
                  모두 읽음
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="kf-my-notif-empty">알림 이력이 없습니다.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={`kf-my-notif-item${!n.isRead ? " unread" : ""}`}
                  onClick={() => handleNotifClick(n)}
                >
                  {!n.isRead && <span className="kf-my-notif-dot" />}
                  <div style={{ marginLeft: n.isRead ? 18 : 0 }}>
                    <p className="kf-my-notif-msg">{n.message}</p>
                    <p className="kf-my-notif-date">{n.createdAt?.slice(0, 10)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {/* 내가 쓴 게시글 탭 */}
      {activeTab === "boards" && (
        <div>
          {myBoards.length === 0 ? (
            <p className="kf-my-empty">작성한 게시글이 없습니다.</p>
          ) : (
            myBoards.map((b) => (
              <div
                key={b.boardId}
                className="kf-my-list-item"
                onClick={() => navigate(b.boardType === "FREE" ? `/community/free/${b.boardId}` : `/community/share/${b.boardId}`)}
              >
                <div className="kf-my-item-top">
                  <div className="kf-my-item-left">
                    <span className="kf-my-item-tag">
                      {b.boardType === "PLAYLIST_SHARE" ? "플레이리스트 공유" : b.boardType === "FREE" ? "자유게시판" : b.boardType}
                    </span>
                    <span className="kf-my-item-title">{b.title}</span>
                  </div>
                  <span className="kf-my-item-date">{b.createdAt?.slice(0, 10)}</span>
                </div>
                <div className="kf-my-item-meta">
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
        <div>
          {myReplies.length === 0 ? (
            <p className="kf-my-empty">작성한 댓글이 없습니다.</p>
          ) : (
            myReplies.map((r) => (
              <div
                key={r.replyId}
                className="kf-my-list-item"
                onClick={() => navigate(r.boardType === "FREE" ? `/community/free/${r.boardId}` : `/community/share/${r.boardId}`)}
              >
                <div className="kf-my-item-left" style={{ marginBottom: 4 }}>
                  <span className="kf-my-item-tag">
                    {r.boardType === "PLAYLIST_SHARE" ? "플레이리스트 공유" : r.boardType === "FREE" ? "자유게시판" : r.boardType}
                  </span>
                  <span className="kf-my-reply-board">{r.boardTitle}</span>
                </div>
                <p className="kf-my-reply-content">{r.content}</p>
                <div className="kf-my-reply-bottom">
                  <span>좋아요 {r.likeCount}</span>
                  <span>{r.createdAt?.slice(0, 10)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
    </>
  );
}

export default MyPage;
