import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import api from "../../api/axios";
import "../../styles/AddSongsModal.css";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

interface Song {
  id: number;
  trackName: string;
  artistName: string;
  imgUrl: string;
  albumName?: string;
}

interface Props {
  playlistId: number;
  onClose: () => void;
  onAdded: () => void;
  existingSongs: { id: number }[];
}

function AddSongsModal({ playlistId, onClose, onAdded, existingSongs }: Props) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Song[]>([]);

  const user = useSelector((state: RootState) => state.auth.user);

  const isAlreadyAdded = (songId: number) => existingSongs.some((s) => s.id === songId);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    const res = await api.get("/api/search", { params: { q: keyword } });
    setResults(res.data || []);
  };

  const toggleSelect = (song: Song) => {
    const exists = selected.find((s) => s.id === song.id);

    if (exists) {
      setSelected(selected.filter((s) => s.id !== song.id));
    } else {
      setSelected([...selected, song]);
    }
  };

  const removeSelected = (songId: number) => {
    setSelected(selected.filter((s) => s.id !== songId));
  };

  const handleAddSongs = async () => {
    try {
      for (const song of selected) {
        await api.post(`/playlist/${playlistId}/songs/${song.id}`, null, {
          params: { email: user?.email },
        });
      }
      onAdded();
      onClose();
    } catch (e: any) {
      console.error("곡 추가 실패:", e?.response?.data);
      alert(`곡 추가 실패: ${e?.response?.data?.message || e.message}`);
    }
  };

  return (
    <div className="add-song-overlay">
      <div className="add-song-modal">
        {/* 헤더 */}
        <div className="modal-header">
          <h2>수록곡 추가</h2>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="modal-body">
          {/* 검색바 */}
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              placeholder="곡 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            {keyword && (
              <button className="search-clear" onClick={() => setKeyword("")}>
                <FaTimes />
              </button>
            )}
          </div>

          {/* 검색 결과 */}
          {results.length > 0 && (
            <>
              <h3 className="section-title">곡 검색 결과</h3>
              <div className="song-list">
                {results.map((song) => {
                  const checked = selected.some((s) => s.id === song.id);
                  const already = isAlreadyAdded(song.id);

                  return (
                    <div
                      key={song.id}
                      className={`song-row ${already ? "already-added" : ""}`}
                      style={already ? { cursor: "default" } : undefined}
                      onClick={() => !already && toggleSelect(song)}
                    >
                      <img src={song.imgUrl} alt={song.trackName} />
                      <div className="song-info">
                        <span className="song-title">{song.trackName}</span>
                        <span className="song-meta">
                          {song.albumName ? `${song.albumName} • ` : ""}
                          {song.artistName}
                        </span>
                      </div>
                      <input type="checkbox" checked={already || checked} readOnly />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 선택 목록 */}
          {selected.length > 0 && (
            <>
              <h3 className="section-title">선택 목록</h3>
              <div className="selected-list">
                {selected.map((song) => (
                  <div key={song.id} className="song-row">
                    <img src={song.imgUrl} alt={song.trackName} />
                    <div className="song-info">
                      <span className="song-title">{song.trackName}</span>
                      <span className="song-meta">
                        {song.albumName ? `${song.albumName} • ` : ""}
                        {song.artistName}
                      </span>
                    </div>
                    <button className="remove-btn" onClick={() => removeSelected(song.id)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            취소
          </button>
          <button className="btn-add" disabled={selected.length === 0} onClick={handleAddSongs}>
            선택 곡 추가
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddSongsModal;
