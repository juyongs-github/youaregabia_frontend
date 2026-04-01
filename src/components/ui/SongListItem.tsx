import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { FaHeadphones, FaInfoCircle, FaMusic, FaPlay } from "react-icons/fa";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate } from "react-router-dom";
import SongDetailModal from "./SongDetailModal";
import { usePlayer } from "../../contexts/PlayerContext";
import "../../styles/SongListItem.kfandom.css";

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

function SongListItem({ song, setSelectSong }: SongProps) {
  const navigate = useNavigate();
  const { stop } = usePlayer();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  return (
    <div className="kf-song-item" onClick={() => { if (!open) setSelectSong?.(song); }} style={{ cursor: setSelectSong ? "pointer" : "default" }}>
      <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
        {/* 앨범 이미지 */}
        <div className="kf-song-item__img-wrap">
          {song.imgUrl ? (
            <img src={song.imgUrl} alt="" />
          ) : (
            <FaMusic size={22} style={{ color: "#9199ad" }} />
          )}
          <div className="kf-song-item__play-btn">
            <div className="kf-song-item__play-icon">
              <FaPlay size={11} style={{ marginLeft: 2 }} />
            </div>
          </div>
        </div>

        {/* 곡 정보 */}
        <div className="kf-song-item__info">
          <span className="kf-song-item__title">{song.trackName}</span>
          <div className="kf-song-item__meta">
            <span>{song.artistName}</span>
            <span className="kf-song-item__meta-dot" />
            <span>{song.genreName}</span>
          </div>
        </div>
      </div>

      {/* 더보기 */}
      <div>
        <IconButton onClick={handleClick} size="small" className="kf-song-item__more-btn">
          <MoreVertIcon sx={{ color: "inherit", width: "1.4rem", height: "1.4rem" }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          slotProps={{
            paper: {
              style: {
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(92,103,151,0.14)",
                borderRadius: "16px",
                boxShadow: "0 16px 40px rgba(80,90,140,0.14)",
              },
            },
          }}
        >
          <MenuItem
            onClick={(e) => { e.stopPropagation(); setSelectSong?.(song); handleClose(); }}
            sx={{ color: "#22283a", fontWeight: 700, py: 1.2, borderRadius: "10px", mx: 0.5 }}
          >
            <ListItemIcon sx={{ color: "#6d5efc" }}>
              <FaHeadphones size={18} />
            </ListItemIcon>
            <ListItemText>미리듣기</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              stop();
              navigate("/recommend/result", {
                state: { trackName: song.trackName, artistName: song.artistName, coverImageUrl: song.imgUrl, previewUrl: song.previewUrl },
              });
            }}
            sx={{ color: "#22283a", fontWeight: 700, py: 1.2, borderRadius: "10px", mx: 0.5 }}
          >
            <ListItemIcon sx={{ color: "#ff5ca8" }}>
              <FaMusic size={18} />
            </ListItemIcon>
            <ListItemText>유사 곡 추천</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => { setIsDetailOpen(true); handleClose(); }}
            sx={{ color: "#22283a", fontWeight: 700, py: 1.2, borderRadius: "10px", mx: 0.5 }}
          >
            <ListItemIcon sx={{ color: "#38c7aa" }}>
              <FaInfoCircle size={18} />
            </ListItemIcon>
            <ListItemText>상세보기</ListItemText>
          </MenuItem>
        </Menu>
      </div>

      {isDetailOpen && <SongDetailModal song={song} onClose={() => setIsDetailOpen(false)} />}
    </div>
  );
}

export default SongListItem;
