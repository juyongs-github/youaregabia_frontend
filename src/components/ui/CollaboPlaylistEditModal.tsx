import { useState } from "react";
import { FaPlus, FaTimes, FaCalendarAlt } from "react-icons/fa";
import { playlistApi } from "../../api/playlistApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface Props {
  playlistId: number;
  initialTitle: string;
  initialDescription: string;
  initialDeadline?: string;
  initialImageUrl?: string;
  onClose: () => void;
  onUpdated: () => void;
}

function CollaboPlaylistEditModal({
  playlistId,
  initialTitle,
  initialDescription,
  initialDeadline = "",
  initialImageUrl,
  onClose,
  onUpdated,
}: Props) {
  const initDate = initialDeadline ? new Date(initialDeadline) : null;

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initialImageUrl ? `${BASE_URL}${initialImageUrl}` : null
  );
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(initDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        onSubmit={async (e) => {
          e.preventDefault();
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

          const deadline = buildDeadline();

          const dto = {
            title,
            description,
            deadline
          };

          const formData = new FormData();

          formData.append(
            "dto",
            new Blob([JSON.stringify(dto)], { type: "application/json" })
          );

          if (image) {
            formData.append("file", image);
          }

          setIsSubmitting(true);
          try {
            await playlistApi.updatePlaylist(playlistId, formData);
            alert("플레이리스트가 수정되었습니다.");
            onUpdated();
            onClose();
          } catch (e) {
            alert("수정에 실패했습니다.");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div className="modal-header">
          <h2>공동 플레이리스트 주제 수정</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* 썸네일 */}
        <label className="thumbnail-box">
          {preview ? (
            <img src={preview} className="absolute inset-0 w-full h-full rounded-[18px] object-cover" />
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
            onChange={(date: Date | null) => setDeadlineDate(date)}
            minDate={today}
            locale={ko}
            dateFormat="yyyy년 MM월 dd일"
            placeholderText="날짜를 선택하세요"
            popperPlacement="right-start"
            popperProps={{ strategy: "fixed" }}
            wrapperClassName="w-full"
            customInput={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "#1b2b3b",
                  border: "1.5px solid transparent",
                  color: deadlineDate ? "white" : "#6b8099",
                  fontSize: "15px",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  userSelect: "none",
                  width: "100%",
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
                  <FaCalendarAlt size={14} style={{ opacity: 0.6 }} />
                </div>
              </div>
            }
          />
        </div>

        {/* 버튼 */}
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>취소</button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CollaboPlaylistEditModal;
