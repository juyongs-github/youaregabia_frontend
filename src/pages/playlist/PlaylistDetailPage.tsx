import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Playlist } from "../../types/playlist";
import { playlistApi } from "../../api/playlistApi";
import "../../styles/MyplaylistPage.css"
import { FaPlay } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";

function PlaylistDetailPage() {
  const navigate = useNavigate();
  const { playlistId } = useParams<string>();

  const [data, setData] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      playlistApi.getPlaylist(playlistId).then((res) => {
        if (res.data) {
          setData(res.data || []);
        }
      });
    } catch (error) {
      console.error(error);
      setData(null);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


return (
    <div className="playlist-detail-page">
      {/* ================= 왼쪽 패널 ================= */}
      <aside className="playlist-left">
        <div className="playlist-center">
          <div className="playlist-cover-large">
            <img src="/images/playlist1.jpg" alt="playlist cover" />
          </div>

          <h1 className="playlist-title-large">Title</h1>

          <p className="playlist-meta">
            User · SongCount 
          </p>

          {/* 재생 버튼 + dots */}
          <div className="playlist-actions">
            <button className="primary-play large">
              <FaPlay />
            </button>

            <button className="more-button inline">
              <BsThreeDots />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= 오른쪽 트랙 리스트 ================= */}
      <section className="playlist-right">
        <ul className="track-list">
          {Array.from({ length: 10 }).map((_, idx) => (
            <li key={idx} className="track-item">
              <img
                className="track-thumb"
                src="/images/playlist1.jpg"
                alt=""
              />

              <div className="track-info">
                <span className="track-title">
                  샘플 곡 제목 {idx + 1}
                </span>
                <span className="track-artist">
                  아티스트 이름
                </span>
              </div>

              <span className="track-duration">3:45</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}




export default PlaylistDetailPage;
