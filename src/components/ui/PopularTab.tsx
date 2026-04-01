import type { Board } from "../../types/board";
import BoardItem from "../../components/ui/BoardItem";

interface Props {
  boards: Board[];
  loading: boolean;
}

const PopularTab = ({ boards, loading }: Props) => {
  if (loading) return <div className="p-4 text-center text-gray-400">로딩 중...</div>;

  return (
    <>
      <p className="mb-3 text-sm text-gray-400">좋아요 5개 이상인 게시글이에요</p>
      <ul className="divide-y divide-neutral-700 rounded border border-neutral-700">
        {boards.length > 0 ? (
          boards.map((board) => <BoardItem key={board.boardId} board={board} />)
        ) : (
          <li className="px-4 py-8 text-center text-gray-500">인기글이 없습니다</li>
        )}
      </ul>
    </>
  );
};

export default PopularTab;
