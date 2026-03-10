import { FaChevronRight, FaClock, FaMusic, FaPlay, FaUsers } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import type { CollaboPlaylist } from "../../types/playlist";

interface Props {
  playlists: CollaboPlaylist[];
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

// 공동 플레이리스트 주제 리스트 UI
function CollaborationPlaylistTopicItem({ playlists }: Props) {
  const navigate = useNavigate();

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
        <div
          key={playlist.id}
          className="transition-colors bg-gray-900 rounded-lg cursor-pointer group hover:bg-gray-800"
          onClick={() => navigate(`/community/collabo/detail/${playlist.id}`)}
        >
          <div className="flex gap-4 p-4">
            {/* 썸네일 */}
            <div className="relative flex items-center justify-center flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-slate-700">
              {playlist.imageUrl ? (
                <img
                  src={`http://localhost:8080${playlist.imageUrl}`}
                  alt=""
                  className="object-cover w-full h-full"
                />
              ) : (
                <FaMusic size={36} className="text-white opacity-40" />
              )}
              <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-lg group-hover:bg-opacity-40">
                <div className="flex items-center justify-center w-12 h-12 transition-opacity bg-white rounded-full opacity-0 group-hover:opacity-100">
                  <FaPlay size={20} fill="black" className="text-black ml-0.5" />
                </div>
              </div>
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-xl font-bold truncate transition-colors group-hover:text-red-500">
                  {playlist.title}
                </h3>
                <FaChevronRight
                  size={18}
                  className="flex-shrink-0 mt-1 ml-4 text-gray-400 transition-colors group-hover:text-white"
                />
              </div>

              {playlist.description && (
                <p className="mb-3 text-sm text-gray-400 line-clamp-2">{playlist.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
                {playlist.participantCount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <FaUsers size={14} />
                    <span>{playlist.participantCount}명 참여 중</span>
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
                  <div className="flex items-center gap-1.5 ml-auto">
                    <MdEmail size={15} />
                    <span className="font-semibold text-white">{playlist.creatorEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CollaborationPlaylistTopicItem;
