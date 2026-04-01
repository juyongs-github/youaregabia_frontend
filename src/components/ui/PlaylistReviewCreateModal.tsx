import Rating from "@mui/material/Rating";
import { useState } from "react";
import { FaRegStar, FaStar, FaTimes } from "react-icons/fa";
import { reviewApi } from "../../api/reviewApi";
import { useSelector } from "react-redux";
import "../../styles/PlaylistReviewCreateModal.kfandom.css";

interface Props {
  onClose: () => void;
  playlistId: number;
  onSuccess?: () => void;
}

function PlaylistReviewCreateModal({ onClose, playlistId, onSuccess }: Props) {
  const [rating, setRating] = useState<number | null>(0);
  const [review, setReview] = useState<string>("");

  const user = useSelector((state: any) => state.auth.user);

  const handleSubmit = () => {
    if (!rating) {
      alert("별점을 선택해주세요.");
      return;
    }
    if (!review.trim()) {
      alert("한줄평을 작성해주세요.");
      return;
    }
    if (!user?.email) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!playlistId) {
      alert("플레이리스트 ID가 필요합니다.");
      return;
    }

    reviewApi
      .createReview({
        playlistId,
        userEmail: user.email,
        rating: rating as number,
        content: review.trim(),
      })
      .then((res) => {
        if (res.status === 200 || res.status === 201) {
          alert("리뷰가 등록되었습니다.");
          onSuccess?.();
        } else {
          alert("리뷰 등록 중 문제가 발생했습니다.");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("리뷰 등록에 실패했습니다.");
      })
      .finally(() => {
        onClose();
      });
  };

  return (
    <div className="kf-expansion-modal modal-overlay">
      <div className="prc-modal">
        {/* 헤더 */}
        <div className="prc-header">
          <span className="prc-title">리뷰 작성</span>
          <button className="prc-close" onClick={onClose}>
            <FaTimes size={15} />
          </button>
        </div>

        {/* 별점 */}
        <div className="prc-section">
          <span className="prc-label">별점</span>
          <div className="prc-stars">
            <Rating
              name="rating"
              value={rating}
              onChange={(_e, v) => setRating(v)}
              icon={<FaStar size={34} color="#f59e0b" />}
              emptyIcon={<FaRegStar size={34} color="#d1d5db" />}
              sx={{ gap: "6px", display: "flex" }}
            />
          </div>
        </div>

        {/* 한줄평 */}
        <div className="prc-section">
          <span className="prc-label">한줄평</span>
          <textarea
            className="prc-textarea"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="한줄평을 작성해주세요."
          />
        </div>

        {/* 버튼 */}
        <div className="prc-actions">
          <button className="prc-btn prc-btn--cancel" onClick={onClose}>취소</button>
          <button className="prc-btn prc-btn--submit" onClick={handleSubmit}>작성</button>
        </div>
      </div>
    </div>
  );
}

export default PlaylistReviewCreateModal;
