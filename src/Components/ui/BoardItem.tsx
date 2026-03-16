import { useNavigate } from "react-router-dom";
import type { Board } from "../../types/board";

interface Props {
  board: Board;
  basePath?: string; // 기본값 "/community/share"
}

const BoardItem = ({ board, basePath = "/community/share" }: Props) => {
  const navigate = useNavigate();

  return (
    <li>
      <button
        className="block w-full px-4 py-3 text-left hover:bg-neutral-800"
        onClick={() => navigate(`${basePath}/${board.boardId}`)}
      >
        {/* 평론이면 곡 정보 표시 */}
        {board.songs && board.songs.length > 0 && (
          <div className="mb-2 flex items-center gap-2">
            <img src={board.songs[0].imgUrl} className="w-8 h-8 rounded object-cover" />
            <span className="text-xs text-gray-400">
              {board.songs[0].trackName} - {board.songs[0].artistName}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-indigo-400 font-medium truncate mr-4">
            [{board.boardGenre}] {board.title}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-400">{board.writer}</span>
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
