import TopBanner from './TopBanner';
import Header from './Header';
import SideNav from './SideNav';
import FooterSearch from './FooterSearch';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      {/* 최상단 배너 */}
      <TopBanner />

      {/* 헤더 */}
      <Header />

      {/* 메인 영역 */}
      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-[1200px] gap-4 px-2">
          {/* 좌측 네비 */}
          <aside className="w-[200px] shrink-0">
            <SideNav />
          </aside>

          {/* 컨텐츠 - Outlet만 사용 */}
          <main className="border-border-base bg-bg-surface flex-1 border p-4 text-white">
            <Outlet />
          </main>
        </div>
      </div>

      {/* 하단 검색 */}
      <FooterSearch />
    </div>
  );
};

export default AppLayout;
