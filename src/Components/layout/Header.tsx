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
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import { logout } from "../../store/authSlice";

function Header() {
  // Redux에서 로그인 상태 가져오기
  const isLogin = useSelector((state: RootState) => state.auth.isLoggedIn);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate("/login");
  };

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
    <header className="flex items-center justify-between w-full h-16 px-8 bg-black border-b border-white/10">
      <div className="flex items-center flex-shrink-0 gap-8">
        <button className="flex items-center gap-3" onClick={() => goPage("/home")}>
          <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full">
            <FaHeadphones size={20} color="white" />
          </div>
          <span className="text-2xl font-semibold">GAP Music</span>
        </button>
      </div>

      <div className="flex items-center flex-1 max-w-xl px-10">
        <div className="relative w-full group">
          <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-4 top-1/2 group-focus-within:text-white" />
          <input
            type="text"
            placeholder="어떤 콘텐츠를 감상하고 싶으세요?"
            className="w-full py-2.5 pl-12 pr-10 text-sm text-white transition-all bg-gray-800/50 border border-transparent rounded-full focus:bg-gray-800 focus:border-gray-600 outline-none placeholder:text-gray-500"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute text-gray-400 -translate-y-1/2 right-4 top-1/2 hover:text-white"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* 로그인 버튼이 있던 자리를 삭제했습니다.
          이제 이 Layout에 들어왔다는 것 자체가 로그인 상태임을 의미하므로
          조건문 없이 바로 프로필 아바타를 보여줍니다.
      */}
      <div className="flex items-center gap-6">
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? "account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <Avatar sx={{ width: 35, height: 35, bgcolor: "#3b82f6" }}>U</Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          slotProps={{
            paper: {
              style: {
                backgroundColor: "#2c2c2c",
                marginTop: "8px",
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
              "&:hover": { backgroundColor: "#3d3d3d" },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <BiSolidUser size={20} />
            </ListItemIcon>
            <ListItemText>내 프로필</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{
              color: "white",
              fontWeight: "bold",
              py: 1.5,
              "&:hover": { backgroundColor: "#3d3d3d" },
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <RiLogoutBoxRLine size={20} />
            </ListItemIcon>
            <ListItemText>로그아웃</ListItemText>
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
}

export default Header;
