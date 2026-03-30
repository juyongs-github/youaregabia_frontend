import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Playlist } from "../../types/playlist";
import { playlistApi } from "../../api/playlistApi";
import { FaPlay, FaPlus } from "react-icons/fa";
import PlaylistCreateModal from "../../Components/ui/PlaylistCreateModal";
import "../../styles/playlist-kfandom.css";

function MyPlaylistPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Playlist[]>([]);
  const [, setIsLoading] = useState<boolean>(false);
  const [, setIsError] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const sortedData = [...data].sort((a, b) => {
    if (sortType === "latest") return b.id - a.id;
    if (sortType === "oldest") return a.id - b.id;
    if (sortType === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="kf-pl-page">
      <div className="kf-pl-header">
        <h1 className="kf-pl-title">내 플레이리스트</h1>
        <select
          className="kf-pl-sort"
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
        >
          <option value="oldest">오래된 순</option>
          <option value="latest">최신순</option>
          <option value="title">이름순</option>
        </select>
      </div>

      <div className="kf-pl-grid">
        {sortedData.map((item) => (
          <div
            key={item.id}
            className="kf-pl-card"
            onClick={() => navigate(`/playlist/me/${item.id}`)}
          >
            <div className="kf-pl-card__img-wrap">
              <img src={`${import.meta.env.VITE_API_BASE_URL ?? ""}${item.imageUrl}`} alt={item.title} />
              <button className="kf-pl-card__play" onClick={(e) => e.stopPropagation()}>
                <FaPlay size={16} />
              </button>
              <span className="kf-pl-card__name">{item.title}</span>
            </div>
          </div>
        ))}

        <div className="kf-pl-add" onClick={() => setIsModalOpen(true)}>
          <FaPlus size={22} />
          <span>플레이리스트 추가</span>
        </div>
      </div>

      {isModalOpen && (
        <PlaylistCreateModal onClose={() => setIsModalOpen(false)} onCreated={fetchData} />
      )}
    </div>
  );
}

export default MyPlaylistPage;
