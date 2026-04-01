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
  FaHeart,
  FaSyncAlt,
} from "react-icons/fa";
import { playlistApi } from "../../api/playlistApi";
import { playlistSongApi } from "../../api/playlistSongApi";
import type { Playlist, CollaboPlaylist } from "../../types/playlist";

import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import type { Song } from "../../components/ui/SongListItem";
import SongDetailModal from "../../components/ui/SongDetailModal";
import { usePlayer } from "../../contexts/PlayerContext";
import RankSection from "../../components/layout/RankSection";
import PlaylistCreateModal from "../../components/ui/PlaylistCreateModal";
import Header from "../../components/layout/Header";

function HomePage() {
  const [data, setData] = useState<Playlist[]>([]);
  const baseURL: string = import.meta.env.VITE_API_BASE_URL ?? "";
  const [collaboPlaylists, setCollaboPlaylists] = useState<CollaboPlaylist[]>([]);
  const [, setIsLoading] = useState<boolean>(false);
  const [, setIsError] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState<string>("");

  // 검색 드롭다운
  const [dropdownSongs, setDropdownSongs] = useState<Song[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);
  const { play, stop, song: selectSong } = usePlayer();
  const setSelectSong = (song: Song | null) => song ? play(song, { onClose: stop, onSongEnd: stop }) : stop();
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

  // 오늘의 추천 음악
  const [dailySongs, setDailySongs] = useState<Song[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const fetchDailySongs = async () => {
    setDailyLoading(true);
    try {
      const res = await api.get<Song[]>("/api/randoms", { params: { limit: 1 } });
      setDailySongs(res.data || []);
    } catch {
      setDailySongs([]);
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDailySongs();
    playlistApi
      .getAllCollaborativePlaylist()
      .then((res) => setCollaboPlaylists(res.data || []))
      .catch(() => setCollaboPlaylists([]));
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
        const res = await api.get("/api/search", { params: { q: searchValue } });
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
  const popupRef = useRef<HTMLDivElement>(null);

  const [currentSharedIndex, setCurrentSharedIndex] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);

  useEffect(() => {
    if (collaboPlaylists.length <= 1 || selectSong || isRankModalOpen) return;
    const timer = setInterval(() => {
      setCurrentSharedIndex((prev) => (prev >= collaboPlaylists.length - 1 ? 0 : prev + 1));
    }, 10000);
    return () => clearInterval(timer);
  }, [collaboPlaylists.length, selectSong, isRankModalOpen, timerKey]);

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
    setCurrentSharedIndex((prev) => (prev <= 0 ? collaboPlaylists.length - 1 : prev - 1));
    setTimerKey((k) => k + 1);
  };

  const scrollSharedRight = () => {
    setCurrentSharedIndex((prev) => (prev >= collaboPlaylists.length - 1 ? 0 : prev + 1));
    setTimerKey((k) => k + 1);
  };

  const handlePlayAll = async () => {
    const playlist = collaboPlaylists[currentSharedIndex];
    if (!playlist) return;
    try {
      const res = await playlistSongApi.getCollaborativeSongs(playlist.id);
      const sorted = [...(res.data || [])].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0));
      if (sorted.length === 0) return;
      play(sorted[0], { songs: sorted, songIndex: 0, onClose: stop, onSongEnd: stop });
    } catch {
      // 곡 로딩 실패 시 무시
    }
  };

  const handleLike = async () => {
    const playlist = collaboPlaylists[currentSharedIndex];
    if (!playlist) return;
    const liked = playlist.hasLiked;
    // 낙관적 업데이트
    setCollaboPlaylists((prev) =>
      prev.map((p, i) =>
        i === currentSharedIndex
          ? { ...p, hasLiked: !liked, likeCount: (p.likeCount ?? 0) + (liked ? -1 : 1) }
          : p
      )
    );
    try {
      if (liked) {
        await playlistApi.unlikeCollabo(playlist.id);
      } else {
        await playlistApi.likeCollabo(playlist.id);
      }
    } catch {
      // 실패 시 롤백
      setCollaboPlaylists((prev) =>
        prev.map((p, i) =>
          i === currentSharedIndex
            ? { ...p, hasLiked: liked, likeCount: (p.likeCount ?? 0) + (liked ? 1 : -1) }
            : p
        )
      );
    }
  };

  return (
    <div className={`home${selectSong ? " player-open" : ""}`}>
      <Header showSearch={false} />
      {/* ===== 중앙 영역 ===== */}
      <div className="center-area">
        <h1 className="main-title">메인 홈페이지에 띄워줄 문구</h1>

        <div
          className={`search-bar relative${isDropdownOpen ? " dropdown-open" : ""}`}
          ref={searchRef}
        >
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
              onClick={() => {
                setSearchValue("");
                setDropdownSongs([]);
                setIsDropdownOpen(false);
              }}
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
                            onClick={() => {
                              setSelectSong(song);
                            }}
                            title="미리듣기"
                            className={selectSong?.id === song.id ? "active" : ""}
                          >
                            <FaHeadphones size={13} />
                          </button>
                          <button
                            onClick={() =>
                              navigate("/recommend/result", {
                                state: {
                                  trackName: song.trackName,
                                  artistName: song.artistName,
                                  coverImageUrl: song.imgUrl,
                                  previewUrl: song.previewUrl,
                                },
                              })
                            }
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

      {/* ===== 하단 중앙 - 오늘의 추천음악 ===== */}
      {dailySongs.length > 0 &&
        (() => {
          const song = dailySongs[0];
          return (
            <div className="daily-recommend">
              <div className="daily-recommend-header">
                <span>오늘의 추천음악</span>
                <button onClick={fetchDailySongs} disabled={dailyLoading} title="새로고침">
                  <FaSyncAlt
                    size={11}
                    style={{ animation: dailyLoading ? "spin 0.8s linear infinite" : "none" }}
                  />
                </button>
              </div>
              <div className="daily-card">
                <img src={song.imgUrl} alt={song.trackName} className="daily-card-cover" />
                <div className="daily-card-info">
                  <span className="daily-card-title">{song.trackName}</span>
                  <span className="daily-card-artist">{song.artistName}</span>
                  <div className="daily-card-actions">
                    <button
                      onClick={() => {
                        setSelectSong(song);
                      }}
                      className={selectSong?.id === song.id ? "active" : ""}
                      title="미리듣기"
                    >
                      <FaHeadphones size={13} />
                      <span>미리듣기</span>
                    </button>
                    <button
                      onClick={() =>
                        navigate("/recommend/result", {
                          state: {
                            trackName: song.trackName,
                            artistName: song.artistName,
                            coverImageUrl: song.imgUrl,
                            previewUrl: song.previewUrl,
                          },
                        })
                      }
                      title="유사 곡 추천"
                    >
                      <FaMusic size={13} />
                      <span>유사 추천</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
          <button
            className={openMenu === "recommend" ? "active" : ""}
            onClick={() => setOpenMenu(openMenu === "recommend" ? null : "recommend")}
          >
            <FaCompass size={28} />
            <span>추천</span>
          </button>
          <button onClick={() => navigate("/goods")}>
            <FaShoppingBag size={28} />
            <span>굿즈샵</span>
          </button>
          <button
            className={openMenu === "community" ? "active" : ""}
            onClick={() => setOpenMenu(openMenu === "community" ? null : "community")}
          >
            <FaUsers size={28} />
            <span>커뮤니티</span>
          </button>
          <button
            className={openMenu === "game" ? "active" : ""}
            onClick={() => setOpenMenu(openMenu === "game" ? null : "game")}
          >
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
            {data.length === 0 ? (
              <div className="playlist-empty">플레이리스트가 없습니다.</div>
            ) : (
              data.map((item) => (
                <div
                  className="playlist-card"
                  key={item.id}
                  onClick={() => navigate(`/playlist/me/${item.id}`)}
                >
                  <div className="playlist-card-img-wrap">
                    <img src={`${baseURL}${item.imageUrl}`} alt={item.title} />
                    <button className="play-button">
                      <FaPlay />
                    </button>
                    <span className="playlist-card-title">{item.title}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="slider-btn right" onClick={scrollRight}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* ===== 우측 - 공동 플레이리스트 ===== */}
      <div className="right-area">
        {/* 상단 제목 */}
        <div className="section-header">
          <h2
            onClick={() =>
              collaboPlaylists[currentSharedIndex] &&
              navigate(`/community/collabo/detail/${collaboPlaylists[currentSharedIndex].id}`)
            }
            style={{ cursor: collaboPlaylists.length > 0 ? "pointer" : "default" }}
          >
            {collaboPlaylists[currentSharedIndex]?.title ?? "공동 플레이리스트"}
          </h2>
          <div className="shared-nav-row">
            <button className="shared-nav-btn" onClick={scrollSharedLeft}>
              <FaChevronLeft />
            </button>
            <button className="shared-nav-btn" onClick={scrollSharedRight}>
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* 하단 본문: 왼쪽 이미지 + 오른쪽 곡 리스트 */}
        <div className="shared-body">
          {/* 왼쪽: 화살표+재생 버튼 위에, 이미지 세로 중앙 */}
          <div className="shared-cover-left">
            <div className="shared-cover-group">
              <div
                key={currentSharedIndex}
                className="shared-cover-wrap shared-animate"
                onClick={handlePlayAll}
              >
                <img
                  className="shared-cover-large"
                  src={
                    collaboPlaylists[currentSharedIndex]?.imageUrl
                      ? `${baseURL}${collaboPlaylists[currentSharedIndex].imageUrl}`
                      : ""
                  }
                  alt={collaboPlaylists[currentSharedIndex]?.title ?? ""}
                />
                <button className="shared-cover-play" tabIndex={-1}>
                  <FaPlay />
                </button>
              </div>
              <div className="shared-like-row">
                <button className="shared-like-btn" onClick={handleLike}>
                  <FaHeart
                    className={`shared-like-heart${collaboPlaylists[currentSharedIndex]?.hasLiked ? " liked" : ""}`}
                  />
                </button>
                <span className="shared-like-count">
                  {collaboPlaylists[currentSharedIndex]?.likeCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* 오른쪽: 곡 리스트 */}
          <div className="shared-right-panel">
            <div className="shared-wrapper">
              <div key={currentSharedIndex} className="shared-container shared-animate">
                {collaboPlaylists[currentSharedIndex] && (
                  <RankSection
                    playlist={collaboPlaylists[currentSharedIndex]}
                    onSongClick={(song) => {
                      setSelectSong(song);
                    }}
                    onModalOpenChange={setIsRankModalOpen}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 모달 ===== */}
      {isModalOpen && (
        <PlaylistCreateModal onClose={() => setIsModalOpen(false)} onCreated={fetchData} />
      )}


      {/* ===== 상세보기 모달 ===== */}
      {detailSong && <SongDetailModal song={detailSong} onClose={() => setDetailSong(null)} />}
    </div>
  );
}

export default HomePage;
