import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import type { Board } from "../../types/board";
import { replyApi } from "../../api/replyApi";
import { playlistApi } from "../../api/playlistApi";
import ReplyItem from "../../Components/ui/replyItem";
import Pagination from "../../Components/ui/Pagination";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import PlaylistCreateModal from "../../Components/ui/PlaylistCreateModal";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<"latest" | "likes">("latest");
  const isFirstRender = useRef(true);
  const navigate = useNavigate();

  const loadBoard = async (page: number = 1, sort: "latest" | "likes" = sortBy) => {
    if (!boardId) return;
    const data = await boardApi.getBoardDetail(Number(boardId), { page, size: 10, sort });
    setBoard(data);
    setReplyPage(page);
  };

  useEffect(() => {
    if (boardId) loadBoard(1);
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

  const createReply = async () => {
    if (!boardId || !replyContent.trim()) return;
    await replyApi.createReply(Number(boardId), { content: replyContent });
    setReplyContent("");
    loadBoard(1);
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
    if (!selectedPlaylistId || !userEmail) return;
    const toAdd =
      board?.songs?.filter((s) => selectedSongIds.has(s.songId) && !addedSongIds.has(s.songId)) ??
      [];
    for (const song of toAdd) {
      await playlistApi.addSongToPlaylist(selectedPlaylistId, song.songId);
      setAddedSongIds((prev) => new Set(prev).add(song.songId));
    }
    alert(`${toAdd.length}곡이 추가됐어요!`);
  };

  if (!board) return <div>로딩 중...</div>;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 border-b border-neutral-700 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">{board.title}</h1>
        <span className="text-sm font-semibold text-neutral-500">작성자: {board.writer}</span>
        <div className="text-sm font-semibold text-neutral-500">생성일시: {board.createdAt}</div>
        <div className="text-sm font-semibold text-neutral-500">장르: {board.boardGenre}</div>
      </div>
      {/* 수록곡 + 플레이리스트 추가 - 좋아요 아래 */}
      {board.songs && board.songs.length > 0 && (
        <div className="mb-8 rounded-xl border border-indigo-700 bg-neutral-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
            <span className="font-semibold text-indigo-400">🎵 수록곡</span>
            <span className="text-xs text-gray-500">
              {selectedSongIds.size} / {board.songs.length}곡 선택됨
            </span>
          </div>

          {/* 플레이리스트 선택 + 추가 버튼 */}
          {userEmail && (
            <div className="px-4 py-3 border-b border-neutral-700 flex items-center gap-2">
              <select
                className="flex-1 rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
                value={selectedPlaylistId ?? ""}
                onChange={(e) => setSelectedPlaylistId(Number(e.target.value) || null)}
                onClick={fetchPlaylists}
              >
                <option value="">내 플레이리스트에 추가...</option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
              >
                + 새로 만들기
              </button>
              {selectedPlaylistId && selectedSongIds.size > 0 && (
                <button
                  onClick={handleAddSelectedSongs}
                  className="rounded bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-500 whitespace-nowrap"
                >
                  선택 추가
                </button>
              )}
            </div>
          )}

          {/* 곡 목록 - 체크박스 포함 */}
          <ul className="divide-y divide-neutral-800">
            {board.songs
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((song) => (
                <li
                  key={song.songId}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-800 ${
                    addedSongIds.has(song.songId) ? "opacity-50" : ""
                  }`}
                  onClick={() => !addedSongIds.has(song.songId) && toggleSongSelect(song.songId)}
                >
                  <input
                    type="checkbox"
                    checked={selectedSongIds.has(song.songId)}
                    disabled={addedSongIds.has(song.songId)}
                    onChange={() => !addedSongIds.has(song.songId) && toggleSongSelect(song.songId)}
                    className="w-4 h-4 accent-indigo-600 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <img
                    src={song.imgUrl}
                    alt={song.trackName}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{song.trackName}</p>
                    <p className="text-xs text-gray-400">{song.artistName}</p>
                  </div>
                  {addedSongIds.has(song.songId) && (
                    <span className="text-xs text-green-400">추가됨 ✓</span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* 본문 */}
      <div className="mb-8 min-h-[100px] whitespace-pre-wrap break-words leading-[1.3] text-white">
        {board.content}
      </div>

      {/* 좋아요 + 수정 버튼 영역 */}
      <div className="flex items-center justify-end gap-4 mb-8">
        {/* 수정 버튼 (본인일 경우에만 노출) */}
        {userEmail && board.writerEmail === userEmail && (
          <button
            onClick={() => navigate(`/community/share/${board.boardId}/update`)}
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            수정하기
          </button>
        )}

        {/* 크게 만든 좋아요 버튼 */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-3 rounded-full px-6 py-3 text-lg font-bold transition-all transform active:scale-95 ${
            likedByMe
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "border-2 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white"
          }`}
        >
          <span className={`${likedByMe ? "animate-bounce" : ""}`}>❤️</span>
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

      {/* 플레이리스트 생성 모달 */}
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
