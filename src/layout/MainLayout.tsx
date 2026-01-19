import { Outlet } from "react-router-dom";
import Header from "./Header";
import NavBar from "./NavBar";

function MainLayout() {
  return (
    <div className="layout">
      <NavBar />

      <div className="right">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
