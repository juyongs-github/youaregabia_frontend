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
import DOMPurify from "dompurify";
import PlaylistCreateModal from "../../Components/ui/PlaylistCreateModal";
import { refreshPoint } from "../../Components/ui/refreshPoint";

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
  const [isShareMode, setIsShareMode] = useState(false);

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

  {
    /* 헤더 섹션 동일 */
  }
  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      {/* 헤더 섹션 (제목, 작성자 정보 등) */}
      <header className="mb-8 border-b border-neutral-800 pb-6">
        <h1 className="text-3xl font-bold text-indigo-400 mb-2">{board.title}</h1>
        <div className="flex justify-between text-sm text-gray-400">
          <span>
            {board.writer} | {new Date(board.createdAt).toLocaleDateString()}
          </span>
          <span>조회 {board.viewCount}</span>
        </div>
      </header>

      {/* 메인 레이아웃: 그리드 시스템 적용 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* [좌측 컬럼] 본문 및 댓글 (2/3 차지) */}
        <div className="lg:col-span-2 space-y-8">
          {/* 본문 내용 */}
          <div
            className="min-h-[300px] break-words leading-relaxed text-lg text-neutral-200 bg-neutral-900/30 p-6 rounded-xl border border-neutral-800"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(board.content) }}
          />

          {/* 좋아요 + 수정 + 목록 버튼 하단 배치 */}
          <div className="flex items-center justify-between border-t border-neutral-800 pt-6">
            <button
              onClick={() => navigate("/community/share")}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-all"
            >
              <span className="font-bold text-indigo-300 font-bold">📋 목록</span>
            </button>

            <div className="flex items-center gap-4">
              {isMyBoard && (
                <button
                  onClick={() => navigate(`/community/share/${board.boardId}/update`)}
                  className="text-sm font-medium text-neutral-400 hover:text-white"
                >
                  수정하기
                </button>
              )}
              <button
                onClick={handleLike}
                className={`flex items-center gap-3 rounded-full px-6 py-2.5 text-lg font-bold transition-all active:scale-95 ${
                  likedByMe
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "border-2 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white"
                }`}
              >
                <span>❤️</span>
                <span>{likeCount}</span>
              </button>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">댓글 {board.replies?.dtoList.length || 0}</h3>
              <div className="flex gap-4 text-xs text-neutral-500">
                <button
                  onClick={() => setSortBy("latest")}
                  className={sortBy === "latest" ? "text-indigo-400 font-bold" : ""}
                >
                  최신순
                </button>
                <button
                  onClick={() => setSortBy("likes")}
                  className={sortBy === "likes" ? "text-indigo-400 font-bold" : ""}
                >
                  추천순
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {board.replies?.dtoList.map((reply) => (
                <ReplyItem
                  key={reply.replyId}
                  reply={reply}
                  onRefresh={refresh}
                  boardId={Number(boardId)}
                  isAnonymous={false}
                />
              ))}
            </div>

            {/* 댓글 입력창 */}
            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none mb-2"
                placeholder="댓글을 입력하세요..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  onClick={createReply}
                  className="bg-indigo-600 px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-500 transition-all"
                >
                  작성
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* [우측 컬럼] 수록곡 리스트 (1/3 차지, 스크롤 시 고정) */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {board.songs && board.songs.length > 0 && (
              <div className="rounded-xl border border-indigo-700/50 bg-neutral-900 overflow-hidden shadow-2xl flex flex-col">
                <div className="px-4 py-4 border-b border-neutral-700 bg-neutral-800/50 flex items-center justify-between">
                  <h2 className="font-bold text-indigo-400 flex items-center gap-2">
                    <span className="text-xl">🎵</span> 수록곡 ({board.songs.length})
                  </h2>
                  {!isMyBoard && !isShareMode && (
                    <button
                      onClick={() => setIsShareMode(true)}
                      className="text-[10px] bg-indigo-600 hover:bg-indigo-500 px-2 py-1.5 rounded-md font-bold"
                    >
                      담기
                    </button>
                  )}
                  {isShareMode && (
                    <button
                      onClick={() => setIsShareMode(false)}
                      className="text-[10px] text-neutral-400"
                    >
                      취소
                    </button>
                  )}
                </div>

                {/* 공유 모드 플레이리스트 선택창 (수록곡 리스트 내부에 배치) */}
                {isShareMode && (
                  <div className="p-3 border-b border-neutral-700 bg-neutral-950/50 space-y-2">
                    <select
                      className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs text-white focus:outline-none"
                      value={selectedPlaylistId ?? ""}
                      onChange={(e) => setSelectedPlaylistId(Number(e.target.value) || null)}
                      onFocus={fetchPlaylists}
                    >
                      <option value="">추가할 리스트 선택...</option>
                      {playlists.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-[10px] text-indigo-400"
                      >
                        + 새 리스트
                      </button>
                      {selectedPlaylistId && selectedSongIds.size > 0 && (
                        <button
                          onClick={handleAddSelectedSongs}
                          disabled={checking}
                          className="bg-indigo-600 px-3 py-1 rounded text-[10px] font-bold"
                        >
                          추가하기
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 곡 목록 리스트 */}
                <ul className="divide-y divide-neutral-800 max-h-[60vh] overflow-y-auto">
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
                          className={`flex items-center gap-3 px-3 py-3 transition-colors ${isDisabled ? "opacity-50" : "hover:bg-neutral-800"} ${isShareMode && !isDisabled ? "cursor-pointer" : ""}`}
                          onClick={() =>
                            isShareMode && !isDisabled && toggleSongSelect(song.songId)
                          }
                        >
                          {isShareMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              readOnly
                              className="w-4 h-4 accent-indigo-500"
                            />
                          )}
                          <img
                            src={song.imgUrl}
                            className="w-10 h-10 rounded object-cover"
                            alt="cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{song.trackName}</p>
                            <p className="text-[10px] text-neutral-400 truncate">
                              {song.artistName}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 모달 동일 */}
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
