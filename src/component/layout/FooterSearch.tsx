const FooterSearch = () => {
  return (
    <div className="border-t border-neutral-700 bg-neutral-900 py-4">
      <div className="mx-auto flex max-w-[1200px] gap-2 px-4 py-3 text-white">
        <select className="border px-2 py-1 text-sm">
          <option>제목</option>
          <option>작성자</option>
        </select>
        <input
          className="flex-1 border px-2 py-1 text-sm"
          placeholder="검색어를 입력하세요"
        />
        <button className="bg-gray-800 px-4 py-1 text-sm text-white">
          검색
        </button>
      </div>
    </div>
  );
};

export default FooterSearch;
