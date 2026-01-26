import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

// 공통 Layout
function Layout() {
  return (
    <div className="flex flex-col min-h-screen text-white bg-black">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-80 mt-20 overflow-y-auto h-[calc(100vh-5rem)]">
          <div className="flex justify-center">
            <div className="w-full p-20 max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
