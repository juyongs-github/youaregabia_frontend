import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import CustomEditor from "../../components/ui/CustomEditor";

const FreeBoardUpdate = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [genre, setGenre] = useState("");

  // 1️⃣ 기존 게시글 불러오기
  useEffect(() => {
    if (!boardId || !userEmail) return;

    boardApi.getBoardDetail(Number(boardId)).then((board) => {
      setTitle(board.title);
      setContent(board.content ?? "");
      setGenre(board.boardGenre);
    });
  }, [boardId]);

  // 2️⃣ 수정
  const update = async () => {
    if (!boardId || !userEmail) return;

    await boardApi.updateBoard(Number(boardId), {
      title,
      content,
      boardGenre: genre,
    });

    navigate(`/community/free/${boardId}`);
  };

  // 3️⃣ 삭제
  const remove = async () => {
    if (!boardId || !userEmail) return;

    if (!confirm("정말 삭제할까요?")) return;

    await boardApi.deleteBoard(Number(boardId));
    navigate("/community/free");
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">플레이리스트 공유 수정</h2>

      <input
        className="mb-3 w-full rounded border px-3 py-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        className="mb-3 w-full rounded border px-3 py-2"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
      >
        <option value="KPOP">KPOP</option>
        <option value="POP">POP</option>
        <option value="JPOP">JPOP</option>
        <option value="HIPHOP">HIPHOP</option>
      </select>
      <div className="mb-4">
        <CustomEditor
          onChange={(html) => setContent(html)}
          placeholder="추가로 하고 싶은 말을 입력하세요... (선택)"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={update}
          className="rounded bg-neutral-600 px-2  text-white hover:bg-neutral-500"
        >
          수정
        </button>
        <button onClick={remove} className="rounded bg-red-600 px-2  text-white hover:bg-red-500">
          삭제
        </button>
      </div>
    </div>
  );
};

export default FreeBoardUpdate;
