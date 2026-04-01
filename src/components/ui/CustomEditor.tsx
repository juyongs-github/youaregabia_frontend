import { useEffect, useRef } from "react";

interface Props {
  onChange: (html: string) => void;
  placeholder?: string;
  initialValue?: string;
}

const CustomEditor = ({ onChange, placeholder: _placeholder, initialValue }: Props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  // 커서 위치를 저장할 Ref
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && initialValue && editorRef.current.innerHTML === "") {
      editorRef.current.innerHTML = initialValue;
    }
  }, [initialValue]);

  // 커서 위치 저장 함수
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      selectionRef.current = sel.getRangeAt(0);
    }
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();

    // 저장된 커서 위치가 있다면 복구
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
    saveSelection(); // 내용 변경 시마다 커서 위치 업데이트
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Tag = reader.result as string;
      // 직접 img 태그를 삽입하는 방식이 더 확실합니다.
      const imgHtml = `<img src="${base64Tag}" style="max-width: 100%; height: auto;" /><br/>`;
      exec("insertHTML", imgHtml);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // 동일 파일 재선택 가능하도록 초기화
  };

  return (
    <div className="rounded border border-neutral-700 overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1 bg-neutral-800 border-b border-neutral-700">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
          className="px-2 py-1 rounded font-bold text-white hover:bg-neutral-600"
        >
          B
        </button>

        <div className="w-px h-5 bg-neutral-600 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("foreColor", "#ffffff");
          }}
          className="w-6 h-6 rounded-full border-2 border-neutral-500 bg-white"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("foreColor", "#000000");
          }}
          className="w-6 h-6 rounded-full border-2 border-neutral-500 bg-black"
        />

        <div className="w-px h-5 bg-neutral-600 mx-1" />

        <label
          className="px-2 py-1 rounded text-sm text-white hover:bg-neutral-600 cursor-pointer"
          onMouseDown={saveSelection} // 클릭하는 순간 커서 위치 저장
        >
          🖼
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onBlur={saveSelection} // 포커스가 나갈 때 커서 위치 저장
        className="min-h-[200px] px-4 py-3 text-white bg-neutral-900 focus:outline-none"
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
};

export default CustomEditor;
