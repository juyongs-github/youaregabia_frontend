import Box from "@mui/material/Box";
import Rating from "@mui/material/Rating";
import { useState, useEffect } from "react";
import { FaRegStar, FaStar, FaTimes } from "react-icons/fa";
import { HiPencil } from "react-icons/hi2";
import { reviewApi } from "../../api/reviewApi";
import { useSelector } from "react-redux";

interface Review {
  id: number;
  rating: number;
  content: string;
  userEmail?: string;
  email?: string;
}

interface Props {
  onClose: () => void;
  playlistId: number;
}

function PlaylistReviewViewModal({ onClose, playlistId }: Props) {
  const user = useSelector((state: any) => state.auth.user);
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState<number | null>(0);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {

    const fetchReview = async () => {
      setIsLoading(true);
      try {
        const res = await reviewApi.getReviewByPlaylist(playlistId);
        const reviews = res.data;
        const userReview = reviews && reviews.length > 0 ? reviews[0] : null;
        if (userReview) {
          setReview(userReview);
          setEditRating(userReview.rating);
          setEditContent(userReview.content);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();

    return () => {
    };
  }, [playlistId, user?.email]);

  const handleUpdate = async () => {
    if (!editRating) {
      alert("별점을 선택해주세요.");
      return;
    }
    if (!editContent.trim()) {
      alert("한줄평을 작성해주세요.");
      return;
    }
    if (!review) return;

    try {
      const res = await reviewApi.updateReview(review.id, {
        rating: String(editRating),
        content: editContent.trim(),
      });
      if (res.status === 200 || res.status === 201) {
        alert("리뷰가 수정되었습니다.");
        setReview({ ...review, rating: editRating, content: editContent.trim() });
        setIsEditing(false);
      } else {
        alert("리뷰 수정 중 문제가 발생했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("리뷰 수정에 실패했습니다.");
    }
  };

  const handleCancelEdit = () => {
    if (review) {
      setEditRating(review.rating);
      setEditContent(review.content);
    }
    setIsEditing(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>리뷰 {isEditing ? "수정" : "보기"}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8 text-white">
            <span>불러오는 중...</span>
          </div>
        ) : review ? (
          <>
            {/* 별점 */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label>별점</label>
              <Rating
                name="rating"
                value={isEditing ? editRating : review.rating}
                size="large"
                readOnly={!isEditing}
                onChange={(_event, newValue) => {
                  if (isEditing) setEditRating(newValue);
                }}
                icon={<FaStar color="yellow" />}
                emptyIcon={<FaRegStar color="white" />}
              />
            </Box>

            {/* 한줄평 */}
            <label>한줄평</label>
            <textarea
              value={isEditing ? editContent : review.content}
              onChange={(e) => {
                if (isEditing) setEditContent(e.target.value);
              }}
              readOnly={!isEditing}
              placeholder="한줄평을 작성 해주세요."
            />

            {/* 버튼 */}
            <div className="modal-actions">
              {isEditing ? (
                <>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    취소
                  </button>
                  <button className="submit-btn" onClick={handleUpdate}>
                    수정 완료
                  </button>
                </>
              ) : (
                <>
                  <button className="cancel-btn" onClick={onClose}>
                    닫기
                  </button>
                  <button
                    className="submit-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    수정
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center py-8 text-white">
            <span>리뷰를 찾을 수 없습니다.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistReviewViewModal;
