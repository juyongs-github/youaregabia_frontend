interface Props {
  sortBy: string;
  onChange: (sort: string) => void;
}

const BoardSortBar = ({ sortBy, onChange }: Props) => {
  return (
    <div className="flex gap-2 mb-4">
      {[
        { value: "latest", label: "최신순" },
        { value: "views", label: "조회순" },
        { value: "likes", label: "좋아요순" },
      ].map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
            sortBy === option.value
              ? "bg-indigo-600 text-white"
              : "border border-gray-200 text-gray-500 hover:bg-gray-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default BoardSortBar;
