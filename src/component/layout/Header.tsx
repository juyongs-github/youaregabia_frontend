import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { FaHeadphones, FaSearch, FaTimes } from "react-icons/fa";
import { BiSolidUser } from "react-icons/bi";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";

function Header() {
  const isLogin = true; // 로그인 상태 -> 추후 수정 필요!
  const navigate = useNavigate();
  const location = useLocation();

  const goPage = (path: string) => {
    if (location.pathname === path) {
      window.location.reload();
    } else {
      navigate(path);
    }
  };

  const [searchValue, setSearchValue] = useState<string>("");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-10 py-5 bg-black border-b border-gray-800 gap-7">
      {/* 로고 부분 */}
      <div className="flex items-center flex-shrink-0 gap-8">
        <button className="flex items-center gap-3" onClick={() => goPage("/")}>
          <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full">
            <FaHeadphones size={20} color="white" />
          </div>
          <span className="text-2xl font-semibold">GAP Music</span>
        </button>
      </div>
      {/* 검색바 부분 */}
      <div className="relative flex-shrink-0">
        <input
          type="text"
          placeholder="검색"
          value={searchValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (!searchValue.trim()) {
                alert("검색어를 입력 해주세요.");
                return;
              }

              navigate(`/search?q=${encodeURIComponent(searchValue)}`);
            }
          }}
          className="px-16 py-3 text-white bg-gray-800 rounded-full w-[50rem] focus:outline-none focus:ring-2 focus:ring-white"
        />
        <FaSearch className="absolute text-gray-400 left-6 top-3.5" size={20} />
        {searchValue && (
          <button
            onClick={() => setSearchValue("")}
            className="absolute text-gray-400 right-6 top-3.5 hover:text-white transition-colors"
          >
            <FaTimes size={20} />
          </button>
        )}
      </div>
      {/* 유저 프로필 부분 */}
      {isLogin ? (
        <div className="flex-shrink-0">
          <IconButton onClick={handleClick}>
            <Avatar alt="User" src="/profile.jpg" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              paper: {
                style: {
                  backgroundColor: "#2c2c2c",
                },
              },
            }}
          >
            <MenuItem
              onClick={() => goPage("/profile/me")}
              sx={{
                color: "white",
                fontWeight: "bold",
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <BiSolidUser size={20} />
              </ListItemIcon>
              <ListItemText>내 프로필</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => goPage("/logout")}
              sx={{
                color: "white",
                fontWeight: "bold",
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <RiLogoutBoxRLine size={20} />
              </ListItemIcon>
              <ListItemText>로그아웃</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      ) : (
        <button
          className="flex-shrink-0 px-6 py-2 font-bold text-gray-200 transition-colors bg-gray-700 rounded-full hover:bg-gray-600"
          onClick={() => goPage("/login")}
        >
          로그인
        </button>
      )}
    </header>
  );
}

export default Header;
