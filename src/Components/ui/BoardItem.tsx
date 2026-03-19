import { useNavigate } from "react-router-dom";
import type { Board } from "../../types/board";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

interface Props {
  board: Board;
  basePath?: string;
}

const BoardItem = ({ board, basePath }: Props) => {
  const navigate = useNavigate();
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  // basePath 자동 결정
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

  return (
    <li>
      <button
        className="block w-full px-4 py-3 text-left hover:bg-neutral-800"
        onClick={() => navigate(`${resolvedPath}/${board.boardId}`)}
      >
        {/* 평론 - 대상 곡 표시 */}
        {isCritic && board.songs && board.songs.length > 0 && (
          <div className="mb-2 flex items-center gap-2">
            <img src={board.songs[0].imgUrl} className="w-8 h-8 rounded object-cover" />
            <span className="text-xs text-gray-400">
              {board.songs[0].trackName} - {board.songs[0].artistName}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate mr-4">
            {/* 평론 뱃지 */}
            {isCritic && (
              <span className="flex-shrink-0 text-xs font-bold text-yellow-400 border border-yellow-400 px-1.5 py-0.5 rounded">
                평론
              </span>
            )}
            <span className="text-indigo-400 font-medium truncate">
              {!isFree && !isCritic && `[${board.boardGenre}] `}
              {board.title}
            </span>
            {/* 내 글 표시 */}
            {isMyBoard && (
              <span className="flex-shrink-0 text-xs text-indigo-300 border border-indigo-300 px-1.5 py-0.5 rounded">
                내 글
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* 익명 처리 */}
            <span className="text-sm text-gray-400">{isFree ? "익명" : board.writer}</span>
            <span className="text-xs text-gray-500 border-l border-neutral-700 pl-3">
              조회 {board.viewCount}
            </span>
            <span className="text-xs text-gray-500">❤️ {board.likeCount}</span>
          </div>
        </div>

        <div className="mt-1 text-xs text-gray-500">
          {new Date(board.createdAt).toLocaleDateString("ko-KR")}
        </div>
      </button>
    </li>
  );
};

export default BoardItem;
