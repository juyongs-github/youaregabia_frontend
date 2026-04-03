import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import type { Board, BoardSong } from "../../types/board";
import { replyApi } from "../../api/replyApi";
import { playlistApi } from "../../api/playlistApi";
import ReplyItem from "../../Components/ui/replyItem";
import Pagination from "../../Components/ui/Pagination";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import DOMPurify from "dompurify";
import PlaylistCreateModal from "../../Components/ui/PlaylistCreateModal";
import { refreshPoint } from "../../Components/ui/refreshPoint";
import "../../styles/board-detail-kfandom.css";
import { usePlayer } from "../../contexts/PlayerContext"; // 1. PlayerContext 임포트
import type { Song } from "../../components/ui/SongListItem";

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

  const { play, song: currentSong } = usePlayer(); // 2. play 함수 가져오기

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

  useEffect(() => {
    if (board?.songs) {
      setSelectedSongIds(new Set(board.songs.map((s) => s.songId)));
    }
  }, [board]);

  useEffect(() => {
    if (!selectedPlaylistId) {
      setPlaylistSongIds(new Set());
      setAddedSongIds(new Set());
      return;
    }
    playlistApi.getPlaylistSongs(selectedPlaylistId).then((res) => {
      setPlaylistSongIds(new Set(res.data.map((s: any) => s.id)));
      setAddedSongIds(new Set());
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
    refreshPoint();
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

  const handleSongClick = (boardSong: BoardSong) => {
    if (isShareMode) {
      // 공유 모드 로직 (기존과 동일)
      const isAlreadyAdded = addedSongIds.has(boardSong.songId);
      const isInPlaylist = playlistSongIds.has(boardSong.songId);
      if (!isAlreadyAdded && !isInPlaylist) {
        toggleSongSelect(boardSong.songId);
      }
    } else {
      // 1. BoardSong 데이터를 Song 타입 규격에 맞게 매핑 (실제 데이터 사용)
      const playData: Song = {
        id: boardSong.songId, // 중요: songId -> id
        trackName: boardSong.trackName,
        artistName: boardSong.artistName,
        imgUrl: boardSong.imgUrl,
        previewUrl: boardSong.previewUrl, // 이제 실제 값이 들어옵니다
        genreName: boardSong.genreName, // 이제 실제 값이 들어옵니다
        durationMs: boardSong.durationMs, // 이제 실제 값이 들어옵니다
        releaseDate: boardSong.releaseDate, // 이제 실제 값이 들어옵니다
      };

      // 2. 플레이어 실행
      // 두 번째 인자로 현재 게시글의 모든 곡 리스트를 넘겨주면 다음 곡 재생도 가능해집니다.
      play(playData, {
        songs: board?.songs?.map((s) => ({
          id: s.songId,
          trackName: s.trackName,
          artistName: s.artistName,
          imgUrl: s.imgUrl,
          previewUrl: s.previewUrl,
          genreName: s.genreName,
          durationMs: s.durationMs,
          releaseDate: s.releaseDate,
        })) as Song[],
        songIndex: boardSong.orderIndex,
      });
    }
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

  if (!board) return <div className="kf-community-loading">로딩 중...</div>;

  const isMyBoard = !!(userEmail && board.writerEmail === userEmail);

  return (
    <div className="kf-community-page kf-board-detail">
      <div className="kf-community-page__shell">
        <div className="max-w-6xl mx-auto p-6">
          <header className="mb-8 pb-6" style={{ borderBottom: "1px solid var(--kf-border)" }}>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--kf-brand)" }}>
              {board.title}
            </h1>
            <div className="flex justify-between text-sm" style={{ color: "var(--kf-text-sub)" }}>
              <span>
                {board.writer} | {new Date(board.createdAt).toLocaleDateString()}
                {/* 장르가 Free가 아닐 때만 세로바와 함께 표시 */}
                {board.boardGenre !== "FREE" && ` | ${board.boardGenre}`}
              </span>
              <span>조회 {board.viewCount}</span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div
                className="min-h-[300px] break-words leading-relaxed text-lg p-6 rounded-xl"
                style={{
                  color: "var(--kf-text-main)",
                  background: "rgba(255,255,255,0.56)",
                  border: "1px solid var(--kf-border)",
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(board.content) }}
              />
              <div
                className="flex items-center justify-between pt-6"
                style={{ borderTop: "1px solid var(--kf-border)" }}
              >
                <button
                  onClick={() =>
                    board.boardGenre === "FREE"
                      ? navigate("/recommend/critic")
                      : navigate("/community/share")
                  }
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: "rgba(109,94,252,0.08)",
                    color: "var(--kf-brand)",
                    border: "1px solid rgba(109,94,252,0.18)",
                  }}
                >
                  목록
                </button>
                <div className="flex items-center gap-4">
                  {isMyBoard && (
                    <button
                      onClick={() => navigate(`/community/share/${board.boardId}/update`)}
                      className="text-sm font-medium transition-colors"
                      style={{ color: "var(--kf-text-sub)" }}
                    >
                      수정하기
                    </button>
                  )}
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-3 rounded-full px-6 py-2 text-base font-bold transition-all active:scale-95"
                    style={
                      likedByMe
                        ? {
                            background:
                              "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
                            color: "#fff",
                            border: "none",
                            boxShadow: "0 8px 20px rgba(109,94,252,0.28)",
                          }
                        : {
                            background: "transparent",
                            color: "var(--kf-text-sub)",
                            border: "2px solid var(--kf-border-strong)",
                          }
                    }
                  >
                    <span>❤️</span>
                    <span>{likeCount}</span>
                  </button>
                </div>
              </div>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold" style={{ color: "var(--kf-text-main)" }}>
                    댓글 {board.replies?.dtoList.length || 0}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy("latest")}
                      className={`kf-sort-btn ${sortBy === "latest" ? "kf-sort-btn--active" : ""}`}
                    >
                      최신순
                    </button>
                    <button
                      onClick={() => setSortBy("likes")}
                      className={`kf-sort-btn ${sortBy === "likes" ? "kf-sort-btn--active" : ""}`}
                    >
                      추천순
                    </button>
                  </div>
                </div>
                {!board.replies || board.replies.dtoList.length === 0 ? (
                  <p style={{ color: "var(--kf-text-muted)" }}>댓글이 없습니다.</p>
                ) : (
                  <>
                    <ul className="kf-reply-list mb-6">
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
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--kf-border)",
                  }}
                >
                  <textarea
                    placeholder="댓글을 입력하세요..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={createReply}
                      className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
                        boxShadow: "0 8px 20px rgba(109,94,252,0.24)",
                      }}
                    >
                      작성
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {board.songs && board.songs.length > 0 && (
              <aside className="lg:col-span-1">
                <div className="sticky top-6">
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
                      <h2
                        className="font-bold flex items-center gap-2"
                        style={{ color: "var(--kf-brand)" }}
                      >
                        <span>🎵</span> 수록곡 ({board.songs.length})
                      </h2>
                      {!isMyBoard && !isShareMode && (
                        <button
                          onClick={() => setIsShareMode(true)}
                          className="text-xs px-3 py-1 rounded-full font-bold text-white transition-all"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
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
                              background:
                                "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
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
                      {board.songs
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((song) => {
                          const isAlreadyAdded = addedSongIds.has(song.songId);
                          const isInPlaylist = playlistSongIds.has(song.songId);
                          const isDisabled = isAlreadyAdded || isInPlaylist;
                          const isSelected = selectedSongIds.has(song.songId);
                          // 추가: 현재 재생 중인지 확인
                          const isPlaying = currentSong?.id === song.songId;

                          return (
                            <li
                              key={song.songId}
                              className={`flex items-center gap-3 px-3 py-2 transition-colors hover:bg-black/5 cursor-pointer`}
                              style={{
                                opacity: isShareMode && isDisabled ? 0.45 : 1,
                                // 재생 중일 때 배경색 변경 (예: 브랜드 색상의 아주 연한 버전)
                                background: isPlaying
                                  ? "rgba(109,94,252,0.12)"
                                  : isSelected && isShareMode && !isDisabled
                                    ? "rgba(109,94,252,0.06)"
                                    : "transparent",
                                borderBottom: "1px solid var(--kf-border)",
                                // 재생 중일 때 왼쪽 보더 포인트 강조 (선택 사항)
                                borderLeft: isPlaying
                                  ? "4px solid var(--kf-brand)"
                                  : "4px solid transparent",
                              }}
                              onClick={() => handleSongClick(song)} // 4. 클릭 시 핸들러 실행
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
                                    // 재생 중일 때 텍스트 색상 변경
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
                </div>
              </aside>
            )}
          </div>
        </div>
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
    </div>
  );
};

export default BoardDetailPage;
