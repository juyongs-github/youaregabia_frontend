import { useRef, useState } from "react";
import { FaPlus, FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa";
import PlaylistCreateModal from "./PlaylistCreateModal";
import "./HomePage.css";

function HomePage() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              {Array.from({ length: 10 }).map((_, i) => (
                <div className="playlist-card top-playlist-card" key={i}>
                  <div className="playlist-image-wrapper">
                    <img src={`/images/playlist${(i % 2) + 1}.jpg`} />

                    <button className="play-button">
                      <FaPlay />
                    </button>

                    <span className="playlist-title">플레이리스트 {i + 1}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="slider-btn right" onClick={scrollRight}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* ===== 모달 ===== */}
      {isModalOpen && <PlaylistCreateModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default HomePage;
