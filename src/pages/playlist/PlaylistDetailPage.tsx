import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Playlist } from "../../types/playlist";
import { playlistApi } from "../../api/playlistApi";
import "../../styles/PlaylistDetailPage.css";
import { FaPlay, FaPlus, FaTrash } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { useSelector } from "react-redux";
import type { Song } from "../../Components/ui/SongListItem";
import MusicPlayer from "../../Components/layout/MusicPlayer";
import AddSongsModal from "../../Components/ui/AddSongsModal";

function PlaylistDetailPage() {
  const navigate = useNavigate();
  const { playlistId } = useParams<string>();

  // 유저
  const user = useSelector((state: any) => state.auth.user);
  // 플레이리스트
  const [data, setData] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<any[]>([]);

  const [, setIsLoading] = useState<boolean>(false);
  const [, setIsError] = useState<boolean>(false);
  // 곡 추가
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 미리듣기
  const [selectSong, setSelectSong] = useState<Song | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");


  // 정렬된 곡 목록 (playlistSongId 기준 — desc: 최신순, asc: 오래된 순)
  const sortedSongs = [...songs].sort((a, b) =>
    sortOrder === "asc" ? a.playlistSongId - b.playlistSongId : b.playlistSongId - a.playlistSongId
  );

  //  ========== 메뉴 ==========
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // 수정 모드
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // 수정 모드 저장
  const handleSave = async () => {
    if (!playlistId) return;

    try {
      const formData = new FormData();

      const dto = {
        title: editTitle,
        description: editDescription,
      };

      formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));

      if (image) {
        formData.append("file", image);
      }

      await playlistApi.updatePlaylist(Number(playlistId), formData);

      alert("수정 완료");

      setIsEditMode(false);

      fetchData();
    } catch (e) {
      alert("수정 실패");
    }
  };

  // 플레이리스트 삭제
  const handleDelete = () => {
    if (!playlistId) return;

    const ok = window.confirm("정말로 삭제하시겠습니까?");
    if (!ok) return;

    playlistApi
      .deletePlaylist(Number(playlistId))
      .then(() => {
        alert("삭제되었습니다.");
        navigate("/playlist/me");
      })
      .catch((error) => {
        console.error(error);
        alert("삭제에 실패하였습니다.");
      });
  };

  // 곡 삭제
  const handleRemoveSong = async (playlistSongId: number) => {
    if (!playlistId) return;

    const ok = window.confirm("곡을 삭제하시겠습니까?");
    if (!ok) return;

    try {
      await playlistApi.removeSongFromPlaylist(Number(playlistSongId));

      alert("곡이 삭제되었습니다.");

      setSongs((prev) => prev.filter((song) => song.playlistSongId !== playlistSongId));
    } catch (e) {
      alert("삭제 실패");
    }
  };
  // 조회
  const fetchData = async () => {
    //  email 없으면 API 호출 안함
    if (!playlistId) return;

    setIsLoading(true);
    setIsError(false);

    try {
      //  playlist 조회
      const playlistRes = await playlistApi.getPlaylist(playlistId);
      console.log("playlist data:", playlistRes.data);

      if (playlistRes.data) {
        setData(playlistRes.data);

        setEditTitle(playlistRes.data.title);
        setEditDescription(playlistRes.data.description ?? "");
      }

      //  songs 조회
      const songsRes = await playlistApi.getPlaylistSongs(Number(playlistId));
      setSongs(songsRes.data || []);
    } catch (error) {
      console.error(error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [playlistId]);

  // 수정모드 켜질 시 플레이어 종료
  useEffect(() => {
    if (isEditMode) {
      setIsPlayerVisible(false);
      setSelectSong(null);
      setCurrentIndex(null);
    }
  }, [isEditMode]);
  // 플레이리스트 공유
  const handleShare = () => {
    if (!confirm("플레이리스트 공유하시겠습니까?")) return;

    navigate("/community/share/new", {
      state: {
        playlistId: Number(playlistId),
        playlistTitle: data?.title ?? "",
      },
    });
  };

  return (
    <div className="playlist-detail-page">
      {/* ================= 왼쪽 패널 ================= */}
      <aside className="playlist-left">
        <div className={`playlist-center ${isEditMode ? "editing" : ""}`}>
          <div className="playlist-cover-large">
            {preview ? (
              <img src={preview} alt="playlist cover" />
            ) : (
              <img src={`${import.meta.env.VITE_API_BASE_URL ?? ""}${data?.imageUrl}`} alt="playlist cover" />
            )}
            {isEditMode && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setImage(file);

                  if (preview) {
                    URL.revokeObjectURL(preview);
                  }

                  setPreview(URL.createObjectURL(file));
                }}
              />
            )}

            {/* ===== 액션 ===== */}
            {!isEditMode && (
              <div className="playlist-actions">
                <button
                  className="primary-play large"
                  onClick={() => {
                    if (!songs.length) return;

                    // 기존 플레이어가 있으면 첫 곡으로 변경, 없으면 플레이어 열기
                    setCurrentIndex(0);
                    setSelectSong(sortedSongs[0]);
                    setIsPlayerVisible(true);
                  }}
                >
                  <FaPlay />
                </button>

                <div className="more-wrapper">
                  <button className="more-button" onClick={() => setMenuOpen((prev) => !prev)}>
                    <BsThreeDots />
                  </button>

                  {menuOpen && (
                    <div className="playlist-menu">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setIsEditMode(true);
                        }}
                      >
                        수정
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          setMenuOpen(false);
                          handleDelete();
                        }}
                      >
                        삭제
                      </button>
                      <button onClick={handleShare}>공유하기</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== 제목 ===== */}
          {!isEditMode ? (
            <h1 className="playlist-title-large">{data?.title}</h1>
          ) : (
            <input
              className="playlist-title-edit"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
              placeholder="제목을 입력하세요"
            />
          )}
          {/* ===== 메타 정보 ===== */}
          <div className="playlist-meta-bar">
            <span className="meta-user">{user?.name}</span>
            <span className="meta-dot">•</span>
            <span className="meta-count">{songs.length}곡</span>
          </div>

          {/* ===== 설명 ===== */}
          <div className="playlist-description-box">
            {!isEditMode ? (
              <p className="playlist-description-text">
                {data?.description || "플레이리스트 설명이 없습니다."}
              </p>
            ) : (
              <textarea
                className="playlist-description-edit"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="플레이리스트에 대한 설명을 입력하세요."
              />
            )}
          </div>

          {/* ===== 저장 / 취소 ===== */}
          {isEditMode && (
            <div className="edit-actions">
              <button className="btn-save" onClick={handleSave}>
                저장
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setEditTitle(data?.title ?? "");
                  setEditDescription(data?.description ?? "");
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview(null);
                  setImage(null);

                  setIsEditMode(false);
                }}
              >
                취소
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ================= 오른쪽 트랙 리스트 ================= */}
      {/* isPlayerVisible 상태에 따라 player-active 클래스 토글 → padding-bottom 확보 */}
      <section className={`playlist-right${isPlayerVisible ? " player-active" : ""}`}>
        <div className="track-header">
          <h2>곡 목록</h2>

          <div className="track-header-actions">
            {/* 정렬 드롭다운 */}
            <select
              className="sort-select"
              value={sortOrder}
              onChange={(e) => {
                const newOrder = e.target.value as "asc" | "desc";
                setSortOrder(newOrder);

                // 재생 중인 곡이 있으면 새 정렬 기준으로 인덱스 재계산
                if (selectSong && isPlayerVisible) {
                  const newSorted = [...songs].sort((a, b) =>
                    newOrder === "asc"
                      ? a.playlistSongId - b.playlistSongId
                      : b.playlistSongId - a.playlistSongId
                  );
                  const newIndex = newSorted.findIndex((s) => s.id === selectSong.id);
                  if (newIndex !== -1) setCurrentIndex(newIndex);
                }
              }}
            >
              <option value="desc">최신순</option>
              <option value="asc">오래된 순</option>
            </select>

            {!isEditMode && (
              <button
                className="add-playlist-btn"
                onClick={() => {
                  setIsPlayerVisible(false);
                  setSelectSong(null);
                  setCurrentIndex(null);
                  setIsAddModalOpen(true);
                }}
                title="곡 추가"
              >
                <FaPlus />
              </button>
            )}
          </div>
        </div>

        <ul className="track-list">
          {sortedSongs.map((song) => (
            <li
              key={song.playlistSongId}
              className={`track-item ${!isEditMode && selectSong?.id === song.id ? "playing" : ""}`}
              onClick={() => {
                if (isEditMode) return;

                const index = sortedSongs.findIndex(
                  (s) => s.playlistSongId === song.playlistSongId
                );

                setCurrentIndex(index);
                setSelectSong(song);
                setIsPlayerVisible(true);
              }}
            >
              <img className="track-thumb" src={song.imgUrl} alt="" />

              <div className="track-info">
                <span className="track-title">{song.trackName}</span>
                <span className="track-artist">{song.artistName}</span>
              </div>

              {!isEditMode && (
                <span className="track-duration">
                  {Math.floor(song.durationMs / 60000)}:
                  {String(Math.floor((song.durationMs % 60000) / 1000)).padStart(2, "0")}
                </span>
              )}

              {isEditMode && (
                <button
                  className="track-delete"
                  title="곡 삭제"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSong(song.playlistSongId);
                  }}
                >
                  <FaTrash />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isPlayerVisible && selectSong && (
        <MusicPlayer
          song={selectSong}
          setIsPlayerVisible={() => {
            setIsPlayerVisible(false);
            setSelectSong(null);
            setCurrentIndex(null);
          }}
          songs={sortedSongs}
          songIndex={currentIndex ?? 0}
          onSongChange={(index: number) => {
            if (index < sortedSongs.length) {
              setCurrentIndex(index);
              setSelectSong(sortedSongs[index]);
            } else {
              setIsPlayerVisible(false);
              setSelectSong(null);
              setCurrentIndex(null);
            }
          }}
        />
      )}

      {isAddModalOpen && playlistId && (
        <AddSongsModal
          playlistId={Number(playlistId)}
          onClose={() => setIsAddModalOpen(false)}
          onAdded={fetchData}
          existingSongs={songs}
        />
      )}
    </div>
  );
}

export default PlaylistDetailPage;
