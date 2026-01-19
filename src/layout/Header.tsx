import { FiSearch } from "react-icons/fi";

function Header() {
  return (
    <header className="header">
      <div className="search">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="노래 제목, 아티스트 명 검색" />
      </div>
    </header>
  );
}

export default Header;
