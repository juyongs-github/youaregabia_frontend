import { useEffect, useState, type CSSProperties } from "react";
import {
  FaClock,
  FaHeart,
  FaMusic,
  FaStopwatch,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { CollaboPlaylist } from "../../types/playlist";
import FallbackCoverArt from "./FallbackCoverArt";

interface Props {
  playlists: CollaboPlaylist[];
  onLike: (playlist: CollaboPlaylist) => void;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}달 전`;
  return `${Math.floor(diff / 31536000)}년 전`;
}

function useTimeLeft(deadlineStr?: string) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!deadlineStr) return;
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      const diff = new Date(deadlineStr).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(""); return; }
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
  }, [deadlineStr]);
  return timeLeft;
}

function PlaylistCard({ playlist, onLike }: { playlist: CollaboPlaylist; onLike: (p: CollaboPlaylist) => void }) {
  const navigate = useNavigate();
  const timeLeft = useTimeLeft(playlist.deadline);
  const isClosed = playlist.deadline ? new Date() > new Date(playlist.deadline) : false;

  const chipBaseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(88,95,138,0.14)",
    color: "#7d879d",
  };
  const participantChipStyle: CSSProperties = {
    ...chipBaseStyle,
    background: "rgba(77, 143, 255, 0.12)",
    border: "1px solid rgba(77, 143, 255, 0.22)",
    color: "#356fd1",
  };
  const songChipStyle: CSSProperties = {
    ...chipBaseStyle,
    background: "rgba(109, 94, 252, 0.12)",
    border: "1px solid rgba(109, 94, 252, 0.22)",
    color: "#5d4ff2",
  };
  const timeChipStyle: CSSProperties = {
    ...chipBaseStyle,
    background: "rgba(120, 130, 152, 0.12)",
    border: "1px solid rgba(120, 130, 152, 0.22)",
    color: "#657089",
  };

  return (
    <div
      className="cursor-pointer transition-all group"
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(88,95,138,0.12)",
        borderRadius: 18,
        boxShadow: "0 4px 16px rgba(80,90,140,0.07)",
        backdropFilter: "blur(12px)",
      }}
      onClick={() => navigate(`/community/collabo/detail/${playlist.id}`)}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(109,94,252,0.13)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(80,90,140,0.07)")}
    >
      <div className="flex items-center gap-5 p-4">
        {/* 썸네일 */}
        <div
          className="relative flex items-center justify-center flex-shrink-0 overflow-hidden rounded-xl"
          style={{
            width: 110, height: 110,
            background: "linear-gradient(135deg, rgba(109,94,252,0.12), rgba(255,92,168,0.10))",
            border: "1px solid rgba(88,95,138,0.10)",
          }}
        >
          <FallbackCoverArt
            src={playlist.imageUrl}
            title={playlist.title}
            size={110}
            radius={12}
            variant="collabo"
          />
        </div>

        {/* 정보 */}
        <div className="flex flex-col justify-center flex-1 min-w-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-bold truncate" style={{ color: "#1f2430" }}>{playlist.title}</h3>
            {isClosed ? (
              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(88,95,138,0.10)", color: "#8e97ab", border: "1px solid rgba(88,95,138,0.15)" }}>
                마감
              </span>
            ) : (
              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(57,201,167,0.12)", color: "#1aaa86", border: "1px solid rgba(57,201,167,0.25)" }}>
                진행중
              </span>
            )}
          </div>

          {playlist.description && (
            <p
              className="text-sm line-clamp-1 px-4 py-1.5 rounded-xl w-fit"
              style={{
                color: "#5f6980",
                background: "rgba(247,248,255,0.9)",
                border: "1px solid rgba(88,95,138,0.12)",
                maxWidth: "520px",
              }}
            >
              {playlist.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {playlist.participantCount !== undefined && (
              <div style={participantChipStyle}>
                <FaUsers size={10} />
                <span>{playlist.participantCount}명 참여</span>
              </div>
            )}
            <div style={songChipStyle}>
              <FaMusic size={10} />
              <span>{playlist.songCount}곡</span>
            </div>
            {playlist.createdAt && (
              <div style={timeChipStyle}>
                <FaClock size={10} />
                <span>{timeAgo(playlist.createdAt)}</span>
              </div>
            )}
            {playlist.creatorName && (
              <div
                style={{
                  ...chipBaseStyle,
                  background: "linear-gradient(135deg, rgba(109,94,252,0.14), rgba(255,92,168,0.10))",
                  border: "1px solid rgba(109,94,252,0.22)",
                  color: "#4f466b",
                }}
              >
                <FaUser size={10} />
                <span className="font-semibold" style={{ color: "#1f2430" }}>{playlist.creatorName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-0.5">
            {!isClosed && timeLeft ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(255,141,77,0.10)", color: "#e07020", border: "1px solid rgba(255,141,77,0.20)" }}>
                <FaStopwatch size={10} />
                {timeLeft}
              </div>
            ) : <div />}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={playlist.hasLiked
                ? { background: "rgba(255,91,110,0.10)", color: "#e03e52", border: "1px solid rgba(255,91,110,0.25)" }
                : { background: "rgba(88,95,138,0.07)", color: "#8e97ab", border: "1px solid rgba(88,95,138,0.15)" }}
              onClick={e => { e.stopPropagation(); onLike(playlist); }}
            >
              <FaHeart size={11} />
              <span>{playlist.likeCount ?? 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CollaborationPlaylistTopicItem({ playlists, onLike }: Props) {
  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24" style={{ color: "#8e97ab" }}>
        <FaMusic size={44} style={{ opacity: 0.3 }} />
        <p className="text-base">아직 등록된 공동 플레이리스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {playlists.map(playlist => (
        <PlaylistCard key={playlist.id} playlist={playlist} onLike={onLike} />
      ))}
    </div>
  );
}

export default CollaborationPlaylistTopicItem;
