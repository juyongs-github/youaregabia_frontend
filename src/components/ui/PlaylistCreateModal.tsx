import { useState } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import { playlistApi } from "../../api/playlistApi";
import Toast from "./Toast";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function PlaylistCreateModal({ onClose, onCreated }: Props) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="modal-overlay">
        <form
          className="modal-container"
          onSubmit={(e) => {
            e.preventDefault();

            if (!title.trim()) {
              showToast("제목을 입력해주세요.", "error");
              return;
            }

            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("type", "MYPLAYLIST");

            if (image) {
              formData.append("file", image);
            }

            playlistApi
              .createPlaylist(formData)
              .then(() => {
                showToast("플레이리스트가 생성되었습니다.", "success");
                onCreated();
                setTimeout(onClose, 1800);
              })
              .catch((error) => {
                showToast("플레이리스트 생성에 실패했습니다.", "error");
                console.error(error);
              });
          }}
        >
          <div className="modal-header">
            <h2>플레이리스트 생성</h2>
            <button type="button" className="close-btn" onClick={onClose}>
              <FaTimes size={20} />
            </button>
          </div>

          {/* 썸네일 */}
          <label className="thumbnail-box w-64 mx-auto block">
            {preview ? (
              <img src={preview} className="h-full w-full rounded-[18px] object-cover" />
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

                if (preview) {
                  URL.revokeObjectURL(preview);
                }
                setPreview(URL.createObjectURL(file));
              }}
            />
          </label>

          {/* 제목 */}
          <label>제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="플레이리스트 제목"
          />

          {/* 설명 */}
          <label>설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="플레이리스트에 대한 설명을 작성해주세요."
          />

          {/* 버튼 */}
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="submit-btn">
              생성
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default PlaylistCreateModal;
