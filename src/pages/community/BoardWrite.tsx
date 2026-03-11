import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

const BoardWrite = () => {
  const location = useLocation(); // 추가
  const state = location.state as { title?: string; content?: string } | null; // 추가
  const [title, setTitle] = useState(state?.title ?? "");
  const [content, setContent] = useState(state?.content ?? "");
  const navigate = useNavigate();
  const [boardGenre, setBoardGenre] = useState("HIPHOP");
  const [boardType] = useState("PLAYLIST_SHARE");
  // 이메일 가져오기
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  const submit = async () => {
    if (!userEmail) return;
    const boardId = await boardApi.createBoard({ title, content, boardType, boardGenre });
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
      <select
        className="mb-3 w-full rounded border px-3 py-2"
        value={boardGenre}
        onChange={(e) => setBoardGenre(e.target.value)}
      >
        <option value="HIPHOP">HIPHOP</option>
        <option value="POP">POP</option>
        <option value="KPOP">KPOP</option>
        <option value="JPOP">JPOP</option>
        <option value="ROCK">ROCK</option>
      </select>
      <textarea
        className="mb-4 w-full min-h-[400px] resize-y rounded border px-4 py-3 leading-normal"
        placeholder="내용"
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button className="rounded bg-indigo-600 px-4 py-2 text-white" onClick={submit}>
        등록
      </button>
    </div>
  );
};

export default BoardWrite;
