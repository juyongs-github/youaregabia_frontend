import { useState } from "react";
import { usePlayer } from "../../contexts/PlayerContext";
import { playlistApi } from "../../api/playlistApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import type { BoardSong } from "../../types/board";
import type { Song } from "./SongListItem";
import PlaylistCreateModal from "./PlaylistCreateModal";
import Toast from "./Toast";
import { useToast } from "../../hooks/useToast";
import ConfirmToast from "./ConfirmToast";
import { useConfirmToast } from "../../hooks/useConfirmToast";

type Props = {
  songs: BoardSong[];
  isMyBoard: boolean;
  onSongClick?: (song: BoardSong) => void;
};

function BoardSongList({ songs, isMyBoard }: Props) {
  const { toast, showToast, closeToast } = useToast();
  const { confirmToast, confirm, closeConfirm } = useConfirmToast();
  const { play, song: currentSong } = usePlayer();
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  const [isShareMode, setIsShareMode] = useState(false);
  const [playlists, setPlaylists] = useState<{ id: number; title: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [addedSongIds, setAddedSongIds] = useState<Set<number>>(new Set());
  const [playlistSongIds, setPlaylistSongIds] = useState<Set<number>>(new Set());
  const [selectedSongIds, setSelectedSongIds] = useState<Set<number>>(
    new Set(songs.map((s) => s.songId))
  );
  const [checking, setChecking] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const toSong = (s: BoardSong): Song => ({
    id: s.songId,
    trackName: s.trackName,
    artistName: s.artistName,
    imgUrl: s.imgUrl,
    previewUrl: s.previewUrl,
    genreName: s.genreName,
    durationMs: s.durationMs,
    releaseDate: s.releaseDate,
  });

  const handleSongClick = (boardSong: BoardSong) => {
    if (isShareMode) {
      const isAlreadyAdded = addedSongIds.has(boardSong.songId);
      const isInPlaylist = playlistSongIds.has(boardSong.songId);
      if (!isAlreadyAdded && !isInPlaylist) {
        setSelectedSongIds((prev) => {
          const next = new Set(prev);
          if (next.has(boardSong.songId)) next.delete(boardSong.songId);
          else next.add(boardSong.songId);
          return next;
        });
      }
    } else {
      play(toSong(boardSong), {
        songs: songs
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(toSong),
        songIndex: songs
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .findIndex((s) => s.songId === boardSong.songId),
      });
    }
  };

  const fetchPlaylists = async () => {
    if (!userEmail || playlists.length > 0) return;
    const res = await playlistApi.getAllPlaylist();
    setPlaylists(res.data);
  };

  const handlePlaylistSelect = (id: number | null) => {
    setSelectedPlaylistId(id);
    if (!id) {
      setPlaylistSongIds(new Set());
      setAddedSongIds(new Set());
      return;
    }
    playlistApi.getPlaylistSongs(id).then((res) => {
      const inPlaylist = new Set<number>(res.data.map((s: any) => s.id));
      setPlaylistSongIds(inPlaylist);
      setAddedSongIds(new Set());
      setSelectedSongIds(new Set(songs.map((s) => s.songId).filter((id) => !inPlaylist.has(id))));
    });
  };

  const handleAddSelectedSongs = async () => {
    if (!selectedPlaylistId) {
      showToast("추가할 플레이리스트를 선택해주세요.", "info");
      return;
    }
    if (selectedSongIds.size === 0) {
      showToast("선택된 곡이 없습니다.", "info");
      return;
    }
    try {
      setChecking(true);
      const res = await playlistApi.getPlaylistSongs(selectedPlaylistId);
      const existingSongIds = new Set<number>(res.data.map((s: any) => s.id));
      const selectedArray = Array.from(selectedSongIds);
      const songsToAdd = selectedArray.filter((id) => !existingSongIds.has(id));
      const duplicateCount = selectedArray.length - songsToAdd.length;

      if (songsToAdd.length === 0) {
        showToast("선택하신 곡이 이미 플레이리스트에 모두 존재합니다.", "info");
        return;
      }

      const confirmMsg =
        duplicateCount > 0
          ? `중복된 ${duplicateCount}곡을 제외하고 ${songsToAdd.length}곡을 추가하시겠습니까?`
          : `${songsToAdd.length}곡을 플레이리스트에 추가하시겠습니까?`;

      const confirmed = await confirm(confirmMsg);
      if (!confirmed) return;
      await Promise.all(
        songsToAdd.map((songId) => playlistApi.addSongToPlaylist(selectedPlaylistId, songId))
      );
      showToast("성공적으로 추가되었습니다.", "success");
      setAddedSongIds((prev) => new Set([...prev, ...songsToAdd]));
      setPlaylistSongIds((prev) => new Set([...prev, ...songsToAdd]));
      setSelectedSongIds(new Set());
    } catch {
      showToast("곡을 추가하는 중 오류가 발생했습니다.", "error");
    } finally {
      setChecking(false);
    }
  };

  const sorted = songs.slice().sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <ConfirmToast state={confirmToast} onClose={closeConfirm} />
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: "1px solid var(--kf-border)",
          boxShadow: "var(--kf-shadow-md)",
          background: "rgba(255,255,255,0.84)",
        }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            borderBottom: "1px solid var(--kf-border)",
            background: "rgba(255,255,255,0.92)",
          }}
        >
          <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--kf-brand)" }}>
            <span>🎵</span> 수록곡 ({songs.length})
          </h2>
          {!isMyBoard && !isShareMode && (
            <button
              onClick={() => setIsShareMode(true)}
              className="text-xs px-3 py-1 rounded-full font-bold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
                boxShadow: "0 4px 12px rgba(109,94,252,0.24)",
              }}
            >
              담기
            </button>
          )}
          {isShareMode && (
            <button
              onClick={() => setIsShareMode(false)}
              className="text-xs font-semibold"
              style={{ color: "var(--kf-text-muted)" }}
            >
              취소
            </button>
          )}
        </div>

        {isShareMode && (
          <div
            className="px-4 py-3 flex items-center gap-3 flex-wrap"
            style={{
              borderBottom: "1px solid var(--kf-border)",
              background: "rgba(109,94,252,0.04)",
            }}
          >
            <div style={{ flex: 1, minWidth: "160px" }}>
              <select
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid var(--kf-border)",
                  background: "rgba(255,255,255,0.84)",
                  color: "var(--kf-text-main)",
                  padding: "8px 12px",
                  fontSize: "13px",
                  outline: "none",
                }}
                value={selectedPlaylistId ?? ""}
                onChange={(e) => handlePlaylistSelect(Number(e.target.value) || null)}
                onFocus={fetchPlaylists}
              >
                <option value="">추가할 리스트 선택...</option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-semibold whitespace-nowrap"
              style={{ color: "var(--kf-brand)" }}
            >
              + 새 리스트
            </button>
            {selectedPlaylistId && selectedSongIds.size > 0 && (
              <button
                onClick={handleAddSelectedSongs}
                disabled={checking}
                className="px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
                  opacity: checking ? 0.5 : 1,
                  border: "none",
                }}
              >
                {checking ? "확인 중..." : `${selectedSongIds.size}곡 추가`}
              </button>
            )}
          </div>
        )}

        <ul
          className="divide-y overflow-y-auto"
          style={{ maxHeight: "60vh", borderColor: "var(--kf-border)" }}
        >
          {sorted.map((song) => {
            const isAlreadyAdded = addedSongIds.has(song.songId);
            const isInPlaylist = playlistSongIds.has(song.songId);
            const isDisabled = isAlreadyAdded || isInPlaylist;
            const isSelected = selectedSongIds.has(song.songId);
            const isPlaying = currentSong?.id === song.songId;

            return (
              <li
                key={song.songId}
                className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-black/5 cursor-pointer"
                style={{
                  opacity: isShareMode && isDisabled ? 0.45 : 1,
                  background: isPlaying
                    ? "rgba(109,94,252,0.12)"
                    : isSelected && isShareMode && !isDisabled
                      ? "rgba(109,94,252,0.06)"
                      : "transparent",
                  borderBottom: "1px solid var(--kf-border)",
                  borderLeft: isPlaying ? "4px solid var(--kf-brand)" : "4px solid transparent",
                }}
                onClick={() => handleSongClick(song)}
              >
                {isShareMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    readOnly
                    style={{
                      width: "16px",
                      height: "16px",
                      flexShrink: 0,
                      accentColor: "var(--kf-brand)",
                      minWidth: "16px",
                      maxWidth: "16px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <img
                  src={song.imgUrl}
                  style={{
                    width: "36px",
                    height: "36px",
                    minWidth: "36px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    boxShadow: "var(--kf-shadow-sm)",
                    display: "block",
                  }}
                  alt="cover"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isPlaying ? "var(--kf-brand)" : "var(--kf-text-main)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      margin: 0,
                    }}
                  >
                    {song.trackName}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--kf-text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      margin: 0,
                    }}
                  >
                    {song.artistName}
                  </p>
                </div>
                {isAlreadyAdded && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      flexShrink: 0,
                      color: "#178f74",
                      background: "rgba(56,199,170,0.12)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✓
                  </span>
                )}
                {!isAlreadyAdded && isInPlaylist && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      flexShrink: 0,
                      color: "var(--kf-warning)",
                      background: "rgba(255,182,72,0.12)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    있음
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {isCreateModalOpen && (
        <PlaylistCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={async () => {
            if (!userEmail) return;
            const res = await playlistApi.getAllPlaylist();
            setPlaylists(res.data);
          }}
        />
      )}
    </>
  );
}

export default BoardSongList;
