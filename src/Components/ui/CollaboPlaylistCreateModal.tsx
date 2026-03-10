import { useEffect, useRef, useState } from "react";
import { FaChevronRight, FaCheck, FaPlus, FaTimes } from "react-icons/fa";
import { playlistApi } from "../../api/playlistApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

const GENRES = ["댄스", "힙합", "K-POP", "인디", "재즈", "클래식", "R&B", "록"];

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
  const [genre, setGenre] = useState("");
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const genreRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setIsGenreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          const formData = new FormData();
          formData.append("title", title);
          formData.append("description", description);
          formData.append("email", user.email);
          formData.append("type", "COLLABORATIVE");

          if (genre) {
            formData.append("genre", genre);
          }

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
            <img src={preview} className="absolute inset-0 w-full h-full rounded-[18px]" />
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
        <label>요청 내용</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="요청 내용을 입력하세요."
        />

        {/* 장르 커스텀 드롭다운 */}
        <label>장르</label>
        <div ref={genreRef} style={{ position: "relative" }}>
          {/* 트리거 버튼 */}
          <button
            type="button"
            onClick={() => setIsGenreOpen((prev) => !prev)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: "#1b2b3b",
              color: genre ? "white" : "#6b8099",
              fontSize: "15px",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <span>{genre || "장르 선택"}</span>
            <FaChevronRight
              size={14}
              style={{
                transition: "transform 0.25s ease",
                transform: isGenreOpen ? "rotate(180deg)" : "rotate(0deg)",
                opacity: 0.6,
              }}
            />
          </button>

          {/* 드롭다운 목록 */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              left: "calc(100% + 8px)",
              width: "180px",
              background: "#1b2b3b",
              borderRadius: "12px",
              overflow: "hidden",
              padding: isGenreOpen ? "6px" : "0px",
              zIndex: 10,
              maxHeight: isGenreOpen ? "400px" : "0px",
              opacity: isGenreOpen ? 1 : 0,
              transition: "max-height 0.25s ease, opacity 0.2s ease",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGenre(g === genre ? "" : g);
                  setIsGenreOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: genre === g ? "#2a3d52" : "transparent",
                  color: "white",
                  fontSize: "14px",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (genre !== g) (e.currentTarget as HTMLElement).style.background = "#243347";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    genre === g ? "#2a3d52" : "transparent";
                }}
              >
                <span>{g}</span>
                {genre === g && <FaCheck size={12} style={{ color: "#60a5fa" }} />}
              </button>
            ))}
          </div>
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
