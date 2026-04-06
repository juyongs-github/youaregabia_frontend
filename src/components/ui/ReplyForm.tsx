import { useState } from "react";

interface Props {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
}

const ReplyForm = ({ onSubmit, placeholder = "댓글을 입력하세요..." }: Props) => {
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit(content);
    setContent("");
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1px solid var(--kf-border)",
      }}
    >
      <textarea
        className="w-full bg-transparent border-none outline-none resize-none"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSubmit}
          className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
            boxShadow: "0 8px 20px rgba(109,94,252,0.24)",
          }}
        >
          작성
        </button>
      </div>
    </div>
  );
};

export default ReplyForm;
