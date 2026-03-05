import { useState } from "react";
import { FaChevronRight, FaClock, FaMusic, FaPlay, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface CollaboPlaylist {
  id: number;
  title: string;
  creator: string;
  description: string;
  participants: number;
  tracks: number;
  lastUpdated: string;
  thumbnail: string;
  tags: string[];
}

const collaborativePlaylists: CollaboPlaylist[] = [
  {
    id: 1,
    title: "2024 연말 파티 플레이리스트",
    creator: "뮤직러버",
    description: "연말 파티에서 들으면 좋을 신나는 댄스 음악을 함께 모아봐요!",
    participants: 24,
    tracks: 45,
    lastUpdated: "2시간 전",
    thumbnail: "#e63946",
    tags: ["댄스", "파티", "연말"],
  },
  {
    id: 2,
    title: "카페에서 듣기 좋은 재즈",
    creator: "재즈마니아",
    description: "차분하고 세련된 재즈 음악 추천해주세요",
    participants: 18,
    tracks: 32,
    lastUpdated: "5시간 전",
    thumbnail: "#f4a261",
    tags: ["재즈", "카페", "차분한"],
  },
  {
    id: 3,
    title: "운동할 때 듣는 최고의 플레이리스트",
    creator: "헬스킹",
    description: "헬스장에서 동기부여 되는 강렬한 음악 모음",
    participants: 42,
    tracks: 67,
    lastUpdated: "1일 전",
    thumbnail: "#e76f51",
    tags: ["운동", "EDM", "힙합"],
  },
  {
    id: 4,
    title: "감성 K-인디 플레이리스트",
    creator: "인디러버",
    description: "숨은 한국 인디 아티스트 발굴 프로젝트",
    participants: 31,
    tracks: 28,
    lastUpdated: "3시간 전",
    thumbnail: "#2a9d8f",
    tags: ["K-POP", "인디", "감성"],
  },
];

// 공동 플레이리스트 주제 리스트 UI
function CollaborationPlaylistTopicItem() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {collaborativePlaylists.map((playlist, index) => (
        <div
          className="transition-colors bg-gray-900 rounded-lg cursor-pointer group hover:bg-gray-800"
          onClick={() => navigate(`detail/${index + 1}`)}
        >
          <div className="flex gap-4 p-4">
            <div className="relative flex items-center justify-center flex-shrink-0 w-32 h-32 rounded-lg">
              <FaMusic size={48} className="text-white opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-lg group-hover:bg-opacity-40">
                <div className="flex items-center justify-center w-12 h-12 transition-opacity bg-white rounded-full opacity-0 group-hover:opacity-100">
                  <FaPlay size={24} fill="black" className="text-black ml-0.5" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="mb-1 text-xl font-bold transition-colors group-hover:text-red-600">
                    {playlist.title}
                  </h3>
                  <p className="mb-3 text-sm text-gray-400">{playlist.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {playlist.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-xs text-gray-300 bg-gray-800 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <FaChevronRight
                  size={20}
                  className="flex-shrink-0 mt-1 text-gray-400 transition-colors group-hover:text-white"
                />
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <FaUsers size={16} />
                  <span>{playlist.participants}명 참여 중</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <FaMusic size={16} />
                  <span>{playlist.tracks}곡</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <FaClock size={16} />
                  <span>{playlist.lastUpdated}</span>
                </div>
                <div className="flex items-center gap-2 ml-auto text-gray-400">
                  <span className="text-xs">등록자: </span>
                  <span className="font-semibold text-white">{playlist.creator}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CollaborationPlaylistTopicItem;
