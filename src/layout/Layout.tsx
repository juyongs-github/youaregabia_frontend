import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

// 공통 Layout
function Layout() {
  return (
    <div className="flex flex-col min-h-screen text-white bg-black">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="w-full mt-20 ml-80">
          <div className="p-32">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
