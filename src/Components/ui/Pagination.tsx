interface PaginationProps {
  pageNumList: number[];
  current: number;
  prev: boolean;
  next: boolean;
  prevPage?: number;
  nextPage?: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  pageNumList,
  current,
  prev,
  next,
  prevPage,
  nextPage,
  onPageChange,
}: PaginationProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {prev && (
        <button
          onClick={() => onPageChange(prevPage!)}
          className="rounded px-3 py-1 text-sm hover:bg-neutral-700"
        >
          이전
        </button>
      )}

      {pageNumList.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`rounded px-3 py-1 text-sm ${
            current === page
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-neutral-700'
          }`}
        >
          {page}
        </button>
      ))}

      {next && (
        <button
          onClick={() => onPageChange(nextPage!)}
          className="rounded px-3 py-1 text-sm hover:bg-neutral-700"
        >
          다음
        </button>
      )}
    </div>
  );
};

export default Pagination;