import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Playlist } from "../../types/playlist";
import { playlistApi } from "../../api/playlistApi";
import "../../styles/MyplaylistPage.css"
import { FaPlay } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";



function PlaylistDetailPage() {
  const navigate = useNavigate();
  const { playlistId } = useParams<string>();

  // 데이터 단
  const [data, setData] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // 메뉴 열기
  const [menuOpen, setMenuOpen] = useState(false);
  // 수정 모달
  const [editOpen, setEditOpen] = useState(false);

  // 삭제 함수
  const handleDelete = () => {
    if(!playlistId) return;

    const ok = window.confirm("정말로 삭제하시겠습니까?")
    if(!ok) return;

    playlistApi
    .deletePlaylist(Number(playlistId))
    .then(()=> {
      alert("삭제되었습니다.");
      navigate("/playlist/me");
    })
    .catch((error)=> {
      console.error(error);
      alert("삭제에 실패하였습니다.");
    });

  };
  
  // 데이터 가져오기
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

          <h1 className="playlist-title-large">{data!=null && data.title}</h1>
          <p className="playlist-meta">User · SongCount</p>

          {/* ▶ + ⋯ */}
          <div className="playlist-actions">
            <button className="primary-play large">
              <FaPlay />
            </button>

            <div className="more-wrapper">
              <button
                className="more-button"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <BsThreeDots />
              </button>

              {menuOpen && (
                <div className="playlist-menu">
                  <button >공유</button>
                  <button className="danger" onClick={() => {
                    setMenuOpen(false);
                    handleDelete();
                  }}>삭제</button>
                </div>
              )}
            </div>
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
                <span className="track-title">샘플 곡 {idx + 1}</span>
                <span className="track-artist">아티스트</span>
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