import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaCheck,
  FaClock,
  FaComment,
  FaCrown,
  FaEdit,
  FaExclamationTriangle,
  FaHeart,
  FaInfoCircle,
  FaMusic,
  FaPause,
  FaPlay,
  FaPlus,
  FaRedo,
  FaSearch,
  FaStopwatch,
  FaThumbsUp,
  FaTrash,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import CollaboPlaylistEditModal from "../../components/ui/CollaboPlaylistEditModal";
import { GoDotFill } from "react-icons/go";
import { GrFormPrevious } from "react-icons/gr";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { playlistApi } from "../../api/playlistApi";
import { playlistSongApi, type CollaboSong } from "../../api/playlistSongApi";
import type { Song } from "../../components/ui/SongListItem";
import type { CollaboPlaylist } from "../../types/playlist";
import MusicPlayer from "../../components/layout/MusicPlayer";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return diff + "초 전";
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 2592000) return Math.floor(diff / 86400) + "일 전";
  return Math.floor(diff / 2592000) + "달 전";
}

function CollaboPlaylistDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [playlist, setPlaylist] = useState<CollaboPlaylist | null>(null);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(true);
  const [songs, setSongs] = useState<CollaboSong[]>([]);
  const [isSongsLoading, setIsSongsLoading] = useState(false);

  const [songFilter, setSongFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showReopenPanel, setShowReopenPanel] = useState(false);
  const [reopenDeadlineDate, setReopenDeadlineDate] = useState<Date | null>(null);

  const [playerSongs, setPlayerSongs] = useState<Song[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);

  const [suggestTarget, setSuggestTarget] = useState<Song | null>(null);
  const [suggestReason, setSuggestReason] = useState("");
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [addedSongIds, setAddedSongIds] = useState<Set<number>>(new Set());

  const [isImporting, setIsImporting] = useState(false);

  // 추가 이유 수정 상태
  const [editingReasonId, setEditingReasonId] = useState<number | null>(null);
  const [editingReasonText, setEditingReasonText] = useState("");

  const isCreator = !!user?.email && playlist?.creatorEmail === user.email;
  const isClosed = playlist?.deadline ? new Date() > new Date(playlist.deadline) : false;

  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!playlist?.deadline) {
      setTimeLeft("");
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      const diff = new Date(playlist.deadline!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      if (days > 0) setTimeLeft(`${days}일 ${hours}시간 ${minutes}분 남음`);
      else if (hours > 0) setTimeLeft(`${hours}시간 ${minutes}분 남음`);
      else if (minutes > 0) setTimeLeft(`${minutes}분 남음`);
      else setTimeLeft(`${seconds}초 남음`);
      timer = setTimeout(update, diff < 60000 ? 1000 : 60000);
    };
    update();
    return () => clearTimeout(timer);
  }, [playlist?.deadline]);

  const fetchPlaylist = async () => {
    if (!id) return;
    try { const res = await playlistApi.getPlaylist(id, user?.email ?? ""); setPlaylist(res.data as CollaboPlaylist); }
    catch (e) { console.error(e); }
  };

  const fetchSongs = async () => {
    if (!id) return;
    setIsSongsLoading(true);
    try {
      const res = await playlistSongApi.getCollaborativeSongs(Number(id), user?.email);
      setSongs((res.data || []).slice().sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSongsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true); setHasSearched(true);
    try { const res = await api.get("/api/search", { params: { q: searchQuery } }); setSearchResults(res.data || []); }
    catch (e) { console.error(e); setSearchResults([]); }
    finally { setIsSearching(false); }
  };

  // 곡 제안 (유저당 최대 5곡)
  const handleSuggestSong = async (song: Song, reason: string) => {
    if (!id || !user?.email) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      await playlistSongApi.suggestSong(Number(id), song.id, user.email, reason || undefined);
      alert("곡이 추가되었습니다.");
      setAddedSongIds((prev) => new Set(prev).add(song.id));
      fetchSongs();
    } catch (e: any) {
      alert(e?.response?.data ?? "곡 추가에 실패했습니다.");
    }
  };

  // 추가 이유 수정
  const handleUpdateReason = async (playlistSongId: number) => {
    if (!user?.email) return;
    if (editingReasonText.length > 50) {
      alert("추가 이유는 최대 50자까지 입력할 수 있습니다.");
      return;
    }
    try {
      await playlistSongApi.updateReason(playlistSongId, user.email, editingReasonText);
      setSongs((prev) =>
        prev.map((s) =>
          s.playlistSongId === playlistSongId ? { ...s, reason: editingReasonText } : s
        )
      );
      setEditingReasonId(null);
    } catch (e) {
      alert("추가 이유 수정에 실패했습니다.");
    }
  };

  // 곡 삭제 (작성자 or 등록자)
  const handleRemoveSong = async (playlistSongId: number) => {
    if (!user?.email) return;
    if (!window.confirm("이 곡을 삭제하시겠습니까?")) return;
    try {
      await playlistSongApi.removeSongFromPlaylist(playlistSongId, user.email);
      fetchSongs();
    } catch (e) {
      alert("곡 삭제에 실패했습니다.");
    }
  };

  // 투표 / 투표 취소
  const handleVote = async (song: CollaboSong) => {
    if (!id || !user?.email) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      if (song.hasVoted) {
        await playlistSongApi.cancelVote(Number(id), song.playlistSongId, user.email);
      } else {
        await playlistSongApi.vote(Number(id), song.playlistSongId, user.email);
      }
      setSongs((prev) =>
        prev.map((s) =>
          s.playlistSongId === song.playlistSongId
            ? { ...s, hasVoted: !s.hasVoted, voteCount: (s.voteCount ?? 0) + (s.hasVoted ? -1 : 1) }
            : s
        )
      );
    } catch (e: any) {
      alert(e?.response?.data ?? "투표에 실패했습니다.");
    }
  };

  const handleEarlyClose = async () => {
    if (!playlist || !window.confirm("지금 바로 마감하시겠습니까?")) return;

    const now = new Date();
    const deadline = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const dto = {
      title: playlist.title,
      description: playlist.description ?? "",
      deadline: deadline,
    };

    const formData = new FormData();
    formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));

    try {
      await playlistApi.updatePlaylist(Number(id), formData);
      fetchPlaylist();
    } catch (e) {
      alert("마감 처리에 실패했습니다.");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!id || !window.confirm("플레이리스트를 삭제하시겠습니까?")) return;
    try {
      await playlistApi.deletePlaylist(Number(id));
      navigate("/community/collabo");
    } catch (e) {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleLike = async () => {
    if (!id || !user?.email) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      if (playlist?.hasLiked) {
        await playlistApi.unlikeCollabo(Number(id), user.email);
      } else {
        await playlistApi.likeCollabo(Number(id), user.email);
      }
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              hasLiked: !prev.hasLiked,
              likeCount: (prev.likeCount ?? 0) + (prev.hasLiked ? -1 : 1),
            }
          : prev
      );
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "좋아요에 실패했습니다.");
    }
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    setPlayerSongs(songs);
    setPlayerIndex(0);
    setIsPlayerVisible(true);
  };
  const handlePlaySong = (index: number) => {
    setPlayerSongs(songs);
    setPlayerIndex(index);
    setIsPlayerVisible(true);
  };

  const handleReopen = async () => {
    if (!id || !user?.email) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!reopenDeadlineDate) {
      alert("새 마감일을 설정해주세요.");
      return;
    }
    const d = reopenDeadlineDate;
    const newDeadline = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T23:59:59`;
    try {
      await playlistApi.reopenCollabo(Number(id), user.email, newDeadline);
      setShowReopenPanel(false);
      setReopenDeadlineDate(null);
      fetchPlaylist();
    } catch (e: any) {
      alert(e?.response?.data ?? "참여 재개에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchPlaylist();
    fetchSongs();
  }, [id, user?.email]);

  const handleImport = async () => {
    if (!id || !user?.email) return;
    setIsImporting(true);
    try {
      await playlistApi.importCollabo(Number(id), user.email);
      setPlaylist((prev) => (prev ? { ...prev, hasImported: true } : prev));
      alert("내 플레이리스트로 가져왔습니다.");
    } catch (e) {
      alert((e as { response?: { data?: string } })?.response?.data ?? "가져오기에 실패했습니다.");
    } finally {
      setIsImporting(false);
    }
  };

  const canDelete = (song: CollaboSong) =>
    !!user?.email && (isCreator || song.suggestedByEmail === user.email);

  return (
    <div className="flex flex-col w-full gap-12">
      <button
        className="flex items-center self-start gap-3"
        onClick={() => navigate("/community/collabo")}
      >
        <GrFormPrevious size={30} />
        <span className="text-xl font-bold">목록</span>
      </button>

      {/* 플레이리스트 정보 */}
      <div className="flex gap-8">
        <div className="flex-shrink-0 w-52 h-52 bg-slate-700 rounded-2xl overflow-hidden">
          {playlist?.imageUrl
            ? <img src={"http://localhost:8080" + playlist.imageUrl} alt="" className="w-full h-full object-cover" />
            : <div className="flex items-center justify-center w-full h-full"><FaMusic size={48} className="text-white opacity-40" /></div>
          }
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
          <div className="flex flex-col gap-2">
            <p className="text-base text-gray-400">공동 플레이리스트 제작</p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold truncate">{playlist?.title || "-"}</p>
              {isClosed ? (
                <span className="px-3 py-1 text-sm font-semibold text-gray-400 border rounded-full bg-gray-500/20 border-gray-500/30">
                  마감
                </span>
              ) : (
                <span className="px-3 py-1 text-sm font-semibold text-green-300 border rounded-full bg-green-500/20 border-green-500/30">
                  참여 진행중
                </span>
              )}
            </div>
            {playlist?.description && (
              <p className="text-gray-300 line-clamp-3">{playlist.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-5 mt-4 text-base text-gray-400">
            {playlist?.participantCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <FaUsers size={16} />
                <span>{playlist.participantCount}명 참여</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FaMusic size={16} />
              <span>{songs.length}곡</span>
            </div>
            {playlist?.createdAt && (
              <div className="flex items-center gap-1.5">
                <FaClock size={16} />
                <span>{timeAgo(playlist.createdAt)}</span>
              </div>
            )}
            {playlist?.creatorEmail && (
              <div className="flex items-center gap-1.5">
                <FaCrown size={16} className="text-yellow-400" />
                <span>등록자: </span>
                <span className="text-white">{playlist.creatorName || playlist.creatorEmail}</span>
              </div>
            )}
          </div>
          {playlist?.deadline && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-base text-gray-400">
                <FaClock size={16} />
                <span>마감일: </span>
                <span className={isClosed ? "text-gray-400" : "text-red-300"}>
                  {playlist.deadline.replace("T", " ")}
                </span>
              </div>
              {!isClosed && timeLeft && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 w-fit">
                  <FaStopwatch size={16} className="text-orange-400" />
                  <span className="text-sm font-bold text-orange-400">{timeLeft}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            {songs.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 transition-colors rounded-full text-base font-semibold"
              >
                <FaPlay size={12} />
                전체 듣기
              </button>
            )}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-semibold transition-colors ${
                playlist?.hasLiked
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              <FaHeart size={13} />
              {playlist?.likeCount ?? 0}
            </button>
            {isClosed && user && !playlist?.hasImported && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition-colors rounded-full text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPlus size={13} />
                {isImporting ? "추가하는 중..." : "내 플레이리스트 추가"}
              </button>
            )}
            {isCreator && (
              <>
                {!isClosed && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full text-base font-semibold"
                  >
                    <FaEdit size={13} />
                    수정
                  </button>
                )}
                {isClosed && (
                  <button
                    onClick={() => setShowReopenPanel((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-colors rounded-full text-base font-semibold"
                  >
                    <FaRedo size={13} />
                    참여 재개
                  </button>
                )}
                {!isClosed && playlist?.deadline && (
                  <button
                    onClick={handleEarlyClose}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 transition-colors rounded-full text-base font-semibold"
                  >
                    <FaClock size={13} />
                    마감하기
                  </button>
                )}
                <button
                  onClick={handleDeletePlaylist}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors rounded-full text-base font-semibold"
                >
                  <FaTrash size={13} />
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isCreator &&
        isClosed &&
        showReopenPanel &&
        (() => {
          const tomorrow = new Date();
          tomorrow.setHours(0, 0, 0, 0);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-[#1a2535] rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaRedo size={15} className="text-green-400" />
                    <h3 className="text-lg font-bold text-white">참여 재개</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowReopenPanel(false);
                      setReopenDeadlineDate(null);
                    }}
                    className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-full bg-white/10 hover:bg-white/20 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  새 마감일을 설정하면 참여자들이 다시 곡을 추가하고 투표할 수 있습니다.
                </p>
                <div>
                  <label className="block mb-2 text-sm text-gray-400">새 마감일</label>
                  <DatePicker
                    selected={reopenDeadlineDate}
                    onChange={(date: Date | null) => setReopenDeadlineDate(date)}
                    minDate={tomorrow}
                    locale={ko}
                    dateFormat="yyyy년 MM월 dd일"
                    placeholderText="날짜를 선택하세요"
                    popperPlacement="bottom"
                    popperProps={{ strategy: "fixed" }}
                    wrapperClassName="w-full"
                    customInput={
                      <div
                        className="flex items-center justify-between px-4 py-3 transition-colors border cursor-pointer rounded-xl bg-white/5 border-white/10 hover:border-white/20"
                        style={{
                          color: reopenDeadlineDate ? "white" : "#6b8099",
                          userSelect: "none",
                        }}
                      >
                        <span className="text-sm">
                          {reopenDeadlineDate
                            ? `${reopenDeadlineDate.getFullYear()}년 ${String(reopenDeadlineDate.getMonth() + 1).padStart(2, "0")}월 ${String(reopenDeadlineDate.getDate()).padStart(2, "0")}일`
                            : "날짜를 선택하세요"}
                        </span>
                        <div className="flex items-center gap-2">
                          {reopenDeadlineDate && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setReopenDeadlineDate(null);
                              }}
                              className="text-lg leading-none text-gray-500 transition-colors cursor-pointer hover:text-white"
                            >
                              ×
                            </span>
                          )}
                          <FaCalendarAlt size={14} className="opacity-50" />
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => {
                      setShowReopenPanel(false);
                      setReopenDeadlineDate(null);
                    }}
                    className="flex-1 py-3 text-sm font-semibold text-gray-300 transition-colors rounded-xl bg-white/10 hover:bg-white/15"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReopen}
                    className="flex-1 py-3 text-sm font-semibold text-white transition-colors bg-green-600 rounded-xl hover:bg-green-500"
                  >
                    재개하기
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* 주의사항 */}
      {user && (
        <div className="text-base text-gray-400 bg-yellow-500/30 border border-white/10 rounded-lg px-5 py-4 flex flex-col gap-1.5">
          <p className="flex items-center gap-2 font-semibold text-yellow-300">
            <FaExclamationTriangle size={13} />
            주의사항
          </p>
          <p className="text-sm">
            • 1인당 최대 5곡까지 추가할 수 있으며 최대 3곡까지 투표할 수 있습니다.
          </p>
          <p className="text-sm">
            • 등록자의 설정한 마감일까지 곡 추가와 투표를 진행할 수 있습니다.
          </p>
          <p className="text-sm">
            • 등록자의 요청에 따라 조기 마감 될 수 있으며, 참여자가 추가한 수록곡이 삭제 될 수
            있습니다.
          </p>
          <p className="text-sm">
            • 마감일이 지나면 곡 추가와 투표가 불가능하며, 투표 순위가 가장 높은 상위 10곡이 최종
            수록곡으로 확정됩니다.
          </p>
          <p className="text-sm">
            • 마감일까지 추가된 곡이 3곡 미만일 경우 해당 플레이리스트는 자동 삭제됩니다.
          </p>
        </div>
      )}

      {/* 수록곡 + 검색 패널 */}
      {isPlaylistLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div>
          {/* 수록곡 */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold">수록곡</h2>
              {!isClosed && user && (
                <button
                  onClick={() => {
                    setShowAddSongModal(true);
                    setSearchQuery("");
                    setSearchResults([]);
                    setHasSearched(false);
                    setAddedSongIds(new Set());
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors bg-red-600 rounded-3xl hover:bg-red-700 shrink-0"
                >
                  <FaPlus size={13} />곡 추가
                </button>
              )}
            </div>
            {songs.length > 0 && (
              <div className="relative mb-3">
                <FaSearch
                  size={13}
                  className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2"
                />
                <input
                  value={songFilter}
                  onChange={(e) => setSongFilter(e.target.value)}
                  placeholder="곡명 또는 아티스트 검색"
                  className="w-full pl-9 pr-4 py-2.5 text-base rounded-lg bg-white/5 border border-white/10 outline-none focus:border-white/30 transition-colors placeholder-white/30"
                />
              </div>
            )}
            {isSongsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : songs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                <FaMusic size={36} className="opacity-40" />
                <p>아직 수록곡이 없습니다.</p>
                {!isClosed && (
                  <p className="text-sm">위의 곡 추가 버튼을 눌러 곡을 추가해보세요.</p>
                )}
              </div>
            ) : (
              (() => {
                const filteredSongs = songs.filter(
                  (s) =>
                    !songFilter.trim() ||
                    s.trackName?.toLowerCase().includes(songFilter.toLowerCase()) ||
                    s.artistName?.toLowerCase().includes(songFilter.toLowerCase())
                );
                const displaySongs = isClosed ? filteredSongs.slice(0, 10) : filteredSongs;

                return (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {displaySongs.map((song, index) => {
                      const rank = index + 1;
                      return (
                        <div
                          key={song.playlistSongId}
                          onClick={() => handlePlaySong(index)}
                          className={
                            "flex items-center gap-5 p-5 rounded-xl transition-colors group cursor-pointer bg-gray-900 hover:bg-gray-800"
                          }
                        >
                          {/* 순위 번호 (마감 후) */}
                          {isClosed && (
                            <div className="w-8 text-center shrink-0">
                              <span className="text-base font-bold text-gray-400">{rank}</span>
                            </div>
                          )}

                          {/* 앨범 아트 */}
                          <div className="relative w-24 h-24 overflow-hidden shrink-0 rounded-xl bg-slate-600">
                            {song.imgUrl ? (
                              <img
                                src={song.imgUrl}
                                alt=""
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <FaMusic size={18} className="text-white opacity-40" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center transition-opacity rounded-lg opacity-0 bg-black/50 group-hover:opacity-100">
                              <FaPlay size={14} />
                            </div>
                          </div>

                          {/* 곡 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center min-w-0 gap-2">
                              <p className="text-lg font-semibold truncate" title={song.trackName}>
                                {song.trackName}
                              </p>
                              {song.suggestedByEmail === user?.email && (
                                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  내가 추가한 곡
                                </span>
                              )}
                            </div>
                            <p className="text-base text-gray-400 truncate flex items-center gap-1 mt-0.5">
                              {song.artistName}
                              {song.genreName && (
                                <>
                                  <GoDotFill size={8} className="shrink-0" />
                                  {song.genreName}
                                </>
                              )}
                            </p>
                            {song.suggestedByEmail && (
                              <p className="flex items-center gap-1 mt-1">
                                <FaUser size={15} className="text-gray-500 shrink-0" />
                                <span className="text-sm text-gray-400">참여자: </span>
                                <span className="text-sm text-white truncate">
                                  {song.suggestedByName || song.suggestedByEmail}
                                </span>
                              </p>
                            )}
                            {(song.reason || song.suggestedByEmail === user?.email) &&
                              (editingReasonId === song.playlistSongId ? (
                                <div
                                  className="mt-2 overflow-hidden border rounded-xl bg-white/5 border-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <textarea
                                    value={editingReasonText}
                                    onChange={(e) => setEditingReasonText(e.target.value)}
                                    rows={2}
                                    autoFocus
                                    className="w-full px-3 pt-3 pb-1 text-sm text-white bg-transparent outline-none resize-none placeholder-white/20"
                                    placeholder="추가 이유를 입력하세요."
                                  />
                                  <div className="flex items-center justify-between px-3 pb-2">
                                    <span
                                      className="text-xs"
                                      style={{
                                        color:
                                          editingReasonText.length > 50 ? "#f87171" : "#ffffff40",
                                      }}
                                    >
                                      {editingReasonText.length} / 50
                                    </span>
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => setEditingReasonId(null)}
                                        className="px-3 py-1 text-xs text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-white/10"
                                      >
                                        취소
                                      </button>
                                      <button
                                        onClick={() => handleUpdateReason(song.playlistSongId)}
                                        className="px-3 py-1 text-xs font-semibold text-blue-300 transition-colors rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
                                      >
                                        저장
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p
                                  className={`flex items-center gap-1 mt-1 group/reason ${
                                    !isClosed && song.suggestedByEmail === user?.email
                                      ? "cursor-pointer"
                                      : ""
                                  }`}
                                  onClick={(e) => {
                                    if (!isClosed && song.suggestedByEmail === user?.email) {
                                      e.stopPropagation();
                                      setEditingReasonId(song.playlistSongId);
                                      setEditingReasonText(song.reason ?? "");
                                    }
                                  }}
                                >
                                  <FaComment size={15} className="text-gray-500 shrink-0" />
                                  <span className="text-sm text-gray-400 shrink-0">
                                    추가 이유:{" "}
                                  </span>
                                  <span className="text-sm text-white truncate">
                                    {song.reason ||
                                      (!isClosed && song.suggestedByEmail === user?.email ? (
                                        <span className="text-gray-600 transition-colors group-hover/reason:text-gray-400">
                                          작성하기...
                                        </span>
                                      ) : (
                                        <span className="text-gray-600">없음</span>
                                      ))}
                                  </span>
                                  {!isClosed && song.suggestedByEmail === user?.email && (
                                    <FaEdit
                                      size={12}
                                      className="text-gray-600 transition-all opacity-0 shrink-0 group-hover/reason:opacity-100 group-hover/reason:text-blue-400"
                                    />
                                  )}
                                </p>
                              ))}
                          </div>

                          {/* 삭제 (마감 전 + 작성자 or 등록자) */}
                          {!isClosed && canDelete(song) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSong(song.playlistSongId);
                              }}
                              className="flex items-center justify-center w-8 h-8 text-red-400 transition-colors rounded-full opacity-0 bg-red-500/20 hover:bg-red-500/40 hover:text-red-300 group-hover:opacity-100 shrink-0"
                            >
                              <FaTrash size={13} />
                            </button>
                          )}

                          {/* 투표 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(song);
                            }}
                            disabled={!user || isClosed}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors shrink-0 disabled:cursor-not-allowed ${
                              isClosed
                                ? "bg-white/5 text-gray-400"
                                : song.hasVoted
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "bg-white/10 hover:bg-white/20 text-gray-300"
                            }`}
                          >
                            <FaThumbsUp size={11} />
                            {song.voteCount ?? 0}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* 곡 추가 검색 모달 */}
      {showAddSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1a2535] rounded-2xl p-6 w-full max-w-lg mx-4 flex flex-col gap-4 max-h-[80vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">곡 추가</h3>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-full bg-white/10 hover:bg-white/20 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="곡명 또는 아티스트 검색"
                className="flex-1 px-4 py-2.5 text-base rounded-lg bg-white/5 border border-white/10 outline-none focus:border-white/30 transition-colors placeholder-white/30"
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 transition-colors bg-red-600 rounded-lg hover:bg-red-700"
              >
                <FaSearch size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : hasSearched && searchResults.length === 0 ? (
                <p className="py-10 text-center text-gray-400">검색 결과가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-4 transition-colors rounded-xl bg-white/5 hover:bg-white/10"
                    >
                      <div className="relative w-16 h-16 overflow-hidden shrink-0 rounded-xl bg-slate-600">
                        {song.imgUrl ? (
                          <img src={song.imgUrl} alt="" className="object-cover w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <FaMusic size={18} className="text-white opacity-40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate" title={song.trackName}>
                          {song.trackName}
                        </p>
                        <p className="text-sm text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          {song.artistName}
                          {song.genreName && (
                            <>
                              <GoDotFill size={8} className="shrink-0" />
                              {song.genreName}
                            </>
                          )}
                        </p>
                      </div>
                      {song.previewUrl && (
                        <button
                          onClick={() => {
                            if (
                              isPlayerVisible &&
                              playerSongs[0]?.id === song.id &&
                              !isPreviewPaused
                            ) {
                              setIsPreviewPaused(true);
                            } else {
                              setPlayerSongs([song]);
                              setPlayerIndex(0);
                              setIsPlayerVisible(true);
                              setIsPreviewPaused(false);
                            }
                          }}
                          className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors shrink-0 ${
                            isPlayerVisible && playerSongs[0]?.id === song.id && !isPreviewPaused
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-white/10 hover:bg-white/20 text-gray-300"
                          }`}
                        >
                          {isPlayerVisible && playerSongs[0]?.id === song.id && !isPreviewPaused ? (
                            <FaPause size={13} />
                          ) : (
                            <FaPlay size={13} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSuggestTarget(song);
                          setSuggestReason("");
                        }}
                        disabled={
                          !user ||
                          addedSongIds.has(song.id) ||
                          songs.some(
                            (s) =>
                              s.trackName === song.trackName && s.artistName === song.artistName
                          )
                        }
                        className={`flex items-center justify-center transition-colors rounded-full w-9 h-9 shrink-0 disabled:cursor-not-allowed ${
                          addedSongIds.has(song.id) ||
                          songs.some(
                            (s) =>
                              s.trackName === song.trackName && s.artistName === song.artistName
                          )
                            ? "bg-green-600 text-white"
                            : "bg-red-600 hover:bg-red-700 disabled:opacity-40"
                        }`}
                      >
                        {addedSongIds.has(song.id) ||
                        songs.some(
                          (s) => s.trackName === song.trackName && s.artistName === song.artistName
                        ) ? (
                          <FaCheck size={16} />
                        ) : (
                          <FaPlus size={15} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {!user && hasSearched && (
                <p className="mt-2 text-sm text-center text-gray-400">
                  로그인 후 곡을 추가할 수 있습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && playlist && (
        <CollaboPlaylistEditModal
          playlistId={Number(id)}
          initialTitle={playlist.title}
          initialDescription={playlist.description ?? ""}
          initialDeadline={playlist.deadline ?? ""}
          initialImageUrl={playlist.imageUrl}
          onClose={() => setShowEditModal(false)}
          onUpdated={fetchPlaylist}
        />
      )}

      {/* 곡 추가 모달 */}
      {suggestTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-[#1a2535] rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-7">
            <h3 className="text-lg font-bold text-white">곡 추가</h3>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              {suggestTarget.imgUrl && (
                <img
                  src={suggestTarget.imgUrl}
                  className="object-cover w-10 h-10 rounded-lg shrink-0"
                />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white truncate">{suggestTarget.trackName}</span>
                <p className="text-sm text-gray-400 truncate flex items-center gap-1 mt-0.5">
                  {suggestTarget.artistName}
                  {suggestTarget.genreName && (
                    <>
                      <GoDotFill size={8} className="shrink-0" />
                      {suggestTarget.genreName}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-1">
                <label className="text-sm text-gray-400">추가 이유 (선택)</label>
                <span
                  className="text-sm"
                  style={{ color: suggestReason.length > 50 ? "#f87171" : "#6b8099" }}
                >
                  {suggestReason.length} / 50
                </span>
              </div>
              <textarea
                value={suggestReason}
                onChange={(e) => setSuggestReason(e.target.value)}
                placeholder="이 곡을 추가하는 이유를 작성해주세요."
                rows={3}
                className="bg-[#111c2b] text-white text-sm rounded-xl p-3 resize-none outline-none border border-white/10 focus:border-blue-500 placeholder-gray-600"
              />
            </div>
            <div className="flex gap-[14px] mt-[6px]">
              <button
                type="button"
                onClick={() => setSuggestTarget(null)}
                className="flex-1 py-[14px] rounded-[14px] bg-[#444] text-white text-[15px] cursor-pointer hover:bg-[#555] transition-colors"
              >
                취소
              </button>

              <button
                onClick={() => {
                  if (suggestReason.length > 50) {
                    alert("추가 이유는 최대 50자까지 입력할 수 있습니다.");
                    return;
                  }
                  handleSuggestSong(suggestTarget, suggestReason);
                  setSuggestTarget(null);
                }}
                className="flex-1 py-[14px] rounded-[14px] bg-white text-black font-bold text-[15px] cursor-pointer hover:bg-gray-200 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {isPlayerVisible && playerSongs.length > 0 && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer
            song={playerSongs[playerIndex]}
            setIsPlayerVisible={() => {
              setIsPlayerVisible(false);
              setIsPreviewPaused(false);
            }}
            songs={playerSongs}
            songIndex={playerIndex}
            onSongChange={(index) => setPlayerIndex(index)}
            externalPaused={isPreviewPaused}
          />
        </div>
      )}
    </div>
  );
}

export default CollaboPlaylistDetailPage;
