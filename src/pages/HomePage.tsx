import { useRef, useState } from "react";
import { FaPlus, FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa";
import PlaylistCreateModal from "./PlaylistCreateModal";
import "../style/HomePage.css";
import RankSection from "../components/RankSection";

function HomePage() {
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
              <div className="playlist-card top-playlist-card">
                <div className="playlist-image-wrapper">
                  <img src="/images/playlist1.jpg" />
                  <button className="play-button">
                    <FaPlay />
                  </button>
                  <span className="playlist-title">플레이리스트 1</span>
                </div>
              </div>
              <div className="playlist-card top-playlist-card">
                <div className="playlist-image-wrapper">
                  <img src="/images/playlist2.jpg" />
                  <button className="play-button">
                    <FaPlay />
                  </button>
                  <span className="playlist-title">플레이리스트 2</span>
                </div>
              </div>
              <div className="playlist-card top-playlist-card">
                <div className="playlist-image-wrapper">
                  <img src="/images/playlist1.jpg" />
                  <button className="play-button">
                    <FaPlay />
                  </button>
                  <span className="playlist-title">플레이리스트 3</span>
                </div>
              </div>
              <div className="playlist-card top-playlist-card">
                <div className="playlist-image-wrapper">
                  <img src="/images/playlist2.jpg" />
                  <button className="play-button">
                    <FaPlay />
                  </button>
                  <span className="playlist-title">플레이리스트 4</span>
                </div>
              </div>
              <div className="playlist-card top-playlist-card">
                <div className="playlist-image-wrapper">
                  <img src="/images/playlist1.jpg" />
                  <button className="play-button">
                    <FaPlay />
                  </button>
                  <span className="playlist-title">플레이리스트 5</span>
                </div>
              </div>
              <div className="playlist-card top-playlist-card">
                <div className="playlist-image-wrapper">
                  <img src="/images/playlist2.jpg" />
                  <button className="play-button">
                    <FaPlay />
                  </button>
                  <span className="playlist-title">플레이리스트 6</span>
                </div>
              </div>
              =
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
      {isModalOpen && <PlaylistCreateModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default HomePage;
