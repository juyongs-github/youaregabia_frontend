import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { reviewApi } from "../../api/reviewApi";
import { playlistApi } from "../../api/playlistApi";
import { playlistSongApi } from "../../api/playlistSongApi";
import Rating from "@mui/material/Rating";
import { FaStar, FaRegStar, FaTrash, FaMusic, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { HiPencil } from "react-icons/hi2";
import { MdRateReview } from "react-icons/md";
import { RiPlayList2Fill } from "react-icons/ri";
import PlaylistReviewViewModal from "../../components/ui/PlaylistReviewViewModal";

const BASE_URL = "http://localhost:8080";

interface Review {
  id: number;
  rating: number;
  content: string;
  userEmail?: string;
  email?: string;
  playlistId?: number;
  playlistTitle?: string;
  createdAt?: string;
}

interface PlaylistInfo {
  title: string;
  imageUrl: string;
}

interface Song {
  id: number;
  trackName: string;
  artistName: string;
  genreName?: string;
  imgUrl?: string;
}

type TabType = "all" | "mine";
type SortType = "latest" | "rating_desc" | "rating_asc";

function PlaylistReviewPage() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sort, setSort] = useState<SortType>("latest");

  // 플레이리스트 id → { title, imageUrl } 맵
  const [playlistInfoMap, setPlaylistInfoMap] = useState<Map<number, PlaylistInfo>>(new Map());

  // 수정 모달 (playlistId 기반)
  const [editPlaylistId, setEditPlaylistId] = useState<number | null>(null);

  // 아코디언: 열린 playlistId Set
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  // 아코디언: playlistId → 곡 목록 캐시
  const [playlistSongsMap, setPlaylistSongsMap] = useState<Map<number, Song[]>>(new Map());
  // 아코디언: 로딩 중인 playlistId Set
  const [loadingSongIds, setLoadingSongIds] = useState<Set<number>>(new Set());

  const fetchPlaylistInfos = async () => {
    try {
      const res = await playlistApi.getAllPlaylist();
      const playlists: any[] = res.data || [];
      const map = new Map<number, PlaylistInfo>();
      playlists.forEach((p) => {
        if (p.id != null) map.set(p.id, { title: p.title ?? "", imageUrl: p.imageUrl ?? "" });
      });
      setPlaylistInfoMap(map);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllReviews = async () => {
    setIsLoading(true);
    try {
      const res = await reviewApi.getAllReview();
      setAllReviews(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      const res = await reviewApi.getReviewByUser(user.email);
      setMyReviews(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 마운트 시 플레이리스트 정보 맵 1회 로드
  useEffect(() => {
    fetchPlaylistInfos();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      fetchAllReviews();
    } else {
      fetchMyReviews();
    }
  }, [activeTab]);

  const toggleAccordion = async (playlistId: number) => {
  const next = new Set(expandedIds);

  if (next.has(playlistId)) {
    next.delete(playlistId);
    setExpandedIds(next);
    return;
  }

  next.add(playlistId);
  setExpandedIds(next);

  // 이미 불러온 경우 캐시 사용
  if (playlistSongsMap.has(playlistId)) return;

  setLoadingSongIds((prev) => new Set(prev).add(playlistId));

  try {
      const res = await playlistSongApi.getSongsByPlaylist(playlistId);

      const songs: Song[] = res.data ?? [];

      setPlaylistSongsMap((prev) => {
        const map = new Map(prev);
        map.set(playlistId, songs);
        return map;
      });
    } catch (e) {
      console.error(e);

      setPlaylistSongsMap((prev) => {
        const map = new Map(prev);
        map.set(playlistId, []);
        return map;
      });
    } finally {
      setLoadingSongIds((prev) => {
        const set = new Set(prev);
        set.delete(playlistId);
        return set;
      });
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    try {
      await reviewApi.deleteReview(reviewId);
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e) {
      console.error(e);
      alert("리뷰 삭제에 실패했습니다.");
    }
  };

  const getSortedReviews = (reviews: Review[]) => {
    return [...reviews].sort((a, b) => {
      if (sort === "rating_desc") return b.rating - a.rating;
      if (sort === "rating_asc") return a.rating - b.rating;
      return b.id - a.id;
    });
  };

  const currentReviews = getSortedReviews(activeTab === "all" ? allReviews : myReviews);

  const avgRating =
    allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : "0.0";

  const maskEmail = (email?: string) => {
    if (!email) return "익명";
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const getPlaylistInfo = (review: Review): PlaylistInfo | undefined => {
    if (review.playlistId != null) return playlistInfoMap.get(review.playlistId);
    return undefined;
  };

  return (
    <div className="min-h-screen text-white px-8 py-10">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <MdRateReview size={32} className="text-white/80" />
          <h1 className="text-3xl font-bold">추천 플레이리스트 리뷰</h1>
        </div>

        {/* 전체 통계 (전체 탭일 때만) */}
        {activeTab === "all" && (
          <div className="flex items-center gap-6 mb-6 px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold">{avgRating}</div>
              <div className="text-white/50 text-sm mt-1">평균 별점</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold">{allReviews.length}</div>
              <div className="text-white/50 text-sm mt-1">전체 리뷰</div>
            </div>
            <div className="ml-auto">
              <Rating
                value={parseFloat(avgRating)}
                precision={0.1}
                readOnly
                icon={<FaStar color="yellow" />}
                emptyIcon={<FaRegStar color="white" />}
              />
            </div>
          </div>
        )}

        {/* 탭 + 정렬 */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              activeTab === "all"
                ? "bg-white text-black"
                : "text-white/60 border border-white/20 hover:bg-white/10"
            }`}
          >
            전체 리뷰
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              activeTab === "mine"
                ? "bg-white text-black"
                : "text-white/60 border border-white/20 hover:bg-white/10"
            }`}
          >
            내 리뷰
          </button>

          {/* 정렬 */}
          <div className="ml-auto flex gap-2">
            {(
              [
                { value: "latest", label: "최신순" },
                { value: "rating_desc", label: "별점 높은순" },
                { value: "rating_asc", label: "별점 낮은순" },
              ] as { value: SortType; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  sort === opt.value
                    ? "bg-white/20 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 리뷰 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-20 text-white/50">불러오는 중...</div>
        ) : currentReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
            <MdRateReview size={48} />
            <p>{activeTab === "all" ? "아직 리뷰가 없습니다." : "작성한 리뷰가 없습니다."}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {currentReviews.map((review) => {
              const info = getPlaylistInfo(review);
              const title = review.playlistTitle ?? info?.title;
              const imageUrl = info?.imageUrl ? `${BASE_URL}${info.imageUrl}` : null;

              const pid = review.playlistId;
              const isExpanded = pid != null && expandedIds.has(pid);
              const songs = pid != null ? (playlistSongsMap.get(pid) ?? null) : null;
              const isSongsLoading = pid != null && loadingSongIds.has(pid);

              return (
                <div
                  key={review.id}
                  className="flex flex-col rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
                >
                  {/* 카드 상단: 앨범 커버 이미지 + 리뷰 */}
                  <div className="flex items-center gap-5 px-5 py-5">
                    {/* 앨범 커버 */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-white/10">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={title ?? "플레이리스트"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <RiPlayList2Fill size={36} className="text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* 리뷰 내용 */}
                    <div className="flex flex-col gap-2.5 flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1.5 min-w-0 overflow-hidden">
                          {title && (
                            <span
                              className="text-sm text-white/70 font-bold truncate max-w-full cursor-default"
                              title={title}
                            >
                              {title}
                            </span>
                          )}
                          <Rating
                            value={review.rating}
                            readOnly
                            size="medium"
                            icon={<FaStar color="yellow" />}
                            emptyIcon={<FaRegStar color="white" />}
                          />
                        </div>

                        {/* 내 리뷰 탭: 수정/삭제 */}
                        {activeTab === "mine" && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => pid != null && setEditPlaylistId(pid)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm text-white/70 transition-all"
                            >
                              <HiPencil size={15} />
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-sm text-red-400 transition-all"
                            >
                              <FaTrash size={13} />
                              삭제
                            </button>
                          </div>
                        )}
                      </div>

                      <p
                        className="text-base text-white/80 leading-relaxed cursor-default"
                        title={review.content}
                      >
                        {review.content}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm text-white/30">
                          {maskEmail(review.userEmail ?? review.email)}
                        </span>
                        {review.createdAt && (
                          <span className="text-sm text-white/30">
                            {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 수록곡 아코디언 버튼 */}
                  {pid != null && (
                    <button
                      onClick={() => toggleAccordion(pid)}
                      className="flex items-center gap-2 w-full justify-center py-2.5 text-sm text-white hover:bg-white/5 transition-all border-t border-white/10"
                    >
                      {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                      {isExpanded ? "수록곡 접기" : "수록곡 보기"}
                    </button>
                  )}

                  {/* 수록곡 목록 */}
                  {isExpanded && (
                    <div className="border-t border-white/10 px-5 py-3 flex flex-col gap-1">
                      {isSongsLoading ? (
                        <p className="text-sm text-white/40 text-center py-3">불러오는 중...</p>
                      ) : !songs || songs.length === 0 ? (
                        <p className="text-sm text-white/40 text-center py-3">수록곡 정보가 없습니다.</p>
                      ) : (
                        songs.map((song, idx) => (
                          <div key={song.id} className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-white/5 transition-all">
                            <span className="text-xs text-white/30 w-5 text-center flex-shrink-0">{idx + 1}</span>
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                              {song.imgUrl ? (
                                <img src={song.imgUrl} alt={song.trackName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FaMusic size={14} className="text-white/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm text-white/80 font-medium truncate">{song.trackName}</span>
                              <span className="text-xs text-white/40 truncate">{song.artistName}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editPlaylistId !== null && (
        <PlaylistReviewViewModal
          playlistId={editPlaylistId}
          onClose={() => {
            setEditPlaylistId(null);
            fetchMyReviews();
          }}
        />
      )}
    </div>
  );
}

export default PlaylistReviewPage;
