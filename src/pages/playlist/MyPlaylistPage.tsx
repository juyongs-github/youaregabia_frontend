import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Playlist } from "../../types/playlist";
import { playlistApi } from "../../api/playlistApi";
import { FaPlay, FaPlus } from "react-icons/fa";
import PlaylistCreateModal from "../../Components/ui/PlaylistCreateModal";


function MyPlaylistPage() {
  const navigate = useNavigate();

  // 플레이리스트 정보
  const [data, setData] = useState<Playlist[]>([]);
  const [, setIsLoading] = useState<boolean>(false);
  const [, setIsError] = useState<boolean>(false);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 정렬 State
  const [sortType, setSortType] = useState("oldest");

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await playlistApi.getAllPlaylist();
      setData(res.data || []);
    } catch (error) {
      console.error(error);
      setData([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 데이터 정렬
  const sortedData = [...data].sort((a, b) => {
    if (sortType === "latest") {
      return b.id - a.id;
    }

    if (sortType === "oldest") {
      return a.id - b.id;
    }

    if (sortType === "title") {
      return a.title.localeCompare(b.title);
    }

    return 0;
  });

  return (
    <div>
      <div className="flex justify-between items-center py-3">
        <h1 className="page-title">내 플레이리스트</h1>

        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
          className="sort-select"
        >
          <option value="oldest">오래된 순</option>
          <option value="latest">최신순</option>
          <option value="title">이름순</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-7">
        {/* 정렬 */}

        {sortedData.map((item) => (
          <div
            key={item.id}
            className="playlist-card top-playlist-card top-playlist-card-small"
            onClick={() => {
              navigate(`/playlist/me/${item.id}`);
            }}
          >
            <div className="playlist-image-wrapper">
              <img src={`http://localhost:8080${item.imageUrl}`} />
              <button className="play-button">
                <FaPlay />
              </button>
              <span className="playlist-title playlist-title-small">{item.title}</span>
            </div>
          </div>
        ))}
        <div
          className="playlist-card top-playlist-card top-playlist-card-small add-playlist-card"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="add-playlist-inner">
            <FaPlus />
            <span>플레이리스트 추가</span>
          </div>
        </div>
        {/* ===== 플레이리스트 생성 모달 ===== */}
        {isModalOpen && (
          <PlaylistCreateModal onClose={() => setIsModalOpen(false)} onCreated={fetchData} />
        )}
      </div>
    </div>
  );
}

export default MyPlaylistPage;
