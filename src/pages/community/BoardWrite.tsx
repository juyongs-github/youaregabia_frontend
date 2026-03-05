import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi } from '../../api/boardApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

const BoardWrite = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  // 이메일 가져오
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  const submit = async () => {
    if (!userEmail) return;
    const boardId = await boardApi.createBoard({ title, content }, userEmail);
    navigate(`/community/share/${boardId}`);
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">플레이리스트 공유</h2>

      <input
        className="mb-3 w-full rounded border px-3 py-2"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="mb-4 w-full min-h-[400px] resize-y rounded border px-4 py-3 leading-normal"
        placeholder="내용"
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        className="rounded bg-indigo-600 px-4 py-2 text-white"
        onClick={submit}
      >
        등록
      </button>
    </div>
  );
};

export default BoardWrite;
