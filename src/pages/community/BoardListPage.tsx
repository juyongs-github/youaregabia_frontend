// pages/BoardListPage.tsx
import { useEffect, useState } from 'react';
import { boardApi } from '../../api/boardApi';
import type { Board, PageResult } from '../../types/board';
import { Link, useNavigate } from 'react-router-dom';
import Pagination from '../../components/ui/Pagination';



const BoardListPage = () => {
  const [pageData, setPageData] = useState<PageResult<Board> | null>(null);
  const navigate = useNavigate();

  // 페이지 데이터 불러오기
  const loadPage = async (page: number) => {
    try {
      const data = await boardApi.getBoards({ page, size: 10 });
      console.log(' 백엔드 응답:', data)
      console.log(' dtoList:', data.dtoList);
      setPageData(data);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
    }
  };

  //  처음 로드
  useEffect(() => {
    loadPage(1);
  }, []);

  //  페이지 변경
  const handlePageChange = (page: number) => {
    loadPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  //  로딩 중
  if (!pageData) {
    return <div className="p-4 text-center">로딩 중...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h2 className="mb-4 text-2xl font-bold">게시판</h2>

      {/* 게시글 목록, 삼항연산자 사용 */}
      <ul className="divide-y divide-neutral-700 rounded border border-neutral-700">
        {pageData.dtoList.length > 0 ? (
          pageData.dtoList.map((board) => (
            <li key={board.boardId}>
              <button
                className="block w-full px-4 py-3 text-left hover:bg-neutral-800"
                onClick={() => navigate(`/community/share/${board.boardId}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-indigo-400">{board.title}</span>
                  <span className="text-sm text-gray-500">
                    {board.writer}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(board.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </button>
            </li>
          ))
        ) : (
          <li className="px-4 py-8 text-center text-gray-500">
            게시글이 없습니다
          </li>
        )}
      </ul>

      {/* 페이지네이션 */}
      {pageData.pageNumList.length > 0 && (
        <div className="mt-6">
          <Pagination
            pageNumList={pageData.pageNumList}
            current={pageData.current}
            prev={pageData.prev}
            next={pageData.next}
            prevPage={pageData.prevPage}
            nextPage={pageData.nextPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 페이지 정보 */}
      <div className="mt-4 text-center text-sm text-gray-400">
        전체 {pageData.totalCount}개 · {pageData.current} 페이지
      </div>

      {/* 글쓰기 버튼 */}
      <div className="mt-6 text-center">
        <button
          className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-500"
          onClick={() => navigate('/community/share/new')}
        >
          글쓰기
        </button>
      </div>
    </div>
  );
};


export default BoardListPage;
