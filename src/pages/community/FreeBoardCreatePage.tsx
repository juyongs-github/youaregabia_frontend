import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardApi } from "../../api/boardApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { refreshPoint } from "../../components/ui/refreshPoint";
import CustomEditor from "../../components/ui/CustomEditor";

const FreeBoardCreatePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();
  // 이메일 가져오
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  const submit = async () => {
    if (!userEmail) return;
    const boardId = await boardApi.createBoard({
      title,
      content,
      boardType: "FREE",
      boardGenre: "FREE",
    });
    refreshPoint();
    navigate(`/community/share/${boardId}`);
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">자유게시판</h2>

      <input
        className="mb-3 w-full rounded border px-3 py-2"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="mb-4">
        <CustomEditor
          onChange={(html) => setContent(html)}
          placeholder="추가로 하고 싶은 말을 입력하세요... (선택)"
        />
      </div>

      <button className="rounded bg-indigo-600 px-4 py-2 text-white" onClick={submit}>
        등록
      </button>
    </div>
  );
};

export default FreeBoardCreatePage;
