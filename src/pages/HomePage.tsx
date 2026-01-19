import RankSection from "../Components/RankSection";

function HomePage() {
  return (
    <div className="home">
      {/* 위 섹션 */}
      <div className="top-section">
        <h1 className="page-title">나의 플레이리스트</h1>

        <div className="playlist-row">
          <div className="playlist-card">
            <img src="../images/playlist1.jpg" />
            <p>플레이리스트1</p>
          </div>

          <div className="playlist-card">
            <img src="../images/playlist2.jpg" />
            <p>플레이리스트2</p>
          </div>
        </div>
      </div>

      {/* 아래 섹션 */}
      <div className="bottom-section">
        <h1 className="page-title">추천 플레이리스트</h1>
        <div className="rank-sections">
          <RankSection title="🔥 인기 TOP 10" />
          <RankSection title="📈 급상승 TOP 10" />
          <RankSection title="⭐ 추천 TOP 10" />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
