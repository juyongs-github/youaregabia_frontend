import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardApi } from '../api/boardApi';


const BoardUpdate = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const userId = 1;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 1️⃣ 기존 게시글 불러오기
  useEffect(() => {
    if (!boardId) return;

    boardApi.getBoardDetail(Number(boardId), userId).then((board) => {
      setTitle(board.title);
      setContent(board.content ?? '');
    });
  }, [boardId]);

  // 2️⃣ 수정
  const update = async () => {
    if (!boardId) return;

    await boardApi.updateBoard(Number(boardId), {
      title,
      content,
    });

    navigate(`/community/share/${boardId}`);
  };

  // 3️⃣ 삭제
  const remove = async () => {
    if (!boardId) return;

    if (!confirm('정말 삭제할까요?')) return;

    await boardApi.deleteBoard(Number(boardId));
    navigate('/community/share');
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">게시글 수정</h2>

      <input
        className="mb-3 w-full rounded border px-3 py-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="mb-3 w-full rounded border px-3 py-2"
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex gap-2">
        <button onClick={update}>수정</button>
        <button onClick={remove}>삭제</button>
      </div>
    </div>
  );
};

export default BoardUpdate;
