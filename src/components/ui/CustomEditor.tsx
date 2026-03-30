import { useEffect, useRef } from "react";

interface Props {
  onChange: (html: string) => void;
  placeholder?: string;
  initialValue?: string;
}

const CustomEditor = ({ onChange, placeholder, initialValue }: Props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && initialValue && editorRef.current.innerHTML === "") {
      editorRef.current.innerHTML = initialValue;
    }
  }, [initialValue]);

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

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload/image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const imageUrl = `${import.meta.env.VITE_API_BASE_URL}${data.url}`;

      const imgHtml = `<img src="${imageUrl}" style="max-width: 100%; height: auto;" /><br/>`;
      exec("insertHTML", imgHtml);
    } catch (err) {
      console.error("이미지 업로드 실패", err);
      alert("이미지 업로드에 실패했습니다.");
    }

    e.target.value = "";
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
          onMouseDown={saveSelection}
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
        onBlur={saveSelection}
        data-placeholder={placeholder || "내용을 입력하세요."}
        className="min-h-[200px] px-4 py-3 text-white bg-neutral-900 focus:outline-none"
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
};

export default CustomEditor;
