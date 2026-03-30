import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{
          flex: 1,
          marginLeft: 320,
          paddingTop: 96,
          height: "100vh",
          overflowY: "auto",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 80px" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
