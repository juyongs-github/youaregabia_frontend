import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { reviewApi } from "../../api/reviewApi";
import { playlistApi } from "../../api/playlistApi";
import { playlistSongApi } from "../../api/playlistSongApi";
import type { Song } from "../../components/ui/SongListItem";
import Rating from "@mui/material/Rating";
import {
  FaStar,
  FaRegStar,
  FaTrash,
  FaMusic,
  FaChevronDown,
  FaChevronUp,
  FaPlay,
} from "react-icons/fa";
import { HiPencil } from "react-icons/hi2";
import { TbMessageStar } from "react-icons/tb";
import { RiPlayList2Fill } from "react-icons/ri";
import { FiCheck, FiSearch, FiX } from "react-icons/fi";
import MusicPlayer from "../../components/layout/MusicPlayer";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Review {
  id: number;
  rating: number;
  content: string;
  userEmail?: string;
  playlistId?: number;
  playlistTitle?: string;
  createdAt?: string;
}

interface PlaylistInfo {
  title: string;
  imageUrl: string;
}

type TabType = "all" | "mine";

function PlaylistReviewPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation();
  const locationState = (location.state as any) ?? {};

  const [activeTab, setActiveTab] = useState<TabType>(locationState.tab ?? "all");
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(locationState.searchQuery ?? "");

  // 플레이리스트 id → { title, imageUrl } 맵
  const [playlistInfoMap, setPlaylistInfoMap] = useState<Map<number, PlaylistInfo>>(new Map());

  // 인라인 수정 상태
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editContent, setEditContent] = useState<string>("");

  // 아코디언: 열린 playlistId Set
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  // 아코디언: playlistId → 곡 목록 캐시
  const [playlistSongsMap, setPlaylistSongsMap] = useState<Map<number, Song[]>>(new Map());
  // 아코디언: 로딩 중인 playlistId Set
  const [loadingSongIds, setLoadingSongIds] = useState<Set<number>>(new Set());

  // 플레이어 상태
  const [playerSongs, setPlayerSongs] = useState<Song[]>([]);
  const [playerIndex, setPlayerIndex] = useState<number>(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState<boolean>(false);
  const [playKey, setPlayKey] = useState<number>(0);

  const currentSong = playerSongs[playerIndex] ?? null;

  const playSongs = (songs: Song[], index: number) => {
    setPlayerSongs(songs);
    setPlayerIndex(index);
    setIsPlayerVisible(true);
    setPlayKey((k) => k + 1);
  };

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

    // 이미 캐시된 경우 API 재호출 없이 종료
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

  const handleUpdate = async (reviewId: number) => {
    if (!confirm("리뷰를 수정하시겠습니까?")) return;
    try {
      await reviewApi.updateReview(reviewId, {
        rating: String(editRating),
        content: editContent,
      });
      setMyReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, rating: editRating, content: editContent } : r
        )
      );
      setEditingReviewId(null);
    } catch (e) {
      console.error(e);
      alert("리뷰 수정에 실패했습니다.");
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

  const getPlaylistInfo = (review: Review): PlaylistInfo | undefined => {
    if (review.playlistId != null) return playlistInfoMap.get(review.playlistId);
    return undefined;
  };

  const maskEmail = (email?: string) => {
    if (!email) return "익명";
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const getFilteredReviews = (reviews: Review[]) => {
    let result = [...reviews].sort((a, b) => b.id - a.id);
    if (ratingFilter !== null) {
      result = result.filter((r) => r.rating === ratingFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => {
        const info = getPlaylistInfo(r);
        const title = (r.playlistTitle ?? info?.title ?? "").toLowerCase();
        const content = r.content.toLowerCase();
        const songs = r.playlistId != null ? (playlistSongsMap.get(r.playlistId) ?? []) : [];
        const songMatch = songs.some(
          (s) => s.trackName.toLowerCase().includes(q) || s.artistName.toLowerCase().includes(q)
        );
        return title.includes(q) || content.includes(q) || songMatch;
      });
    }
    return result;
  };

  const currentReviews = getFilteredReviews(activeTab === "all" ? allReviews : myReviews);

  return (
    <div
      className="min-h-screen px-8 py-10 text-white"
      style={{ paddingBottom: isPlayerVisible ? "160px" : undefined }}
    >
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <TbMessageStar size={32} className="text-white/80" />
          <h1 className="text-3xl font-bold">추천 플레이리스트 리뷰</h1>
        </div>

        {/* 검색 */}
        <div className="relative mb-5">
          <FiSearch
            size={16}
            className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2 text-white/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="플레이리스트 제목 / 리뷰 내용 / 수록곡 제목 · 아티스트 검색"
            className="w-full px-[3rem] py-3 text-sm text-white transition-colors border rounded-full bg-white/5 border-white/10 placeholder-white/30 outline-none focus:border-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute transition-all -translate-y-1/2 right-4 top-1/2 text-white/40 hover:text-white/70"
            >
              <FiX size={15} />
            </button>
          )}
        </div>

        {/* 탭 + 별점 필터 */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
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

          {/* 별점 필터 */}
          <div className="flex gap-1.5 ml-auto flex-wrap">
            <button
              onClick={() => setRatingFilter(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                ratingFilter === null
                  ? "bg-white/20 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              전체
            </button>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  ratingFilter === star
                    ? "bg-yellow-400/20 text-yellow-300"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <FaStar
                  size={15}
                  className={ratingFilter === star ? "text-yellow-300" : "text-white/40"}
                />
                {star}
              </button>
            ))}
          </div>
        </div>

        {/* 리뷰 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-20 text-white/50">불러오는 중...</div>
        ) : currentReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-white/40">
            <TbMessageStar size={48} />
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
                  className="flex flex-col overflow-hidden border rounded-2xl bg-white/5 border-white/10"
                >
                  {/* 카드 상단: 앨범 커버 이미지 + 리뷰 */}
                  <div className="flex items-center gap-5 px-5 py-5">
                    {/* 앨범 커버 */}
                    <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl bg-white/10">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={title ?? "플레이리스트"}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <RiPlayList2Fill size={36} className="text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* 리뷰 내용 */}
                    <div className="flex flex-col gap-2.5 flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2.5 min-w-0 overflow-hidden">
                          {title && (
                            <span
                              className="max-w-full text-sm font-bold truncate cursor-default text-white/70"
                              title={title}
                            >
                              {title}
                            </span>
                          )}
                          <Rating
                            value={editingReviewId === review.id ? editRating : review.rating}
                            readOnly={editingReviewId !== review.id}
                            size="medium"
                            icon={<FaStar color="yellow" />}
                            emptyIcon={<FaRegStar color="white" />}
                            onChange={(_e, val) => val != null && setEditRating(val)}
                          />
                        </div>

                        {/* 내 리뷰 탭: 수정/삭제 또는 수정 완료 */}
                        {activeTab === "mine" && (
                          <div className="flex flex-shrink-0 gap-1.5">
                            {editingReviewId === review.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdate(review.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/25 hover:bg-white/40 text-xs text-white transition-all"
                                >
                                  <FiCheck size={15} />
                                  수정
                                </button>
                                <button
                                  onClick={() => setEditingReviewId(null)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/70 hover:bg-red-500 text-xs text-white transition-all"
                                >
                                  ✕ 취소
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingReviewId(review.id);
                                    setEditRating(review.rating);
                                    setEditContent(review.content);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs text-white/80 transition-all"
                                >
                                  <HiPencil size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(review.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/70 hover:bg-red-500 text-xs text-white transition-all"
                                >
                                  <FaTrash size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {editingReviewId === review.id ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-sm rounded-lg resize-none bg-white/10 text-white/90 focus:outline-none focus:ring-1 focus:ring-white/30"
                        />
                      ) : (
                        <p
                          className="text-sm leading-relaxed cursor-default text-white/80"
                          title={review.content}
                        >
                          {review.content}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm text-bold text-white/50">
                          작성자: {maskEmail(review.userEmail)}
                        </span>

                        {review.createdAt && (
                          <span className="text-sm text-bold text-white/50">
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
                    <div className="flex flex-col gap-1 px-5 py-3 border-t border-white/10">
                      {/* 전체 듣기 버튼 */}
                      {songs && songs.length > 0 && (
                        <div className="flex items-center justify-between px-1 mb-1">
                          <span className="text-sm text-white/70">총 {songs.length}곡</span>
                          <button
                            onClick={() => playSongs(songs, 0)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white/70 hover:text-white transition-all"
                          >
                            <FaPlay size={9} />
                            전체 듣기
                          </button>
                        </div>
                      )}
                      {isSongsLoading ? (
                        <p className="py-3 text-sm text-center text-white/40">불러오는 중...</p>
                      ) : !songs || songs.length === 0 ? (
                        <p className="py-3 text-sm text-center text-white/40">
                          수록곡 정보가 없습니다.
                        </p>
                      ) : (
                        songs.map((song, idx) => {
                          const isCurrentSong =
                            isPlayerVisible && currentSong?.id === song.id && playerSongs === songs;

                          return (
                            <div
                              key={song.id}
                              className={`flex items-center gap-3 px-1 py-2 transition-all rounded-lg hover:bg-white/5 ${
                                isCurrentSong ? "bg-white/10" : ""
                              }`}
                            >
                              <span className="flex-shrink-0 w-5 text-xs text-center text-white/30">
                                {isCurrentSong ? (
                                  <span className="text-green-400">▶</span>
                                ) : (
                                  idx + 1
                                )}
                              </span>
                              <div className="flex-shrink-0 overflow-hidden rounded-lg w-9 h-9 bg-white/10">
                                {song.imgUrl ? (
                                  <img
                                    src={song.imgUrl}
                                    alt={song.trackName}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-full">
                                    <FaMusic size={14} className="text-white/30" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium truncate text-white/80">
                                  {song.trackName}
                                </span>
                                <span className="text-xs truncate text-white/40">
                                  {song.artistName}
                                  {song.genreName && ` · ${song.genreName}`}
                                </span>
                              </div>
                              {/* 개별 재생 버튼 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playSongs(songs, idx);
                                }}
                                className="flex items-center justify-center flex-shrink-0 w-8 h-8 transition-all rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                                title="이 곡 재생"
                              >
                                <FaPlay size={10} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 음악 재생 플레이어 */}
      {isPlayerVisible && currentSong && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer
            key={playKey}
            song={currentSong}
            songs={playerSongs}
            songIndex={playerIndex}
            onSongChange={setPlayerIndex}
            setIsPlayerVisible={() => {
              setIsPlayerVisible(false);
              setPlayerSongs([]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default PlaylistReviewPage;
