import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { boardApi } from '../api/boardApi';
import type { Board } from '../types/board';

const BoardListPage = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    boardApi
      .getBoards()
      .then(setBoards)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h1>게시판</h1>

      <ul>
        {boards.map((board) => (
          <li key={board.boardId}>
            <Link to={`/boards/${board.boardId}`}>{board.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BoardListPage;
