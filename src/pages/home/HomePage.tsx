import { useEffect, useRef, useState } from "react";
import { FaPlus, FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa";
import RankSection from "../../Components/layout/RankSection";
import PlaylistCreateModal from "../../Components/ui/PlaylistCreateModal";
import { playlistApi } from "../../api/playlistApi";
import type { Playlist } from "../../types/playlist";
import { useNavigate } from "react-router-dom";


function HomePage() {

const [data, setData] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  
  const navigate = useNavigate();
  

  const fetchData = async () => {
     setIsLoading(true);
  setIsError(false);


  try {
    const res = await playlistApi.getAllPlaylist();
    setData(res.data || []);
  } catch (error) {
    console.error(error);
    setIsError(true);
    setData([]);
  } finally {
    setIsLoading(false);
  }
  };

  useEffect(() => {
    fetchData();
  }, []);





  const rowRef = useRef<HTMLDivElement>(null); // Slider
  const [isModalOpen, setIsModalOpen] = useState(false); // Create Modal

  const scrollLeft = () => {
    rowRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    rowRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (

    <div className="home">
      <div className="home-container">
        {/* ===== 내 플레이리스트 ===== */}
        
        <div className="top-section">
          <div className="section-header">
            <h1 className="page-title">내 플레이리스트</h1>
            <button className="add-playlist-btn" onClick={() => setIsModalOpen(true)}>
              <FaPlus />
            </button>
          </div>


          <div className="playlist-slider">
            <button className="slider-btn left" onClick={scrollLeft}>
              <FaChevronLeft />
            </button>

              <div className="playlist-row top-playlist-row" ref={rowRef}>
            {data.map((item)=> (
              <div className="playlist-card top-playlist-card"  onClick={() => {
              navigate(`/playlist/me/${item.id}`);
            }}>
                <div className="playlist-image-wrapper">
                  <img src="/images/playlist1.jpg" />
                  <button className="play-button">
                    <FaPlay />
                  </button>
                  <span className="playlist-title">{item.title}</span>
                </div>
              </div>
            ))}
            </div>

            <button className="slider-btn right" onClick={scrollRight}>
              <FaChevronRight />
            </button>
          </div> 

        </div>
        <div className="bottom-section">
          <h1 className="page-title">공동 플레이리스트</h1>
          <div className="rank-sections">
            <RankSection title="주제 1" />
            <RankSection title="주제 2" />
            <RankSection title="주제 3" />
          </div>
        </div>
      </div>

      {/* ===== 모달 ===== */}
      {isModalOpen && <PlaylistCreateModal onClose={() => setIsModalOpen(false)} onCreated={fetchData}/>}
        
    </div>
  );
}

export default HomePage;
