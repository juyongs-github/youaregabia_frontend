import { useState } from "react";
import { FaPlus, FaTimes, FaCalendarAlt } from "react-icons/fa";
import { playlistApi } from "../../api/playlistApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import "../../styles/modal.css";

interface Props {
  onClose: () => void;
  onCreated?: () => void;
}

function CollaboPlaylistCreateModal({ onClose, onCreated }: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buildDeadline = (): string | null => {
    if (!deadlineDate) return null;
    return `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, "0")}-${String(deadlineDate.getDate()).padStart(2, "0")}T23:59:59`;
  };

  return (
    <div className="modal-overlay">
      <form
        className="modal-container"
        onSubmit={(e) => {
          e.preventDefault();

          if (!user?.email) {
            alert("로그인이 필요합니다.");
            return;
          }

          if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
          }

          if (!deadlineDate) {
            alert("마감일을 입력해주세요.");
            return;
          }

          if (description.length > 100) {
            alert("요청 내용은 최대 100자까지 입력할 수 있습니다.");
            return;
          }

          const formData = new FormData();
          formData.append("title", title);
          formData.append("description", description);
          formData.append("email", user.email);
          formData.append("type", "COLLABORATIVE");

          const deadline = buildDeadline();
          if (deadline) formData.append("deadline", deadline);

          if (image) {
            formData.append("file", image);
          }

          playlistApi
            .createPlaylist(formData)
            .then((res) => {
              if (res.data) {
                alert("플레이리스트가 생성되었습니다.");
                onCreated?.();
                onClose();
              }
            })
            .catch((error) => {
              alert("플레이리스트 생성에 실패했습니다.");
              console.error(error);
            });
        }}
      >
        <div className="modal-header">
          <h2>공동 플레이리스트 주제 등록</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* 썸네일 */}
        <label className="thumbnail-box">
          {preview ? (
            <img src={preview} className="absolute inset-0 w-full h-full rounded-2xl" />
          ) : (
            <>
              <FaPlus size={20} />
              <span>클릭하여 이미지 업로드</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImage(file);
              if (preview) URL.revokeObjectURL(preview);
              setPreview(URL.createObjectURL(file));
            }}
          />
        </label>

        {/* 제목 */}
        <label>제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={50}
          placeholder="플레이리스트 제목"
        />

        {/* 요청 내용 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ margin: 0 }}>요청 내용</label>
          <span style={{ fontSize: "13px", color: description.length > 100 ? "#f87171" : "#6b8099" }}>
            {description.length} / 100
          </span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="요청 내용을 입력하세요. (최대 100자)"
        />

        {/* 마감일 */}
        <label>마감일</label>

        {/* 날짜 선택 */}
        <div style={{ position: "relative", width: "100%" }}>
          <DatePicker
            selected={deadlineDate}
            onChange={(date: Date | null) => {
              setDeadlineDate(date);
            }}
            minDate={today}
            locale={ko}
            dateFormat="yyyy년 MM월 dd일"
            placeholderText="날짜를 선택하세요"
            popperPlacement="bottom-start"
            portalId="collabo-datepicker-portal"
            wrapperClassName="w-full"
            customInput={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  borderRadius: "16px",
                  background: "rgba(247, 248, 255, 0.88)",
                  border: "1.5px solid rgba(88, 95, 138, 0.22)",
                  color: deadlineDate ? "#1f2430" : "#8e97ab",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  userSelect: "none",
                  width: "100%",
                  boxShadow: "0 2px 8px rgba(80, 90, 140, 0.06)",
                  boxSizing: "border-box",
                }}
              >
                <span>{deadlineDate
                  ? `${deadlineDate.getFullYear()}년 ${String(deadlineDate.getMonth() + 1).padStart(2, "0")}월 ${String(deadlineDate.getDate()).padStart(2, "0")}일`
                  : "날짜를 선택하세요"
                }</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {deadlineDate && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setDeadlineDate(null); }}
                      style={{ color: "#6b8099", fontSize: "18px", lineHeight: 1, cursor: "pointer" }}
                    >
                      ×
                    </span>
                  )}
                  <FaCalendarAlt size={14} style={{ opacity: 0.5, color: "#677086" }} />
                </div>
              </div>
            }
          />
        </div>

        {/* 버튼 */}
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="submit-btn">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}

export default CollaboPlaylistCreateModal;
