import { useState } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import { playlistApi } from "../../api/playlistApi";

interface Props {
  onClose: () => void;
  onCreated: () => void; 
}

function PlaylistCreateModal({ onClose, onCreated }: Props) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="modal-overlay">
      <form
        className="modal-container"
        onSubmit={(e) => {
          e.preventDefault();

          if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
          }

          const formData = new FormData();
          formData.append("title", title);
          formData.append("description", description);

          if (image) {
            formData.append("file", image);
          }

          playlistApi
            .createPlaylist(formData)
            .then((res) => {
              alert("플레이리스트가 생성되었습니다.");
              onCreated(); 
              onClose();
            })
            .catch((error) => {
              alert("플레이리스트 생성에 실패했습니다.");
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
  );
}

export default PlaylistCreateModal;