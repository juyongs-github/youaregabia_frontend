import { Link } from "react-router-dom";

function NavBar() {
  return (
    <nav className="nav">
      <Link to="/">홈</Link>
      <Link to="/mypage">마이페이지</Link>
      <Link to="/playlist">플레이리스트</Link>
      <Link to="/comunity">커뮤니티</Link>
    </nav>
  );
}

export default NavBar;
