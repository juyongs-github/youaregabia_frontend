import { useEffect, useRef, useState } from "react";
import "../../styles/HomePage.css";
import {
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaSearch,
  FaTimes,
  FaCompass,
  FaUsers,
  FaShoppingBag,
  FaGamepad,
  FaEyeSlash,
  FaTrophy,
  FaPen,
  FaShareAlt,
  FaHandshake,
  FaComments,
  FaMusic,
  FaCompactDisc,
  FaClone,
  FaHeadphones,
  FaInfoCircle,
} from "react-icons/fa";
import { playlistApi } from "../../api/playlistApi";
import type { Playlist } from "../../types/playlist";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import type { Song } from "../../Components/ui/SongListItem";
import MusicPlayer from "../../Components/layout/MusicPlayer";
import SongDetailModal from "../../Components/ui/SongDetailModal";
import RankSection from "../../Components/layout/RankSection";
import PlaylistCreateModal from "../../Components/ui/PlaylistCreateModal";
import Header from "../../Components/layout/Header";

function HomePage() {
  const [data, setData] = useState<Playlist[]>([]);
  const baseURL: string = "http://localhost:8080";
  const [, setIsLoading] = useState<boolean>(false);
  const [, setIsError] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState<string>("");

  // 검색 드롭다운
  const [dropdownSongs, setDropdownSongs] = useState<Song[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);
  const [selectSong, setSelectSong] = useState<Song | null>(null);
  const [detailSong, setDetailSong] = useState<Song | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const res = await playlistApi.getAllPlaylist();
      setData([...(res.data || [])].reverse());
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

  // 디바운스 검색
  useEffect(() => {
    if (!searchValue.trim()) {
      setDropdownSongs([]);
      setIsDropdownOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsDropdownLoading(true);
      try {
        const res = await api.get("/search", { params: { q: searchValue } });
        const songs: Song[] = res.data || [];
        setDropdownSongs(songs);
        setIsDropdownOpen(true);
      } catch {
        setDropdownSongs([]);
      } finally {
        setIsDropdownLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // 검색창 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rowRef = useRef<HTMLDivElement>(null);
  const sharedRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const menuItems: Record<string, { icon: React.ReactNode; label: string; path: string }[]> = {
    recommend: [
      { icon: <FaEyeSlash size={20} />, label: "블라인드 추천", path: "/recommend/blind" },
      { icon: <FaTrophy size={20} />, label: "월드컵 추천", path: "/recommend/worldcup" },
      { icon: <FaPen size={20} />, label: "음악 평론", path: "/recommend/critic" },
    ],
    community: [
      { icon: <FaShareAlt size={20} />, label: "플레이리스트 공유", path: "/community/share" },
      { icon: <FaHandshake size={20} />, label: "공동 제작", path: "/community/collabo" },
      { icon: <FaComments size={20} />, label: "자유게시판", path: "/community/free" },
    ],
    game: [
      { icon: <FaMusic size={20} />, label: "노래 맞추기", path: "/game/music-quiz" },
      { icon: <FaCompactDisc size={20} />, label: "앨범 맞추기", path: "/game/album-quiz" },
      { icon: <FaClone size={20} />, label: "카드 맞추기", path: "/game/card-match" },
    ],
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const scrollLeft = () => {
    rowRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    rowRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  const scrollSharedLeft = () => {
    const w = sharedRef.current?.offsetWidth ?? 0;
    sharedRef.current?.scrollBy({ left: -w, behavior: "smooth" });
  };

  const scrollSharedRight = () => {
    const w = sharedRef.current?.offsetWidth ?? 0;
    sharedRef.current?.scrollBy({ left: w, behavior: "smooth" });
  };

  return (
    <div className={`home${selectSong ? " player-open" : ""}`}>
      <Header showSearch={false} />
      {/* ===== 중앙 영역 ===== */}
      <div className="center-area">
        <h1 className="main-title">너가 갑이야</h1>

        <div className={`search-bar relative${isDropdownOpen ? " dropdown-open" : ""}`} ref={searchRef}>
          <input
            type="text"
            placeholder="검색하고 싶은 곡 제목 또는 가수명를 입력해주세요."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => dropdownSongs.length > 0 && setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!searchValue.trim()) {
                  alert("검색어를 입력 해주세요.");
                  return;
                }
                setIsDropdownOpen(false);
                const url = `/search?q=${encodeURIComponent(searchValue)}`;
                if (location.pathname + location.search === url) {
                  navigate(url, { replace: true, state: { refresh: Date.now() } });
                } else {
                  navigate(url);
                }
              }
            }}
          />
          {searchValue ? (
            <button
              onClick={() => { setSearchValue(""); setDropdownSongs([]); setIsDropdownOpen(false); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
          ) : (
            <FaSearch
              className="absolute text-gray-400 right-6 top-1/2 -translate-y-1/2"
              size={20}
            />
          )}

          {/* 검색 드롭다운 */}
          {isDropdownOpen && (
            <div className="search-dropdown">
              {isDropdownLoading ? (
                <div className="search-dropdown-empty">검색 중...</div>
              ) : dropdownSongs.length === 0 ? (
                <div className="search-dropdown-empty">검색 결과가 없습니다.</div>
              ) : (
                <>
                  {dropdownSongs.slice(0, 1).map((song, idx) => (
                    <div key={song.id}>
                      {idx > 0 && <div className="search-dropdown-divider" />}
                      <div className="search-dropdown-item">
                        <img src={song.imgUrl} alt="" className="search-dropdown-img" />
                        <div className="search-dropdown-info">
                          <span className="search-dropdown-title">{song.trackName}</span>
                          <span className="search-dropdown-artist">{song.artistName}</span>
                        </div>
                        <div className="search-dropdown-actions">
                          <button
                            onClick={() => setSelectSong(song)}
                            title="미리듣기"
                            className={selectSong?.id === song.id ? "active" : ""}
                          >
                            <FaHeadphones size={13} />
                          </button>
                          <button
                            onClick={() => navigate("/recommend/result", {
                              state: { trackName: song.trackName, artistName: song.artistName, coverImageUrl: song.imgUrl },
                            })}
                            title="유사 곡 추천"
                          >
                            <FaMusic size={13} />
                          </button>
                          <button onClick={() => setDetailSong(song)} title="상세보기">
                            <FaInfoCircle size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    className="search-dropdown-more"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
                    }}
                  >
                    전체 검색 결과 보기 →
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== 하단 중앙 - 아이콘 ===== */}
      <div className="center-icons-wrapper" ref={popupRef}>
        {openMenu && menuItems[openMenu] && (
          <div className="icon-popup">
            {menuItems[openMenu].map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setOpenMenu(null);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
        <div className="center-icons">
          <button onClick={() => setOpenMenu(openMenu === "recommend" ? null : "recommend")}>
            <FaCompass size={28} />
            <span>추천</span>
          </button>
          <button onClick={() => navigate("/goods")}>
            <FaShoppingBag size={28} />
            <span>굿즈샵</span>
          </button>
          <button onClick={() => setOpenMenu(openMenu === "community" ? null : "community")}>
            <FaUsers size={28} />
            <span>커뮤니티</span>
          </button>
          <button onClick={() => setOpenMenu(openMenu === "game" ? null : "game")}>
            <FaGamepad size={28} />
            <span>게임</span>
          </button>
        </div>
      </div>

      {/* ===== 좌하단 - 내 플레이리스트 ===== */}
      <div className="bottom-left">
        <div className="section-header">
          <h2 onClick={() => navigate("/playlist/me")} style={{ cursor: "pointer" }}>
            내 플레이리스트
          </h2>
          <button onClick={() => setIsModalOpen(true)}>
            <FaPlus />
          </button>
        </div>

        <div className="playlist-slider">
          <button className="slider-btn left" onClick={scrollLeft}>
            <FaChevronLeft />
          </button>

          <div className="playlist-row" ref={rowRef}>
            {data.map((item) => (
              <div
                className="playlist-card"
                key={item.id}
                onClick={() => navigate(`/playlist/me/${item.id}`)}
              >
                <img src={`${baseURL}${item.imageUrl}`} />
                <button className="play-button">
                  <FaPlay />
                </button>
                <span>{item.title}</span>
              </div>
            ))}
          </div>

          <button className="slider-btn right" onClick={scrollRight}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* ===== 우측 - 공동 플레이리스트 (가로 스크롤) ===== */}
      <div className="right-area">
        <h2>공동 플레이리스트</h2>

        <div className="shared-wrapper">
          <button className="nav left" onClick={scrollSharedLeft}>
            <FaChevronLeft />
          </button>

          <div className="shared-container" ref={sharedRef}>
            <RankSection title="주제 1" />
            <RankSection title="주제 2" />
            <RankSection title="주제 3" />
          </div>

          <button className="nav right" onClick={scrollSharedRight}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* ===== 모달 ===== */}
      {isModalOpen && (
        <PlaylistCreateModal onClose={() => setIsModalOpen(false)} onCreated={fetchData} />
      )}

      {/* ===== 미리듣기 플레이어 ===== */}
      {selectSong && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer song={selectSong} setIsPlayerVisible={() => setSelectSong(null)} onSongEnd={() => setSelectSong(null)} />
        </div>
      )}

      {/* ===== 상세보기 모달 ===== */}
      {detailSong && (
        <SongDetailModal song={detailSong} onClose={() => setDetailSong(null)} />
      )}
    </div>
  );
}

export default HomePage;
