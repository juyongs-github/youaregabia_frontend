import React from "react";
import { GoDotFill } from "react-icons/go";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { FaHeadphones, FaMusic } from "react-icons/fa";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate } from "react-router-dom";

export interface Song {
  id: number;
  trackName: string;
  artistName: string;
  genreName: string;
  imgUrl: string;
  previewUrl: string;
  durationMs: number;
  releaseDate: string;
}

interface SongProps {
  song: Song;
  setSelectSong?: (song: Song) => void;
}

// 곡 리스트 UI
function SongListItem({ song, setSelectSong }: SongProps) {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="flex items-center justify-between p-5 border-b border-gray-800">
      <div className="flex items-center gap-7">
        {/* 곡 이미지 부분 */}
        <div className="flex items-center justify-center w-24 h-24 overflow-hidden shrink-0 bg-slate-500 rounded-2xl">
          {song.imgUrl ? (
            <img src={song.imgUrl} alt="" className="object-cover w-full h-full" />
          ) : (
            <FaMusic size={40} className="text-white opacity-60" />
          )}
        </div>
        {/* 곡 정보 부분 */}
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold">{song.trackName}</span>
          <div className="flex items-center gap-2 text-lg">
            <span>{song.artistName}</span>
            <GoDotFill size={10} />
            <span>{song.genreName}</span>
          </div>
        </div>
      </div>
      {/* 더보기 부분 */}
      <div>
        <IconButton onClick={handleClick}>
          <MoreVertIcon
            sx={{
              color: "white",
              width: "2rem",
              height: "2rem",
            }}
          />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          slotProps={{
            paper: {
              style: {
                backgroundColor: "#2c2c2c",
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setSelectSong?.(song);
              handleClose();
            }}
            sx={{
              color: "white",
              fontWeight: "bold",
              py: 1.5,
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <FaHeadphones size={20} />
            </ListItemIcon>
            <ListItemText>미리듣기</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/recommend/result", {
                state: {
                  trackName: song.trackName,
                  artistName: song.artistName,
                },
              });
            }}
            sx={{
              color: "white",
              fontWeight: "bold",
              py: 1.5,
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <FaMusic size={20} />
            </ListItemIcon>
            <ListItemText>유사 곡 추천</ListItemText>
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}

export default SongListItem;
