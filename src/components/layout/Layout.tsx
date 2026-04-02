import { useState } from "react";
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="kf-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div style={{ display: "flex" }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="kf-main-content">
          <div className="kf-main-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
