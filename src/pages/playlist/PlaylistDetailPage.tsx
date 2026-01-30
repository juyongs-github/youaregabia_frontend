import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Playlist } from '../../types/playlist';
import { playlistApi } from '../../api/playlistApi';
import '../../styles/MyplaylistPage.css';
import { FaPlay } from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';

function PlaylistDetailPage() {
  const navigate = useNavigate();
  const { playlistId } = useParams<string>();

  // 데이터
  const [data, setData] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  //  ========== 메뉴 ==========
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // 수정 모드
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // 수정 모드 저장
  const handleSave = async () => {
    if (!playlistId) return;

    try {
      await playlistApi.updatePlaylist(Number(playlistId), {
        title: editTitle,
        description: editDescription,
      });
      alert('수정 완료');
      setIsEditMode(false);
      fetchData();
    } catch (e) {
      alert('수정 실패');
    }
  };

  // 삭제
  const handleDelete = () => {
    if (!playlistId) return;

    const ok = window.confirm('정말로 삭제하시겠습니까?');
    if (!ok) return;

    playlistApi
      .deletePlaylist(Number(playlistId))
      .then(() => {
        alert('삭제되었습니다.');
        navigate('/playlist/me');
      })
      .catch((error) => {
        console.error(error);
        alert('삭제에 실패하였습니다.');
      });
  };

  // ========== 데이터 조회 ==========
  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      playlistApi.getPlaylist(playlistId).then((res) => {
        if (res.data) {
          setData(res.data || []);
          setEditTitle(res.data.title);
          setEditDescription(res.data.description ?? '');
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
        <div className={`playlist-center ${isEditMode ? 'editing' : ''}`}>
          <div className="playlist-cover-large">
            <img
              src={`http://localhost:8080${data?.imageUrl}`}
              alt="playlist cover"
            />

            {/* ===== 액션 ===== */}
            {!isEditMode && (
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
            <span className="meta-user">User</span>
            <span className="meta-dot">•</span>
            <span className="meta-count">SongCount</span>
          </div>

          {/* ===== 설명 ===== */}
          <div className="playlist-description-box">
            {!isEditMode ? (
              <p className="playlist-description-text">
                {data?.description || '플레이리스트 설명이 없습니다.'}
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
                  setEditTitle(data?.title ?? '');
                  setEditDescription(data?.description ?? '');
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
          {Array.from({ length: 10 }).map((_, idx) => (
            <li key={idx} className="track-item">
              <img className="track-thumb" src="/images/playlist1.jpg" alt="" />

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
