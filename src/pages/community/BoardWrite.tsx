import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import { playlistApi } from "../../api/playlistApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { refreshPoint } from "../../Components/ui/refreshPoint";
import "../../styles/board-write-kfandom.css";

interface PlaylistSong {
  id: number;
  trackName: string;
  artistName: string;
  imgUrl: string;
}

interface SelectedPlaylist {
  id: number;
  title: string;
  songs: PlaylistSong[];
}

const BoardWrite = () => {
  const location = useLocation();
  const state = location.state as { playlistId?: number; playlistTitle?: string } | null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [boardGenre, setBoardGenre] = useState("HIPHOP");
  const [boardType] = useState("PLAYLIST_SHARE");
  const [selectedPlaylist, setSelectedPlaylist] = useState<SelectedPlaylist | null>(null);
  const [playlists, setPlaylists] = useState<{ id: number; title: string }[]>([]);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);

  const navigate = useNavigate();
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  // 플레이리스트 목록 불러오기
  const fetchPlaylists = async () => {
    if (!userEmail) return;
    const res = await playlistApi.getAllPlaylist();
    setPlaylists(res.data);
    setShowPlaylistSelector(true);
  };

  // 플레이리스트 선택 시 곡 목록 불러오기
  const handleSelectPlaylist = async (playlistId: number, playlistTitle: string) => {
    setIsLoadingPlaylist(true);
    try {
      const res = await playlistApi.getPlaylistSongs(playlistId);
      setSelectedPlaylist({
        id: playlistId,
        title: playlistTitle,
        songs: res.data,
      });
      // 제목 자동 입력 (비어있을 때만)
      if (!title.trim()) setTitle(playlistTitle);
    } finally {
      setIsLoadingPlaylist(false);
      setShowPlaylistSelector(false);
    }
  };

  // PlaylistDetailPage에서 넘어온 경우 자동 로드
  useEffect(() => {
    if (state?.playlistId && state?.playlistTitle && userEmail) {
      handleSelectPlaylist(state.playlistId, state.playlistTitle);
    }
  }, [userEmail]);

  const submit = async () => {
    if (!userEmail) return;
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      refreshPoint();
      return;
    }

    // 플레이리스트 카드
    const boardId = await boardApi.createBoard({
      title,
      content,
      boardType,
      boardGenre,
      songIds: selectedPlaylist?.songs.map((s) => s.id) ?? [],
    });
    navigate(`/community/share/${boardId}`);
  };

  return (
    <div className="kf-community-page kf-board-write">
      <div className="kf-community-page__shell">
      <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold">플레이리스트 공유</h2>

      {/* 제목 */}
      <input
        className="mb-3 w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* 장르 */}
      <select
        className="mb-4 w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white"
        value={boardGenre}
        onChange={(e) => setBoardGenre(e.target.value)}
      >
        <option value="HIPHOP">HIPHOP</option>
        <option value="POP">POP</option>
        <option value="KPOP">KPOP</option>
        <option value="JPOP">JPOP</option>
        <option value="ROCK">ROCK</option>
      </select>

      {/* 플레이리스트 카드 영역 */}
      {!selectedPlaylist ? (
        <div className="mb-4">
          <button
            onClick={fetchPlaylists}
            className="flex items-center gap-2 rounded border border-dashed border-indigo-500 px-4 py-3 text-indigo-400 hover:bg-indigo-900/20 w-full justify-center"
          >
            + 공유할 플레이리스트 선택
          </button>

          {/* 플레이리스트 선택 드롭다운 */}
          {showPlaylistSelector && (
            <div className="mt-2 rounded border border-neutral-700 bg-neutral-900">
              {playlists.length === 0 ? (
                <p className="px-4 py-3 text-gray-500 text-sm">플레이리스트가 없어요.</p>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => handleSelectPlaylist(pl.id, pl.title)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-800 border-b border-neutral-700 last:border-0"
                  >
                    {pl.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* 선택된 플레이리스트 카드 */
        <div className="mb-4 rounded-xl border border-indigo-700 bg-neutral-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
            <span className="font-semibold text-indigo-400">🎵 {selectedPlaylist.title}</span>
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              제거
            </button>
          </div>

          {isLoadingPlaylist ? (
            <p className="px-4 py-3 text-gray-400 text-sm">불러오는 중...</p>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {selectedPlaylist.songs.map((song) => (
                <li key={song.id} className="flex items-center gap-3 px-4 py-3">
                  <img
                    src={song.imgUrl}
                    alt={song.trackName}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold">{song.trackName}</p>
                    <p className="text-xs text-gray-400">{song.artistName}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 추가 텍스트 입력 */}
      <textarea
        className="mb-4 w-full min-h-[200px] resize-y rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        placeholder="추가로 하고 싶은 말을 입력하세요... (선택)"
        rows={5}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        className="rounded bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 w-full"
        onClick={submit}
      >
        등록
      </button>
      </div>
      </div>
    </div>
  );
};

export default BoardWrite;
