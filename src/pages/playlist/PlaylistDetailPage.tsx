import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Playlist } from "../../types/playlist";
import { playlistApi } from "../../api/playlistApi";
import "../../styles/MyplaylistPage.css";
import { FaPlay } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { useSelector } from "react-redux";

function PlaylistDetailPage() {
  const navigate = useNavigate();
  const { playlistId } = useParams<string>();

  // 플레이리스트
  const [data, setData] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // 유저
  const user = useSelector((state: any) => state.auth.user);

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

  // 삭제
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

  // ========== 플레이리스트 정보 조회 ==========
  const fetchData = async () => {
    //  email 없으면 API 호출 안함
    if (!playlistId || !user.email) return;

    setIsLoading(true);
    setIsError(false);

    try {
      //  playlist 조회
      const playlistRes = await playlistApi.getPlaylist(playlistId, user.email);
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
  }, [playlistId, user.email]);

  return (
    <div className="playlist-detail-page">
      {/* ================= 왼쪽 패널 ================= */}
      <aside className="playlist-left">
        <div className={`playlist-center ${isEditMode ? "editing" : ""}`}>
          <div className="playlist-cover-large">
            {preview ? (
              <img src={preview} alt="playlist cover" />
            ) : (
              <img src={`http://localhost:8080${data?.imageUrl}`} alt="playlist cover" />
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
                <button className="primary-play large">
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
              maxLength={10}
              autoFocus
              placeholder="10자 이하로 입력"
            />
          )}
          {/* ===== 메타 정보 ===== */}
          <div className="playlist-meta-bar">
            <span className="meta-user">{user?.name}</span>
            <span className="meta-dot">•</span>
            <span className="meta-count">{data?.songCount}곡</span>
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
      <section className="playlist-right">
        <ul className="track-list">
          {songs.map((song) => (
            <li key={song.id} className="track-item">
              <img className="track-thumb" src={song.imgUrl} alt="" />

              <div className="track-info">
                <span className="track-title">{song.trackName}</span>
                <span className="track-artist">{song.artistName}</span>
              </div>

              <span className="track-duration">
                {Math.floor(song.durationMs / 60000)}:
                {String(Math.floor((song.durationMs % 60000) / 1000)).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default PlaylistDetailPage;
