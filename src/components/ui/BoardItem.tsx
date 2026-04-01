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
        className="block w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
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
              <span className="flex-shrink-0 text-xs font-bold text-amber-600 border border-amber-400 px-1.5 py-0.5 rounded">
                평론
              </span>
            )}
            {!isFree && !isCritic && (
              <span className="flex-shrink-0 text-[11px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                {board.boardGenre}
              </span>
            )}
            <span className="text-indigo-600 font-medium truncate">
              {board.title}
            </span>
            {/* 내 글 표시 */}
            {isMyBoard && (
              <span className="flex-shrink-0 text-xs text-indigo-500 border border-indigo-300 px-1.5 py-0.5 rounded">
                내 글
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* 익명 처리 */}
            <span className="text-sm text-gray-500">{isFree ? "익명" : board.writer}</span>
            <span className="text-xs text-gray-400 border-l border-gray-200 pl-3">
              조회 {board.viewCount}
            </span>
            {/* 하트 및 추천 수 스타일 수정 */}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span>❤️</span>
              <span
                className={`font-bold ${board.likeCount >= 5 ? "text-blue-500" : "text-gray-400"}`}
              >
                {board.likeCount}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-1 text-xs text-gray-400">
          {new Date(board.createdAt).toLocaleDateString("ko-KR")}
        </div>
      </button>
    </li>
  );
};

export default BoardItem;
