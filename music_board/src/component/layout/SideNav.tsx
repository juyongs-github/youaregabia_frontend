const SideNav = () => {
  return (
    <aside className="w-56 border-r border-neutral-700 bg-neutral-900 px-4 py-6">
      <ul className="space-y-2 text-sm">
        <li className="font-semibold">전체글보기</li>

        <li className="mt-4 text-gray-400">카테고리</li>
        <li className="cursor-pointer hover:text-white">공지</li>
        <li className="cursor-pointer hover:text-white">자유</li>
        <li className="cursor-pointer hover:text-white">질문</li>
      </ul>
    </aside>
  );
};

export default SideNav;
