import "../../styles/collabo-playlist-detail-kfandom.css";
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { createPortal } from "react-dom";
import {
  FaCalendarAlt,
  FaCheck,
  FaClock,
  FaComment,
  FaCrown,
  FaEdit,
  FaExclamationTriangle,
  FaHeart,
  FaMusic,
  FaPause,
  FaPlay,
  FaPlus,
  FaRegCommentDots,
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
import FallbackCoverArt from "../../components/ui/FallbackCoverArt";
import ConfirmToast from "../../components/ui/ConfirmToast";
import { useConfirmToast } from "../../hooks/useConfirmToast";
import { isCollaboImported, markCollaboImported } from "../../utils/collaboImportTracker";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const resolveImageUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

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
  const { toast, showToast, closeToast } = useToast();
  const { confirmToast, confirm, closeConfirm } = useConfirmToast();
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
    try { const res = await playlistApi.getCollaborativePlaylist(Number(id)); setPlaylist(res.data); }
    catch (e) { console.error(e); }
    finally { setIsPlaylistLoading(false); }
  };

  const fetchSongs = async () => {
    if (!id) return;
    setIsSongsLoading(true);
    try {
      const res = await playlistSongApi.getCollaborativeSongs(Number(id));
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
      showToast("로그인이 필요합니다.", "info");
      return;
    }

    try {
      await playlistSongApi.suggestSong(Number(id), song.id, reason || undefined);
      showToast("곡이 추가되었습니다.", "success");
      setAddedSongIds((prev) => new Set(prev).add(song.id));
      fetchSongs();
    } catch (e: any) {
      showToast(e?.response?.data ?? "곡 추가에 실패했습니다.", "error");
    }
  };

  // 추가 이유 수정
  const handleUpdateReason = async (playlistSongId: number) => {
    if (!user?.email) return;
    if (editingReasonText.length > 50) {
      showToast("추가 이유는 최대 50자까지 입력할 수 있습니다.", "info");
      return;
    }
    try {
      await playlistSongApi.updateReason(playlistSongId, editingReasonText);
      setSongs((prev) =>
        prev.map((s) =>
          s.playlistSongId === playlistSongId ? { ...s, reason: editingReasonText } : s
        )
      );
      setEditingReasonId(null);
    } catch (e) {
      showToast("추가 이유 수정에 실패했습니다.", "error");
    }
  };

  // 곡 삭제 (작성자 or 등록자)
  const handleRemoveSong = async (playlistSongId: number) => {
    if (!user?.email) return;
    const confirmed = await confirm("이 곡을 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      await playlistSongApi.removeSongFromPlaylist(playlistSongId);
      fetchSongs();
    } catch (e) {
      showToast("곡 삭제에 실패했습니다.", "error");
    }
  };

  // 투표 / 투표 취소
  const handleVote = async (song: CollaboSong) => {
    if (!id || !user?.email) {
      showToast("로그인이 필요합니다.", "info");
      return;
    }
    try {
      if (song.hasVoted) {
        await playlistSongApi.cancelVote(Number(id), song.playlistSongId);
      } else {
        await playlistSongApi.vote(Number(id), song.playlistSongId);
      }
      setSongs((prev) =>
        prev.map((s) =>
          s.playlistSongId === song.playlistSongId
            ? { ...s, hasVoted: !s.hasVoted, voteCount: (s.voteCount ?? 0) + (s.hasVoted ? -1 : 1) }
            : s
        )
      );
    } catch (e: any) {
      showToast(e?.response?.data ?? "투표에 실패했습니다.", "error");
    }
  };

  const handleEarlyClose = async () => {
    if (!playlist) return;
    const confirmed = await confirm("지금 바로 마감하시겠습니까?");
    if (!confirmed) return;

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
      showToast("마감 처리에 실패했습니다.", "error");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!id) return;
    const confirmed = await confirm("플레이리스트를 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      await playlistApi.deletePlaylist(Number(id));
      navigate("/community/collabo");
    } catch (e) {
      showToast("삭제에 실패했습니다.", "error");
    }
  };

  const handleLike = async () => {
    if (!id || !user?.email) {
      showToast("로그인이 필요합니다.", "info");
      return;
    }
    try {
      if (playlist?.hasLiked) {
        await playlistApi.unlikeCollabo(Number(id));
      } else {
        await playlistApi.likeCollabo(Number(id));
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
      showToast(e?.response?.data?.message ?? "좋아요에 실패했습니다.", "error");
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
      showToast("로그인이 필요합니다.", "info");
      return;
    }
    if (!reopenDeadlineDate) {
      showToast("새 마감일을 설정해주세요.", "info");
      return;
    }
    const d = reopenDeadlineDate;
    const newDeadline = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T23:59:59`;
    try {
      await playlistApi.reopenCollabo(Number(id), newDeadline);
      setShowReopenPanel(false);
      setReopenDeadlineDate(null);
      fetchPlaylist();
    } catch (e: any) {
      showToast(e?.response?.data ?? "참여 재개에 실패했습니다.", "error");
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
      const res = await playlistApi.importCollabo(Number(id));
      markCollaboImported(Number(id), res.data?.id);
      setPlaylist((prev) => (prev ? { ...prev, hasImported: true } : prev));
      showToast("내 플레이리스트로 가져왔습니다.", "success");
    } catch (e) {
      showToast((e as { response?: { data?: string } })?.response?.data ?? "가져오기에 실패했습니다.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const canDelete = (song: CollaboSong) =>
    !!user?.email && (isCreator || song.suggestedByEmail === user.email);
  const modalRoot = typeof document !== "undefined" ? document.body : null;
  const collaboId = id ? Number(id) : null;
  const hasImportedPlaylist =
    collaboId !== null && isCollaboImported(collaboId, playlist?.hasImported);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <ConfirmToast state={confirmToast} onClose={closeConfirm} />
    <div className="kf-community-page kf-collabo-detail">
      <div className="kf-community-page__shell">
      <div className="flex flex-col w-full gap-8" style={{ padding: 24 }}>

      {/* 뒤로가기 */}
      <button
        className="flex items-center self-start gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
        style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(88,95,138,0.15)", color: "#677086" }}
        onClick={() => navigate("/community/collabo")}
      >
        <GrFormPrevious size={18} />
        <span>목록</span>
      </button>

      {/* 플레이리스트 정보 */}
      <div
        className="collabo-hero-card flex flex-col gap-5 p-6 rounded-2xl md:flex-row md:items-center"
        style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(88,95,138,0.12)", boxShadow: "0 4px 16px rgba(80,90,140,0.07)", backdropFilter: "blur(12px)" }}
      >
        {/* 썸네일 */}
        <div
          className="flex-shrink-0 self-center rounded-xl overflow-hidden flex items-center justify-center md:self-auto"
          style={{ width: 148, height: 148, background: "linear-gradient(135deg, rgba(109,94,252,0.12), rgba(255,92,168,0.10))", border: "1px solid rgba(88,95,138,0.10)" }}
        >
          <FallbackCoverArt
            src={resolveImageUrl(playlist?.imageUrl)}
            title={playlist?.title}
            size={148}
            radius={12}
            variant="collabo"
          />
        </div>

        {/* 정보 */}
        <div className="flex flex-col justify-between flex-1 min-w-0 gap-3 py-1">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold" style={{ color: "#8e97ab" }}>공동 플레이리스트 제작</p>
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <p className="text-2xl font-bold truncate" style={{ color: "#1f2430" }}>{playlist?.title || "-"}</p>
              {isClosed ? (
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(88,95,138,0.10)", color: "#8e97ab", border: "1px solid rgba(88,95,138,0.15)" }}>
                  마감
                </span>
              ) : (
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(57,201,167,0.12)", color: "#1aaa86", border: "1px solid rgba(57,201,167,0.25)" }}>
                  참여 진행중
                </span>
              )}
            </div>
            {playlist?.description && (
              <div
                className="w-full max-w-[560px]"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: "rgba(246, 248, 252, 0.92)",
                  border: "1px solid rgba(88,95,138,0.08)",
                }}
              >
                <div
                  className="shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(109,94,252,0.10)",
                    color: "#6d5efc",
                  }}
                >
                  <FaRegCommentDots size={11} />
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[11px] font-semibold tracking-[0.08em]"
                    style={{ color: "#8a92a8", marginBottom: 2 }}
                  >
                    요청 사항
                  </div>
                  <p className="text-sm line-clamp-2" style={{ color: "#4f5b72", margin: 0 }}>
                    {playlist.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "#8e97ab" }}>
            {playlist?.participantCount !== undefined && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(77,143,255,0.12)", border: "1px solid rgba(77,143,255,0.24)", color: "#356fd1" }}><FaUsers size={11} /><span>{playlist.participantCount}명 참여</span></div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(109,94,252,0.12)", border: "1px solid rgba(109,94,252,0.24)", color: "#5d4ff2" }}><FaMusic size={11} /><span>{songs.length}곡</span></div>
            {playlist?.createdAt && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(120,130,152,0.12)", border: "1px solid rgba(120,130,152,0.24)", color: "#657089" }}><FaClock size={11} /><span>{timeAgo(playlist.createdAt)}</span></div>
            )}
            {playlist?.creatorEmail && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "linear-gradient(135deg, rgba(109,94,252,0.14), rgba(255,92,168,0.10))", border: "1px solid rgba(109,94,252,0.22)" }}>
                <FaCrown size={11} style={{ color: "#f5a623" }} />
                <span style={{ color: "#1f2430", fontWeight: 600 }}>{playlist.creatorName || playlist.creatorEmail}</span>
              </div>
            )}
          </div>

          {playlist?.deadline && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8e97ab" }}>
                <FaClock size={11} />
                <span>마감일: </span>
                <span style={{ color: isClosed ? "#8e97ab" : "#e07020", fontWeight: 600 }}>
                  {playlist.deadline.replace("T", " ")}
                </span>
              </div>
              {!isClosed && timeLeft && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(255,141,77,0.10)", color: "#e07020", border: "1px solid rgba(255,141,77,0.20)" }}>
                  <FaStopwatch size={10} />{timeLeft}
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {songs.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", boxShadow: "0 4px 14px rgba(109,94,252,0.28)" }}
              >
                <FaPlay size={11} />전체 듣기
              </button>
            )}
            <button
              onClick={handleLike}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={playlist?.hasLiked
                ? { background: "linear-gradient(135deg, rgba(255,91,110,0.22), rgba(255,125,166,0.18))", color: "#d92c47", border: "1px solid rgba(255,91,110,0.30)" }
                : { background: "rgba(255,255,255,0.92)", color: "#70798f", border: "1px solid rgba(88,95,138,0.18)" }}
            >
              <FaHeart size={12} />{playlist?.likeCount ?? 0}
            </button>
            {isClosed && user && !hasImportedPlaylist && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "rgba(109,94,252,0.10)", color: "#6d5efc", border: "1px solid rgba(109,94,252,0.20)" }}
              >
                <FaPlus size={11} />{isImporting ? "추가하는 중..." : "내 플레이리스트 추가"}
              </button>
            )}
            {isCreator && (
              <>
                {!isClosed && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{ background: "rgba(109,94,252,0.12)", color: "#5d4ff2", border: "1px solid rgba(109,94,252,0.24)" }}
                  >
                    <FaEdit size={11} />수정
                  </button>
                )}
                {isClosed && (
                  <button
                    onClick={() => setShowReopenPanel((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{ background: "rgba(57,201,167,0.16)", color: "#138e71", border: "1px solid rgba(57,201,167,0.32)" }}
                  >
                    <FaRedo size={11} />참여 재개
                  </button>
                )}
                {!isClosed && playlist?.deadline && (
                  <button
                    onClick={handleEarlyClose}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{ background: "rgba(255,141,77,0.18)", color: "#cb5f14", border: "1px solid rgba(255,141,77,0.35)" }}
                  >
                    <FaClock size={11} />마감하기
                  </button>
                )}
                <button
                  onClick={handleDeletePlaylist}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{ background: "rgba(255,91,110,0.14)", color: "#d92c47", border: "1px solid rgba(255,91,110,0.30)" }}
                >
                  <FaTrash size={11} />삭제
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 참여 재개 모달 */}
      {isCreator && isClosed && showReopenPanel &&
        (() => {
          const tomorrow = new Date();
          tomorrow.setHours(0, 0, 0, 0);
          const reopenModal = (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(40,45,80,0.20)" }}>
              <div className="w-full max-w-sm mx-4 flex flex-col gap-5 p-6 rounded-2xl"
                style={{ background: "linear-gradient(180deg,#fff,rgba(247,248,255,0.98))", border: "1px solid rgba(200,205,230,0.6)", boxShadow: "0 32px 72px rgba(80,90,140,0.22)", color: "#1f2430" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaRedo size={14} style={{ color: "#1aaa86" }} />
                    <h3 className="text-base font-bold" style={{ color: "#1f2430" }}>참여 재개</h3>
                  </div>
                  <button
                    onClick={() => { setShowReopenPanel(false); setReopenDeadlineDate(null); }}
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                    style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(88,95,138,0.12)", color: "#8e97ab" }}
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm" style={{ color: "#677086" }}>
                  새 마감일을 설정하면 참여자들이 다시 곡을 추가하고 투표할 수 있습니다.
                </p>
                <div>
                  <label className="block mb-2 text-xs font-bold" style={{ color: "#1f2430" }}>새 마감일</label>
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
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                        style={{ background: "rgba(247,248,255,0.88)", border: "1.5px solid rgba(88,95,138,0.22)", color: reopenDeadlineDate ? "#1f2430" : "#8e97ab", fontSize: 14, userSelect: "none" }}
                      >
                        <span>
                          {reopenDeadlineDate
                            ? `${reopenDeadlineDate.getFullYear()}년 ${String(reopenDeadlineDate.getMonth() + 1).padStart(2, "0")}월 ${String(reopenDeadlineDate.getDate()).padStart(2, "0")}일`
                            : "날짜를 선택하세요"}
                        </span>
                        <div className="flex items-center gap-2">
                          {reopenDeadlineDate && (
                            <span onClick={(e) => { e.stopPropagation(); setReopenDeadlineDate(null); }}
                              className="text-lg leading-none cursor-pointer" style={{ color: "#8e97ab" }}>×</span>
                          )}
                          <FaCalendarAlt size={13} style={{ opacity: 0.5, color: "#677086" }} />
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowReopenPanel(false); setReopenDeadlineDate(null); }}
                    className="flex-1 py-3 text-sm font-bold rounded-2xl transition-colors"
                    style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(88,95,138,0.16)", color: "#677086" }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReopen}
                    className="flex-1 py-3 text-sm font-bold text-white rounded-2xl transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, #39c9a7, #1aaa86)", boxShadow: "0 6px 18px rgba(57,201,167,0.28)" }}
                  >
                    재개하기
                  </button>
                </div>
              </div>
            </div>
          );
          return modalRoot ? createPortal(reopenModal, modalRoot) : reopenModal;
        })()}

      {/* 주의사항 */}
      {user && (
        <div className="flex flex-col gap-1.5 px-5 py-4 rounded-xl text-sm"
          style={{ background: "rgba(255,190,60,0.08)", border: "1px solid rgba(255,190,60,0.22)" }}>
          <p className="flex items-center gap-2 font-bold text-xs" style={{ color: "#c98a00" }}>
            <FaExclamationTriangle size={12} />주의사항
          </p>
          {[
            "1인당 최대 5곡까지 추가할 수 있으며 최대 3곡까지 투표할 수 있습니다.",
            "등록자의 설정한 마감일까지 곡 추가와 투표를 진행할 수 있습니다.",
            "등록자의 요청에 따라 조기 마감 될 수 있으며, 참여자가 추가한 수록곡이 삭제 될 수 있습니다.",
            "마감일이 지나면 곡 추가와 투표가 불가능하며, 투표 순위가 가장 높은 상위 10곡이 최종 수록곡으로 확정됩니다.",
            "마감일까지 추가된 곡이 3곡 미만일 경우 해당 플레이리스트는 자동 삭제됩니다.",
          ].map((text, i) => (
            <p key={i} style={{ color: "#8e6a00" }}>• {text}</p>
          ))}
        </div>
      )}

      {/* 수록곡 */}
      {isPlaylistLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "#1f2430" }}>수록곡</h2>
            {!isClosed && user && (
              <button
                onClick={() => { setShowAddSongModal(true); setSearchQuery(""); setSearchResults([]); setHasSearched(false); setAddedSongIds(new Set()); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-full transition-all hover:scale-105 shrink-0"
                style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", boxShadow: "0 4px 14px rgba(109,94,252,0.28)" }}
              >
                <FaPlus size={11} />곡 추가
              </button>
            )}
          </div>

          {songs.length > 0 && (
            <div className="relative mb-3">
              <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8e97ab" }} />
              <input
                value={songFilter}
                onChange={(e) => setSongFilter(e.target.value)}
                placeholder="곡명 또는 아티스트 검색"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(88,95,138,0.15)", color: "#1f2430" }}
              />
            </div>
          )}

          {isSongsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : songs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16" style={{ color: "#8e97ab" }}>
              <FaMusic size={36} style={{ opacity: 0.3 }} />
              <p className="text-sm">아직 수록곡이 없습니다.</p>
              {!isClosed && <p className="text-xs">위의 곡 추가 버튼을 눌러 곡을 추가해보세요.</p>}
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
                <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
                  {displaySongs.map((song, index) => {
                    const rank = index + 1;
                    return (
                      <div
                        key={song.playlistSongId}
                        onClick={() => handlePlaySong(index)}
                        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all group"
                        style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(88,95,138,0.12)", boxShadow: "0 2px 8px rgba(80,90,140,0.05)" }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(109,94,252,0.10)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(80,90,140,0.05)")}
                      >
                        {/* 순위 번호 (마감 후) */}
                        {isClosed && (
                          <div className="w-7 text-center shrink-0">
                            <span className="text-sm font-bold" style={{ color: rank <= 3 ? "#6d5efc" : "#8e97ab" }}>{rank}</span>
                          </div>
                        )}

                        {/* 앨범 아트 */}
                        <div
                          className="relative shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
                          style={{ width: 80, height: 80, background: "linear-gradient(135deg, rgba(109,94,252,0.10), rgba(255,92,168,0.08))" }}
                        >
                          <FallbackCoverArt
                            src={resolveImageUrl(song.imgUrl)}
                            title={song.trackName}
                            size={80}
                            radius={12}
                            variant="collabo"
                          />
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(109,94,252,0.18)" }}>
                            <FaPlay size={13} style={{ color: "#6d5efc" }} />
                          </div>
                        </div>

                        {/* 곡 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: "#1f2430" }} title={song.trackName}>
                              {song.trackName}
                            </p>
                            {song.suggestedByEmail === user?.email && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: "rgba(109,94,252,0.10)", color: "#6d5efc", border: "1px solid rgba(109,94,252,0.20)" }}>
                                내가 추가한 곡
                              </span>
                            )}
                          </div>
                          <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: "#677086" }}>
                            {song.artistName}
                            {song.genreName && (<><GoDotFill size={7} className="shrink-0" />{song.genreName}</>)}
                          </p>
                          {song.suggestedByEmail && (
                            <p className="flex items-center gap-1 mt-1">
                              <FaUser size={11} className="shrink-0" style={{ color: "#8e97ab" }} />
                              <span className="text-xs" style={{ color: "#8e97ab" }}>참여자: </span>
                              <span className="text-xs truncate font-semibold" style={{ color: "#1f2430" }}>
                                {song.suggestedByName || song.suggestedByEmail}
                              </span>
                            </p>
                          )}
                          {(song.reason || song.suggestedByEmail === user?.email) &&
                            (editingReasonId === song.playlistSongId ? (
                              <div
                                className="mt-2 overflow-hidden rounded-xl"
                                style={{ background: "rgba(247,248,255,0.88)", border: "1.5px solid rgba(109,94,252,0.22)" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <textarea
                                  value={editingReasonText}
                                  onChange={(e) => setEditingReasonText(e.target.value)}
                                  rows={2}
                                  autoFocus
                                  className="w-full px-3 pt-3 pb-1 text-xs bg-transparent outline-none resize-none"
                                  style={{ color: "#1f2430" }}
                                  placeholder="추가 이유를 입력하세요."
                                />
                                <div className="flex items-center justify-between px-3 pb-2">
                                  <span className="text-xs" style={{ color: editingReasonText.length > 50 ? "#e03e52" : "#8e97ab" }}>
                                    {editingReasonText.length} / 50
                                  </span>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => setEditingReasonId(null)}
                                      className="px-3 py-1 text-xs rounded-lg transition-colors"
                                      style={{ color: "#677086" }}
                                    >
                                      취소
                                    </button>
                                    <button
                                      onClick={() => handleUpdateReason(song.playlistSongId)}
                                      className="px-3 py-1 text-xs font-semibold rounded-lg transition-colors"
                                      style={{ background: "rgba(109,94,252,0.10)", color: "#6d5efc" }}
                                    >
                                      저장
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p
                                className={`flex items-center gap-1 mt-1 group/reason ${!isClosed && song.suggestedByEmail === user?.email ? "cursor-pointer" : ""}`}
                                onClick={(e) => {
                                  if (!isClosed && song.suggestedByEmail === user?.email) {
                                    e.stopPropagation();
                                    setEditingReasonId(song.playlistSongId);
                                    setEditingReasonText(song.reason ?? "");
                                  }
                                }}
                              >
                                <FaComment size={11} className="shrink-0" style={{ color: "#8e97ab" }} />
                                <span className="text-xs shrink-0" style={{ color: "#8e97ab" }}>추가 이유: </span>
                                <span className="text-xs truncate" style={{ color: "#1f2430" }}>
                                  {song.reason ||
                                    (!isClosed && song.suggestedByEmail === user?.email ? (
                                      <span className="transition-colors" style={{ color: "#c5cad5" }}>작성하기...</span>
                                    ) : (
                                      <span style={{ color: "#c5cad5" }}>없음</span>
                                    ))}
                                </span>
                                {!isClosed && song.suggestedByEmail === user?.email && (
                                  <FaEdit size={10} className="shrink-0 opacity-0 group-hover/reason:opacity-100 transition-all" style={{ color: "#6d5efc" }} />
                                )}
                              </p>
                            ))}
                        </div>

                        {/* 삭제 버튼 */}
                        {!isClosed && canDelete(song) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.playlistSongId); }}
                            className="flex items-center justify-center w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            style={{ background: "rgba(255,91,110,0.10)", color: "#e03e52", border: "1px solid rgba(255,91,110,0.18)" }}
                          >
                            <FaTrash size={11} />
                          </button>
                        )}

                        {/* 투표 버튼 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVote(song); }}
                          disabled={!user || isClosed}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 disabled:cursor-not-allowed"
                          style={isClosed
                            ? { background: "rgba(88,95,138,0.07)", color: "#8e97ab", border: "1px solid rgba(88,95,138,0.12)" }
                            : song.hasVoted
                              ? { background: "rgba(109,94,252,0.12)", color: "#6d5efc", border: "1px solid rgba(109,94,252,0.25)" }
                              : { background: "rgba(88,95,138,0.07)", color: "#8e97ab", border: "1px solid rgba(88,95,138,0.12)" }}
                        >
                          <FaThumbsUp size={10} />
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
      )}

      {/* 곡 검색 모달 */}
      {showAddSongModal && (() => {
        const addSongModal = (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(40,45,80,0.20)" }}>
          <div className="w-full max-w-lg mx-4 flex flex-col gap-4 p-6 rounded-2xl max-h-[80vh]"
            style={{ background: "linear-gradient(180deg,#fff,rgba(247,248,255,0.98))", border: "1px solid rgba(200,205,230,0.6)", boxShadow: "0 32px 72px rgba(80,90,140,0.22)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: "#1f2430" }}>곡 추가</h3>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(88,95,138,0.12)", color: "#8e97ab" }}
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
                className="flex-1 px-4 py-2.5 text-sm rounded-xl outline-none transition-colors"
                style={{ background: "rgba(247,248,255,0.88)", border: "1.5px solid rgba(88,95,138,0.22)", color: "#1f2430" }}
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-xl text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", boxShadow: "0 4px 12px rgba(109,94,252,0.25)" }}
              >
                <FaSearch size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : hasSearched && searchResults.length === 0 ? (
                <p className="py-10 text-center text-sm" style={{ color: "#8e97ab" }}>검색 결과가 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {searchResults.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                      style={{ background: "rgba(247,248,255,0.7)", border: "1px solid rgba(88,95,138,0.10)" }}
                    >
                      <div
                        className="shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
                        style={{ width: 52, height: 52, background: "linear-gradient(135deg, rgba(109,94,252,0.10), rgba(255,92,168,0.08))" }}
                      >
                        <FallbackCoverArt
                          src={resolveImageUrl(song.imgUrl)}
                          title={song.trackName}
                          size={52}
                          radius={10}
                          variant="collabo"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#1f2430" }} title={song.trackName}>{song.trackName}</p>
                        <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: "#677086" }}>
                          {song.artistName}
                          {song.genreName && (<><GoDotFill size={7} className="shrink-0" />{song.genreName}</>)}
                        </p>
                      </div>
                      {song.previewUrl && (
                        <button
                          onClick={() => {
                            if (isPlayerVisible && playerSongs[0]?.id === song.id && !isPreviewPaused) {
                              setIsPreviewPaused(true);
                            } else {
                              setPlayerSongs([song]); setPlayerIndex(0); setIsPlayerVisible(true); setIsPreviewPaused(false);
                            }
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0"
                          style={isPlayerVisible && playerSongs[0]?.id === song.id && !isPreviewPaused
                            ? { background: "rgba(109,94,252,0.12)", color: "#6d5efc", border: "1px solid rgba(109,94,252,0.22)" }
                            : { background: "rgba(88,95,138,0.07)", color: "#8e97ab", border: "1px solid rgba(88,95,138,0.12)" }}
                        >
                          {isPlayerVisible && playerSongs[0]?.id === song.id && !isPreviewPaused ? <FaPause size={11} /> : <FaPlay size={11} />}
                        </button>
                      )}
                      <button
                        onClick={() => { setSuggestTarget(song); setSuggestReason(""); }}
                        disabled={!user || addedSongIds.has(song.id) || songs.some((s) => s.trackName === song.trackName && s.artistName === song.artistName)}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0 disabled:cursor-not-allowed"
                        style={addedSongIds.has(song.id) || songs.some((s) => s.trackName === song.trackName && s.artistName === song.artistName)
                          ? { background: "rgba(57,201,167,0.12)", color: "#1aaa86", border: "1px solid rgba(57,201,167,0.25)" }
                          : { background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", color: "#fff" }}
                      >
                        {addedSongIds.has(song.id) || songs.some((s) => s.trackName === song.trackName && s.artistName === song.artistName)
                          ? <FaCheck size={13} /> : <FaPlus size={13} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {!user && hasSearched && (
                <p className="mt-2 text-xs text-center" style={{ color: "#8e97ab" }}>로그인 후 곡을 추가할 수 있습니다.</p>
              )}
            </div>
          </div>
        </div>
        );
        return modalRoot ? createPortal(addSongModal, modalRoot) : addSongModal;
      })()}

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

      {/* 곡 추가 이유 모달 */}
      {suggestTarget && (() => {
        const suggestModal = (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(40,45,80,0.20)" }}>
          <div className="w-full max-w-md mx-4 flex flex-col gap-5 p-6 rounded-2xl"
            style={{ background: "linear-gradient(180deg,#fff,rgba(247,248,255,0.98))", border: "1px solid rgba(200,205,230,0.6)", boxShadow: "0 32px 72px rgba(80,90,140,0.22)" }}>
            <h3 className="text-base font-bold" style={{ color: "#1f2430" }}>곡 추가</h3>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(247,248,255,0.88)", border: "1px solid rgba(88,95,138,0.12)" }}>
              <FallbackCoverArt
                src={resolveImageUrl(suggestTarget.imgUrl)}
                title={suggestTarget.trackName}
                size={40}
                radius={8}
                variant="collabo"
                className="shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate" style={{ color: "#1f2430" }}>{suggestTarget.trackName}</span>
                <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: "#677086" }}>
                  {suggestTarget.artistName}
                  {suggestTarget.genreName && (<><GoDotFill size={7} className="shrink-0" />{suggestTarget.genreName}</>)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold" style={{ color: "#1f2430" }}>추가 이유 (선택)</label>
                <span className="text-xs" style={{ color: suggestReason.length > 50 ? "#e03e52" : "#8e97ab" }}>{suggestReason.length} / 50</span>
              </div>
              <textarea
                value={suggestReason}
                onChange={(e) => setSuggestReason(e.target.value)}
                placeholder="이 곡을 추가하는 이유를 작성해주세요."
                rows={3}
                className="text-sm rounded-xl p-3 resize-none outline-none transition-colors"
                style={{ background: "rgba(247,248,255,0.88)", border: "1.5px solid rgba(88,95,138,0.22)", color: "#1f2430" }}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSuggestTarget(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-colors"
                style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(88,95,138,0.16)", color: "#677086" }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (suggestReason.length > 50) { showToast("추가 이유는 최대 50자까지 입력할 수 있습니다.", "info"); return; }
                  handleSuggestSong(suggestTarget, suggestReason);
                  setSuggestTarget(null);
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", boxShadow: "0 6px 18px rgba(109,94,252,0.28)" }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
        );
        return modalRoot ? createPortal(suggestModal, modalRoot) : suggestModal;
      })()}

      {isPlayerVisible &&
        playerSongs.length > 0 &&
        (() => {
          const playerModal = (
            <div className="fixed bottom-0 left-0 z-[12000] w-full">
              <MusicPlayer
                song={playerSongs[playerIndex]}
                setIsPlayerVisible={() => { setIsPlayerVisible(false); setIsPreviewPaused(false); }}
                songs={playerSongs}
                songIndex={playerIndex}
                onSongChange={(index) => setPlayerIndex(index)}
                externalPaused={isPreviewPaused}
              />
            </div>
          );
          return modalRoot ? createPortal(playerModal, modalRoot) : playerModal;
        })()}
    </div>
      </div>
    </div>
    </>
  );
}

export default CollaboPlaylistDetailPage;
