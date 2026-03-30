import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaMusic, FaUserAlt } from "react-icons/fa";
import { rankingApi, type SongRankingDto, type ArtistRankingDto } from "../../api/rankingApi";

const RankingWidget = () => {
  const [tab, setTab] = useState<"song" | "artist">("song");
  const [songs, setSongs] = useState<SongRankingDto[]>([]);
  const [artists, setArtists] = useState<ArtistRankingDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([rankingApi.getTopSharedSongs(), rankingApi.getTopArtists()])
      .then(([s, a]) => {
        setSongs(s);
        setArtists(a);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ranking-widget">
      {/* 탭 전환 */}
      <div className="ranking-tab-bar">
        <button
          className={`ranking-tab-btn${tab === "song" ? " active" : ""}`}
          onClick={() => setTab("song")}
        >
          <FaMusic size={11} />
          <span>인기 곡</span>
        </button>
        <button
          className={`ranking-tab-btn${tab === "artist" ? " active" : ""}`}
          onClick={() => setTab("artist")}
        >
          <FaUserAlt size={11} />
          <span>인기 가수</span>
        </button>
      </div>

      {loading ? (
        <div className="ranking-loading">로딩 중...</div>
      ) : (
        <div className="ranking-list">
          {tab === "song" ? (
            songs.length === 0 ? (
              <div className="ranking-empty">데이터가 없습니다.</div>
            ) : (
              songs.map((item, index) => (
                <div key={item.songId} className="ranking-item">
                  <span className={`ranking-num rank-${index + 1}`}>{index + 1}</span>
                  <img src={item.imgUrl} alt={item.trackName} className="ranking-song-img" />
                  <div className="ranking-info">
                    <span className="ranking-title">{item.trackName}</span>
                    <span className="ranking-sub">{item.artistName}</span>
                  </div>
                  <span className="ranking-count">{item.shareCount}</span>
                </div>
              ))
            )
          ) : artists.length === 0 ? (
            <div className="ranking-empty">데이터가 없습니다.</div>
          ) : (
            artists.map((item, index) => (
              <div key={item.artistName} className="ranking-item">
                <span className={`ranking-num rank-${index + 1}`}>{index + 1}</span>
                <div className="ranking-artist-avatar">{item.artistName.charAt(0)}</div>
                <div className="ranking-info">
                  <span className="ranking-title">{item.artistName}</span>
                  <span className="ranking-sub">{item.shareCount}회 공유</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RankingWidget;
