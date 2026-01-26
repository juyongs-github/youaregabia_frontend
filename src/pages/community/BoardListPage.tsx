// pages/BoardListPage.tsx
import { useEffect, useState } from 'react';
import { boardApi } from '../../api/boardApi';
import type { Board } from '../../types/board';
import { Link, Navigate, useNavigate } from 'react-router-dom';

const BoardListPage = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const Navigate = useNavigate();

  useEffect(() => {
    boardApi.getBoards().then(setBoards);
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">게시판</h2>

      <ul className="divide-y divide-neutral-700 rounded border border-neutral-700">
        {boards.map((board) => (
          <li key={board.boardId}>
            <Link
              to={`/community/share/${board.boardId}`}
              className="block px-4 py-3 hover:bg-neutral-800"
            >
              <span className="text-indigo-400">{board.title}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* pageable 대비 공간 */}
      <div className="mt-6 flex justify-center text-sm text-gray-400">
        페이지네이션 영역
      </div>
      <button
        type="button"
        className="mt-4 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
        onClick={() => Navigate('/community/share/new')}
      >
        글쓰기
      </button>
    </div>
  );
};

export default BoardListPage;
