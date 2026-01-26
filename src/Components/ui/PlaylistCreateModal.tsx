import { useState } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import "../../styles/PlaylistCreateModal.css";

interface Props {
  onClose: () => void;
}

function PlaylistCreateModal({ onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("댄스");

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>플레이리스트 생성</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* 썸네일 */}
        <div className="thumbnail-box">
          <FaPlus />
          <span>클릭하여 이미지 업로드</span>
        </div>

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
          placeholder="원하는 분위기나 상황을 적어주세요"
        />

        {/* 버튼 */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button className="submit-btn">생성</button>
        </div>
      </div>
    </div>
  );
}

export default PlaylistCreateModal;
