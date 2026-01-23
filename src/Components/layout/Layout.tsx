import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

// 공통 Layout
function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="ml-80 mt-20 w-full">
          <div className="p-32">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
