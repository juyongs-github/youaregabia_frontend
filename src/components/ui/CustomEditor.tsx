import { useEffect, useRef } from "react";
import Toast from "./Toast";
import { useToast } from "../../hooks/useToast";

interface Props {
  onChange: (html: string) => void;
  placeholder?: string;
  initialValue?: string;
}

const CustomEditor = ({ onChange, placeholder, initialValue }: Props) => {
  const { toast, showToast, closeToast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && initialValue && editorRef.current.innerHTML === "") {
      editorRef.current.innerHTML = initialValue;
    }
  }, [initialValue]);

  // 커서 위치 저장 및 복구 로직
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      selectionRef.current = sel.getRangeAt(0);
    }
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (selectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(selectionRef.current);
    }
    document.execCommand(command, false, value);
    handleChange();
  };

  const handleChange = () => {
    onChange(editorRef.current?.innerHTML ?? "");
    saveSelection();
  };

  // ✅ 서버 업로드(URL) 방식의 이미지 핸들러
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 서버에 이미지 업로드 요청
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload/image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      // 서버에서 반환한 상대 경로를 절대 경로 URL로 조합
      const imageUrl = `${import.meta.env.VITE_API_BASE_URL}${data.url}`;

      // URL을 사용하여 에디터에 이미지 삽입 (HTML 구조로 삽입하여 스타일 제어)
      const imgHtml = `<img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0;" /><br/>`;
      exec("insertHTML", imgHtml);
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      showToast("이미지 업로드에 실패했습니다.", "error");
    } finally {
      e.target.value = ""; // 동일 파일 재선택 가능하도록 초기화
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <div className="rounded-[24px] border border-white/80 bg-white/50 backdrop-blur-xl overflow-hidden shadow-sm transition-all focus-within:shadow-md focus-within:border-[#6d5efc]/30">
      {/* 툴바 영역 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/60 border-b border-white/80">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl font-black text-[#2f3863] hover:bg-[#6d5efc] hover:text-black transition-all active:scale-95"
        >
          B
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* 텍스트 컬러 선택 (밝은 테마에 맞는 컬러) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("foreColor", "#2f3863");
          }}
          className="w-7 h-7 rounded-full border-2 border-white shadow-sm bg-[#2f3863] hover:scale-110 transition-transform"
          title="기본색"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("foreColor", "#6d5efc");
          }}
          className="w-7 h-7 rounded-full border-2 border-white shadow-sm bg-[#6d5efc] hover:scale-110 transition-transform"
          title="포인트색"
        />

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* 이미지 업로드 버튼 */}
        <label
          className="w-10 h-10 flex items-center justify-center rounded-xl text-xl hover:bg-slate-100 cursor-pointer transition-all active:scale-95 shadow-sm bg-white border border-slate-100"
          onMouseDown={saveSelection}
        >
          🖼️
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
      </div>

      {/* 에디터 입력 영역 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onBlur={saveSelection}
        className="min-h-[250px] px-6 py-5 text-[#2f3863] text-base leading-relaxed focus:outline-none bg-transparent"
        style={{ whiteSpace: "pre-wrap" }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          cursor: text;
        }
      `}</style>
      </div>
    </>
  );
};

export default CustomEditor;
