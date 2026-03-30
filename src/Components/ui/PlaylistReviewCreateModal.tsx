import Box from "@mui/material/Box";
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
  
  // Redux에서 user 정보 가져오기
  const user = useSelector((state: any) => state.auth.user);

  return (
    <div className="kf-expansion-modal modal-overlay">
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
            onChange={(_event, newValue) => {
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
          <button
            className="submit-btn"
            onClick={() => {
              if (rating === 0) {
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

              // API 호출
              reviewApi
                .createReview({
                  playlistId: playlistId,
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
            }}
          >작성</button>
        </div>
      </div>
    </div>
  );
}

export default PlaylistReviewCreateModal;