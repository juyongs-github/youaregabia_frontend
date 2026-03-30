import type { TabType } from "../../types/board"; // 또는 인라인 타입

interface Props {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

const BoardTabBar = ({ activeTab, onChange }: Props) => {
  return (
    <div className="mb-4 flex gap-2 border-b border-neutral-700">
      <button
        onClick={() => onChange("ALL")}
        className={`pb-2 px-4 text-sm font-semibold transition-colors ${
          activeTab === "ALL"
            ? "border-b-2 border-indigo-500 text-indigo-400"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        전체글
      </button>
      <button
        onClick={() => onChange("POPULAR")}
        className={`pb-2 px-4 text-sm font-semibold transition-colors ${
          activeTab === "POPULAR"
            ? "border-b-2 border-indigo-500 text-indigo-400"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        인기글
      </button>
    </div>
  );
};

export default BoardTabBar;
