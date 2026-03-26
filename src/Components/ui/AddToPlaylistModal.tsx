import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { playlistApi } from "../../api/playlistApi";
import type { Playlist } from "../../types/playlist";
import type { Song } from "./SongListItem";
import "../../styles/IdealTypeWorldCupPage.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ModalStep = "select" | "confirm";

interface Props {
  song: Song & { songId?: number };
  onClose: () => void;
  onSuccess: () => void;
}

function AddToPlaylistModal({ song, onClose, onSuccess }: Props) {
  const resolvedSongId = song.songId ?? song.id;
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [step, setStep] = useState<ModalStep>("select");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    playlistApi
      .getAllPlaylist()
      .then((res) => setPlaylists(res.data || []))
      .catch(() => setError("플레이리스트를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const handleCheck = async () => {
    if (!selectedPlaylistId) return;
    setChecking(true);
    setError(null);
    try {
      const res = await playlistApi.getPlaylistSongs(selectedPlaylistId);
      const existingIds = new Set<number>(res.data.map((s: Song) => s.id));
      if (existingIds.has(resolvedSongId)) {
        setIsDuplicate(true);
        setStep("confirm");
      } else {
        await doAdd();
      }
    } catch {
      setError("확인 중 오류가 발생했습니다.");
    } finally {
      setChecking(false);
    }
  };

  const doAdd = async () => {
    setAdding(true);
    try {
      await playlistApi.addSongToPlaylist(selectedPlaylistId!, resolvedSongId);
      onSuccess();
    } catch (e: any) {
      console.error("addSongToPlaylist error:", e);
      const msg = e?.response?.data?.message ?? e?.message ?? "추가 중 오류가 발생했습니다.";
      setError(msg);
      setAdding(false);
    }
  };

  return createPortal(
    <div className="wc-modal-backdrop" onClick={onClose}>
      <div className="wc-modal" onClick={(e) => e.stopPropagation()}>

        {step === "select" && (
          <>
            <div className="wc-modal-header">
              <div>
                <span className="wc-modal-title">플레이리스트 선택</span>
                <span className="wc-modal-subtitle">{song.trackName}</span>
              </div>
              <button className="wc-modal-close" onClick={onClose}>✕</button>
            </div>

            {loading && <p className="wc-modal-loading">불러오는 중...</p>}
            {!loading && playlists.length === 0 && (
              <p className="wc-modal-empty">플레이리스트가 없습니다.</p>
            )}

            <ul className="wc-modal-list">
              {playlists.map((pl) => (
                <li
                  key={pl.id}
                  className={`wc-modal-item${selectedPlaylistId === pl.id ? " wc-modal-item--selected" : ""}`}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                >
                  {pl.imageUrl ? (
                    <img className="wc-modal-thumb" src={`${BASE_URL}${pl.imageUrl}`} alt={pl.title} />
                  ) : (
                    <div className="wc-modal-thumb wc-modal-thumb--fallback">♪</div>
                  )}
                  <span className="wc-modal-playlist-title">{pl.title}</span>
                  {selectedPlaylistId === pl.id && <span className="wc-modal-check">✓</span>}
                </li>
              ))}
            </ul>

            {error && <p className="wc-modal-error">⚠️ {error}</p>}

            <div className="wc-modal-actions">
              <button className="wc-modal-btn-cancel" onClick={onClose}>취소</button>
              <button
                className="wc-modal-btn-add"
                onClick={handleCheck}
                disabled={!selectedPlaylistId || checking}
              >
                {checking ? "확인 중..." : "추가하기"}
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="wc-modal-header">
              <div>
                <span className="wc-modal-title">중복 곡 확인</span>
                <span className="wc-modal-subtitle">이미 플레이리스트에 있습니다</span>
              </div>
              <button className="wc-modal-close" onClick={onClose}>✕</button>
            </div>

            {isDuplicate && (
              <ul className="wc-modal-list">
                <li className="wc-modal-item wc-modal-item--duplicate">
                  <img className="wc-modal-thumb" src={song.imgUrl} alt={song.trackName} />
                  <div className="wc-modal-song-info">
                    <span className="wc-modal-playlist-title">{song.trackName}</span>
                    <span className="wc-modal-song-artist">{song.artistName}</span>
                  </div>
                  <span className="wc-modal-duplicate-badge">중복</span>
                </li>
              </ul>
            )}

            <p className="wc-modal-confirm-desc">이미 플레이리스트에 있는 곡입니다.</p>

            {error && <p className="wc-modal-error">⚠️ {error}</p>}

            <div className="wc-modal-actions">
              <button className="wc-modal-btn-cancel" onClick={() => setStep("select")}>뒤로</button>
              <button className="wc-modal-btn-cancel" onClick={onClose}>닫기</button>
            </div>
          </>
        )}

      </div>
    </div>,
    document.body
  );
}

export default AddToPlaylistModal;
