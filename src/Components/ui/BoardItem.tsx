import { useNavigate } from "react-router-dom";
import type { Board } from "../../types/board";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

interface Props {
  board: Board;
  basePath?: string;
}

const GENRE_STYLE: Record<string, { bg: string; color: string }> = {
  KPOP:   { bg: "rgba(109,94,252,0.10)",  color: "#6d5efc" },
  JPOP:   { bg: "rgba(255,92,168,0.10)",  color: "#e0468a" },
  POP:    { bg: "rgba(56,152,255,0.10)",  color: "#2d7fd9" },
  HIPHOP: { bg: "rgba(255,182,72,0.12)",  color: "#b86a00" },
  ROCK:   { bg: "rgba(255,102,122,0.10)", color: "#d63048" },
};

const BoardItem = ({ board, basePath }: Props) => {
  const navigate = useNavigate();
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  const resolvedPath =
    basePath ??
    (board.boardType === "CRITIC"
      ? "/recommend/critic"
      : board.boardType === "FREE"
        ? "/community/free"
        : "/community/share");

  const isMyBoard = !!(userEmail && board.writerEmail === userEmail);
  const isCritic = board.boardType === "CRITIC";
  const isFree = board.boardType === "FREE";

  const genreStyle = board.boardGenre ? GENRE_STYLE[board.boardGenre] ?? { bg: "rgba(95,103,145,0.10)", color: "#677086" } : null;

  return (
    <li>
      <button
        className="kf-board-item"
        onClick={() => navigate(`${resolvedPath}/${board.boardId}`)}
      >
        {/* 평론 - 대상 곡 표시 */}
        {isCritic && board.songs && board.songs.length > 0 && (
          <div className="kf-board-item__song">
            <img src={board.songs[0].imgUrl} className="kf-board-item__song-img" alt="" />
            <span className="kf-board-item__song-name">
              {board.songs[0].trackName} — {board.songs[0].artistName}
            </span>
          </div>
        )}

        {/* 뱃지 행 */}
        <div className="kf-board-item__badges">
          {isCritic && (
            <span className="kf-genre-badge" style={{ background: "rgba(255,182,72,0.12)", color: "#b86a00" }}>
              평론
            </span>
          )}
          {!isFree && !isCritic && genreStyle && (
            <span className="kf-genre-badge" style={{ background: genreStyle.bg, color: genreStyle.color }}>
              {board.boardGenre}
            </span>
          )}
          {isMyBoard && <span className="kf-mine-badge">내 글</span>}
        </div>

        {/* 제목 */}
        <div className="kf-board-item__title">{board.title}</div>

        {/* 메타 정보 */}
        <div className="kf-board-item__meta">
          <span className="kf-board-item__writer">{isFree ? "익명" : board.writer}</span>
          <span className="kf-board-item__dot">·</span>
          <span className="kf-board-item__date">
            {new Date(board.createdAt).toLocaleDateString("ko-KR")}
          </span>
          <span className="kf-board-item__stats">
            <span>조회 {board.viewCount}</span>
            <span className="kf-board-item__like">❤ {board.likeCount}</span>
          </span>
        </div>
      </button>
    </li>
  );
};

export default BoardItem;
