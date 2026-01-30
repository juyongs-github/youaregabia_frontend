import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Playlist } from '../../types/playlist';
import { playlistApi } from '../../api/playlistApi';
import { FaPlay, FaPlus } from 'react-icons/fa';
import PlaylistCreateModal from '../../Components/ui/PlaylistCreateModal';

function MyPlaylistPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false); // Create Modal

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      playlistApi.getAllPlaylist().then((res) => {
        if (res.data) {
          setData(res.data || []);
        }
      });
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

  return (
    <div>
      <h1 className="page-title py-5">내 플레이리스트</h1>

      <div className="flex flex-wrap gap-7">
        {data.map((item) => (
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
              <span className="playlist-title playlist-title-small">
                {item.title}
              </span>
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
        {/* ===== 모달 ===== */}
        {isModalOpen && (
          <PlaylistCreateModal
            onClose={() => setIsModalOpen(false)}
            onCreated={fetchData}
          />
        )}
      </div>
    </div>
  );
}

export default MyPlaylistPage;
