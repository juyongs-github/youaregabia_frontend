import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* 최상단 배너 */}
      {/* <TopBanner /> */}

      {/* 헤더 */}
      <Header />

      {/* 메인 영역 */}
      <div className="flex justify-center flex-1">
        <div className="flex w-full max-w-[1200px] gap-4 px-2">
          {/* 좌측 네비 */}
          <aside className="w-[200px] shrink-0">
            <Sidebar />
          </aside>

          {/* 컨텐츠 - Outlet만 사용 */}
          <main className="flex-1 p-4 text-white border border-border-base bg-bg-surface">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
