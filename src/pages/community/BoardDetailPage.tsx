import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import type { Board } from "../../types/board";
import { replyApi } from "../../api/replyApi";
import { playlistApi } from "../../api/playlistApi";
import ReplyItem from "../../components/ui/replyItem";
import Pagination from "../../components/ui/Pagination";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import PlaylistCreateModal from "../../components/ui/PlaylistCreateModal";
import { refreshPoint } from "../../components/ui/refreshPoint";

const BoardDetailPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyPage, setReplyPage] = useState(1);
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [playlists, setPlaylists] = useState<{ id: number; title: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [addedSongIds, setAddedSongIds] = useState<Set<number>>(new Set());
  const [playlistSongIds, setPlaylistSongIds] = useState<Set<number>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<"latest" | "likes">("latest");
  const [checking, setChecking] = useState(false);
  const isFirstRender = useRef(true);
  const hasFetched = useRef(false);
  const navigate = useNavigate();

  const loadBoard = async (page: number = 1, sort: "latest" | "likes" = sortBy) => {
    if (!boardId) return;
    const data = await boardApi.getBoardDetail(Number(boardId), { page, size: 10, sort });
    setBoard(data);
    setReplyPage(page);
  };

  // 최초 한 번만 실행 - 조회수 중복 방지
  useEffect(() => {
    if (boardId && !hasFetched.current) {
      hasFetched.current = true;
      loadBoard(1);
    }
  }, [boardId]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (boardId) loadBoard(1, sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (board) {
      setLikeCount(board.likeCount);
      setLikedByMe(board.likedByMe);
    }
  }, [board]);

  // board 로드 후 곡 전체 선택
  useEffect(() => {
    if (board?.songs) {
      setSelectedSongIds(new Set(board.songs.map((s) => s.songId)));
    }
  }, [board]);

  // 선택한 플레이리스트 곡 목록 조회
  useEffect(() => {
    if (!selectedPlaylistId) {
      setPlaylistSongIds(new Set());
      setAddedSongIds(new Set());
      return;
    }
    playlistApi.getPlaylistSongs(selectedPlaylistId).then((res) => {
      setPlaylistSongIds(new Set(res.data.map((s: any) => s.id)));
      setAddedSongIds(new Set());
      // 체크박스 전체 선택 재설정 (이미 있는 곡 제외)
      if (board?.songs) {
        const inPlaylist = new Set(res.data.map((s: any) => s.id));
        setSelectedSongIds(
          new Set(board.songs.map((s) => s.songId).filter((id) => !inPlaylist.has(id)))
        );
      }
    });
  }, [selectedPlaylistId]);

  const createReply = async () => {
    if (!boardId || !replyContent.trim()) return;
    await replyApi.createReply(Number(boardId), { content: replyContent });
    setReplyContent("");
    loadBoard(1);
    refreshPoint(); // 포인트 다시 부르기
  };

  const refresh = async () => {
    if (!boardId) return;
    const updated = await boardApi.getBoardDetail(Number(boardId), {
      page: replyPage,
      size: 10,
      sort: sortBy,
    });
    setBoard(updated);
  };

  const handleReplyPageChange = (page: number) => {
    loadBoard(page, sortBy);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLike = async () => {
    if (!userEmail) {
      alert("로그인이 필요합니다.");
      return;
    }
    const res = await boardApi.toggleBoardLike(Number(boardId));
    setLikeCount(res.likeCount);
    setLikedByMe(res.likedByMe);
    refreshPoint();
  };

  const fetchPlaylists = async () => {
    if (!userEmail || playlists.length > 0) return;
    const res = await playlistApi.getAllPlaylist();
    setPlaylists(res.data);
  };

  const toggleSongSelect = (songId: number) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const handleAddSelectedSongs = async () => {
    if (!selectedPlaylistId) {
      alert("추가할 플레이리스트를 선택해주세요.");
      return;
    }
    if (selectedSongIds.size === 0) {
      alert("선택된 곡이 없습니다.");
      return;
    }

    try {
      setChecking(true);
      const res = await playlistApi.getPlaylistSongs(selectedPlaylistId);
      const existingSongIds = new Set(res.data.map((s: any) => s.id));

      const selectedArray = Array.from(selectedSongIds);
      const songsToAdd = selectedArray.filter((id) => !existingSongIds.has(id));
      const duplicateCount = selectedArray.length - songsToAdd.length;

      if (songsToAdd.length === 0) {
        alert("선택하신 곡이 이미 플레이리스트에 모두 존재합니다.");
        return;
      }

      const confirmMsg =
        duplicateCount > 0
          ? `중복된 ${duplicateCount}곡을 제외하고 ${songsToAdd.length}곡을 추가하시겠습니까?`
          : `${songsToAdd.length}곡을 플레이리스트에 추가하시겠습니까?`;

      if (window.confirm(confirmMsg)) {
        await Promise.all(
          songsToAdd.map((songId) => playlistApi.addSongToPlaylist(selectedPlaylistId, songId))
        );
        alert("성공적으로 추가되었습니다.");
        setAddedSongIds((prev) => new Set([...prev, ...songsToAdd]));
        setPlaylistSongIds((prev) => new Set([...prev, ...songsToAdd]));
        setSelectedSongIds(new Set());
      }
    } catch (error) {
      console.error("곡 추가 중 오류 발생:", error);
      alert("곡을 추가하는 중 오류가 발생했습니다.");
    } finally {
      setChecking(false);
    }
  };

  if (!board) return <div>로딩 중...</div>;

  // 본인 글 여부
  const isMyBoard = !!(userEmail && board.writerEmail === userEmail);

  return (
    <div className="max-w-4xl mx-auto p-4 text-white">
      {/* 헤더 */}
      <div className="mb-6 border-b border-neutral-700 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">{board.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-neutral-500">
          <span>작성자: {board.writer}</span>
          <span>생성일시: {board.createdAt}</span>
          <span className="text-indigo-400">장르: {board.boardGenre}</span>
        </div>
      </div>

      {/* 수록곡 섹션 */}
      {board.songs && board.songs.length > 0 && (
        <div className="mb-8 rounded-xl border border-indigo-700 bg-neutral-900 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-neutral-800/50">
            <span className="font-semibold text-indigo-400 flex items-center gap-2">
              <span className="text-xl">🎵</span> 수록곡 리스트
            </span>
            {!isMyBoard && (
              <span className="text-xs text-gray-400 bg-neutral-700 px-2 py-1 rounded-full">
                {selectedSongIds.size} / {board.songs.length}곡 선택됨
              </span>
            )}
          </div>

          {/* 플레이리스트 선택 및 추가 - 본인 글이면 숨김 */}
          {userEmail && !isMyBoard && (
            <div className="px-4 py-3 border-b border-neutral-700 bg-neutral-900 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <select
                  className="flex-1 rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={selectedPlaylistId ?? ""}
                  onChange={(e) => setSelectedPlaylistId(Number(e.target.value) || null)}
                  onFocus={fetchPlaylists}
                >
                  <option value="">추가할 플레이리스트 선택...</option>
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline whitespace-nowrap px-1"
                >
                  + 새 리스트
                </button>
              </div>

              {selectedPlaylistId && selectedSongIds.size > 0 && (
                <button
                  onClick={handleAddSelectedSongs}
                  disabled={checking}
                  className={`rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all
                    ${checking ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-500 active:scale-95"}`}
                >
                  {checking ? "확인 중..." : "선택곡 추가"}
                </button>
              )}
            </div>
          )}

          {/* 곡 목록 */}
          <ul className="divide-y divide-neutral-800 max-h-[500px] overflow-y-auto">
            {board.songs
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((song) => {
                const isAlreadyAdded = addedSongIds.has(song.songId);
                const isInPlaylist = playlistSongIds.has(song.songId);
                const isDisabled = isAlreadyAdded || isInPlaylist;
                const isSelected = selectedSongIds.has(song.songId);

                return (
                  <li
                    key={song.songId}
                    className={`flex items-center gap-4 px-4 py-3 transition-colors
                      ${isDisabled ? "bg-neutral-900/50" : "hover:bg-neutral-800 cursor-pointer"}`}
                    onClick={() => !isDisabled && !isMyBoard && toggleSongSelect(song.songId)}
                  >
                    {/* 체크박스 - 본인 글이면 숨김 */}
                    {!isMyBoard && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => !isDisabled && toggleSongSelect(song.songId)}
                        className={`w-5 h-5 rounded border-neutral-600 accent-indigo-500 flex-shrink-0
                          ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    <div className="relative flex-shrink-0">
                      <img
                        src={song.imgUrl}
                        alt={song.trackName}
                        className={`w-12 h-12 rounded shadow-md object-cover
                          ${isDisabled ? "grayscale opacity-50" : ""}`}
                      />
                      {isAlreadyAdded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                          <span className="text-[10px] font-bold text-green-400">IN</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${isDisabled ? "text-neutral-500" : "text-white"}`}
                      >
                        {song.trackName}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">{song.artistName}</p>
                    </div>

                    {isAlreadyAdded ? (
                      <span className="text-[11px] font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded">
                        보관됨 ✓
                      </span>
                    ) : isInPlaylist ? (
                      <span className="text-[11px] font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                        이미 있음
                      </span>
                    ) : isSelected && !isMyBoard ? (
                      <span className="text-[11px] font-bold text-indigo-400 animate-pulse">
                        선택됨
                      </span>
                    ) : null}
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {/* 본문 */}
      <div className="mb-8 min-h-[100px] whitespace-pre-wrap break-words leading-[1.3] text-white">
        {board.content}
      </div>

      {/* 좋아요 + 수정 버튼 */}
      <div className="flex items-center justify-end gap-4 mb-8">
        {isMyBoard && (
          <button
            onClick={() => navigate(`/community/share/${board.boardId}/update`)}
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            수정하기
          </button>
        )}
        <button
          onClick={handleLike}
          className={`flex items-center gap-3 rounded-full px-6 py-3 text-lg font-bold transition-all active:scale-95 ${
            likedByMe
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "border-2 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white"
          }`}
        >
          <span className={likedByMe ? "animate-bounce" : ""}>❤️</span>
          <span>{likeCount}</span>
        </button>
      </div>

      <hr />

      {/* 댓글 */}
      <h3>댓글</h3>
      <div className="min-h-[50px]">
        <button
          onClick={() => setSortBy("latest")}
          style={{ fontWeight: sortBy === "latest" ? "bold" : "normal" }}
        >
          최신순
        </button>
        <button
          onClick={() => setSortBy("likes")}
          style={{ fontWeight: sortBy === "likes" ? "bold" : "normal", marginLeft: "10px" }}
        >
          추천순
        </button>
      </div>

      {!board.replies || board.replies?.dtoList.length === 0 ? (
        <p>댓글이 없습니다.</p>
      ) : (
        <>
          <ul>
            {board.replies.dtoList.map((reply) => (
              <ReplyItem
                key={reply.replyId}
                reply={reply}
                onRefresh={refresh}
                boardId={Number(boardId)}
                isAnonymous={false}
              />
            ))}
          </ul>
          {board.replies.pageNumList.length > 0 && (
            <Pagination
              pageNumList={board.replies.pageNumList}
              current={board.replies.current}
              prev={board.replies.prev}
              next={board.replies.next}
              prevPage={board.replies.prevPage}
              nextPage={board.replies.nextPage}
              onPageChange={handleReplyPageChange}
            />
          )}
        </>
      )}

      <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={3} />
      <button
        onClick={createReply}
        className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-500"
      >
        댓글 작성
      </button>

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
    </div>
  );
};

export default BoardDetailPage;
