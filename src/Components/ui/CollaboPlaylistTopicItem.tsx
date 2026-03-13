import { useEffect, useState } from "react";
import { FaChevronRight, FaClock, FaHeart, FaMusic, FaStopwatch, FaUser, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { CollaboPlaylist } from "../../types/playlist";

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

function statusCheck(deadlineStr?: string): string | null {
  if (!deadlineStr) return null;
  const deadline = new Date(deadlineStr).getTime();
  const now = Date.now();
  return now > deadline ? "마감" : "참여 진행중";
}

function useTimeLeft(deadlineStr?: string) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!deadlineStr) { setTimeLeft(""); return; }
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

  return (
    <div
      className="transition-colors bg-gray-900 rounded-lg cursor-pointer group hover:bg-gray-800"
      onClick={() => navigate(`/community/collabo/detail/${playlist.id}`)}
    >
      <div className="flex gap-6 p-5">
        {/* 썸네일 */}
        <div className="relative flex items-center justify-center flex-shrink-0 w-36 h-36 rounded-lg overflow-hidden bg-slate-700">
          {playlist.imageUrl ? (
            <img
              src={`http://localhost:8080${playlist.imageUrl}`}
              alt=""
              className="object-cover w-full h-full"
            />
          ) : (
            <FaMusic size={36} className="text-white opacity-40" />
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3 min-w-0">
              <h3 className="text-xl font-bold truncate">{playlist.title}</h3>
              {(() => {
                const d = statusCheck(playlist.deadline);
                if (!d) return null;
                const closed = d === "마감";
                return (
                  <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-semibold border ${
                    closed
                      ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      : "bg-green-500/20 text-green-300 border-green-500/30"
                  }`}>
                    {d}
                  </span>
                );
              })()}
            </div>
            <FaChevronRight size={14} className="flex-shrink-0 mt-0.5 ml-4 text-gray-400" />
          </div>

          {playlist.description && (
            <p className="mb-2 text-base text-gray-400 line-clamp-1 w-4/5">{playlist.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-base text-gray-400">
            {playlist.participantCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <FaUsers size={14} />
                <span>{playlist.participantCount}명 참여</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FaMusic size={14} />
              <span>{playlist.songCount}곡</span>
            </div>
            {playlist.createdAt && (
              <div className="flex items-center gap-1.5">
                <FaClock size={14} />
                <span>{timeAgo(playlist.createdAt)}</span>
              </div>
            )}
            {playlist.creatorEmail && (
              <div className="flex items-center gap-1.5">
                <FaUser size={14} />
                <span className="font-semibold text-white">{playlist.creatorEmail}</span>
              </div>
            )}
            <button
              className={`flex items-center gap-1.5 ml-auto px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                playlist.hasLiked
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
              onClick={(e) => { e.stopPropagation(); onLike(playlist); }}
            >
              <FaHeart size={13} />
              <span>{playlist.likeCount ?? 0}</span>
            </button>
          </div>
          {/* 마감 남은 시간 */}
          {!isClosed && timeLeft && (
            <div className="flex items-center gap-1.5 mt-1">
              <FaStopwatch size={13} />
              <span className="text-base font-semibold text-orange-400">{timeLeft}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 공동 플레이리스트 주제 리스트 UI
function CollaborationPlaylistTopicItem({ playlists, onLike }: Props) {
  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-400">
        <FaMusic size={48} className="opacity-40" />
        <p className="text-lg">아직 등록된 공동 플레이리스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} onLike={onLike} />
      ))}
    </div>
  );
}

export default CollaborationPlaylistTopicItem;
