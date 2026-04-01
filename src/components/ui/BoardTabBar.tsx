import type { TabType } from "../../types/board"; // 또는 인라인 타입

interface Props {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

const BoardTabBar = ({ activeTab, onChange }: Props) => {
  return (
    <div className="mb-4 flex gap-2 border-b border-gray-200">
      <button
        onClick={() => onChange("ALL")}
        className={`pb-2 px-4 text-sm font-semibold transition-colors ${
          activeTab === "ALL"
            ? "border-b-2 border-indigo-500 text-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        전체글
      </button>
      <button
        onClick={() => onChange("POPULAR")}
        className={`pb-2 px-4 text-sm font-semibold transition-colors ${
          activeTab === "POPULAR"
            ? "border-b-2 border-indigo-500 text-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        인기글
      </button>
    </div>
  );
};

export default BoardTabBar;
