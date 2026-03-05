import Box from "@mui/material/Box";
import Rating from "@mui/material/Rating";
import { useState } from "react";
import { FaRegStar, FaStar, FaTimes } from "react-icons/fa";

interface Props {
  onClose: () => void;
}

function PlaylistReviewModal({ onClose }: Props) {
  const [rating, setRating] = useState<number | null>(0);
  const [review, setReview] = useState<string>("");

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>리뷰 작성</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* 별점 */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label>별점</label>
          <Rating
            name="rating"
            value={rating}
            size="large"
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            icon={<FaStar color="yellow"/>}
            emptyIcon={<FaRegStar color="white"/>}
          />
        </Box>

        {/* 한줄평 */}
        <label>한줄평</label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="한줄평을 작성 해주세요."
        />

        {/* 버튼 */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button className="submit-btn">작성</button>
        </div>
      </div>
    </div>
  );
}

export default PlaylistReviewModal;