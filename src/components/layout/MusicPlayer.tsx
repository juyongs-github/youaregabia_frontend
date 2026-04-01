import { useEffect, useRef, useState } from "react";
import {
  FaChevronDown,
  FaPause,
  FaPlay,
  FaVolumeMute,
  FaVolumeUp,
  FaStepBackward,
  FaStepForward,
} from "react-icons/fa";
import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";
import { GoDotFill } from "react-icons/go";
import type { Song } from "../ui/SongListItem";
import "../../styles/musicplayer-kfandom.css";

interface MusicPlayerProps {
  song: Song;
  setIsPlayerVisible: () => void;
  songs?: Song[];
  songIndex?: number;
  onSongChange?: (index: number) => void;
  onSongEnd?: () => void;
  blind?: boolean;
  externalPaused?: boolean;
}

function MusicPlayer({
  song,
  setIsPlayerVisible,
  songs,
  songIndex,
  onSongChange,
  onSongEnd,
  blind = false,
  externalPaused,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(50);
  const [isMute, setIsMute] = useState<boolean>(false);

  const isPlaylist = !!(songs && onSongChange && songIndex != null);
  const hasPrev = isPlaylist && songIndex! > 0;
  const hasNext = isPlaylist && songIndex! < songs!.length - 1;

  const formatTime = (time: number) => {
    const minute = Math.floor(time / 60);
    const second = Math.floor(time % 60);
    return `${minute}:${String(second).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (externalPaused) audioRef.current.pause();
  }, [externalPaused]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.load();
    audioRef.current.play();
  }, [song]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (_e: any, value: any) => {
    if (!audioRef.current) return;
    setProgress(value);
    audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
  };

  const handleVolume = (_e: any, value: any) => {
    if (!audioRef.current) return;
    audioRef.current.volume = value / 100;
    setVolume(value);
    setIsMute(value === 0);
  };

  const handleMute = () => {
    if (!audioRef.current) return;
    if (isMute) {
      audioRef.current.muted = false;
      setVolume(audioRef.current.volume * 100);
    } else {
      audioRef.current.muted = true;
      setVolume(0);
    }
    setIsMute(audioRef.current.muted);
  };

  return (
    <div className="kf-player-wrap">
      <audio
        ref={audioRef}
        src={song.previewUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          const ct = audioRef.current.currentTime;
          const total = audioRef.current.duration;
          setProgress((ct / total) * 100);
          setCurrentTime(ct);
        }}
        onLoadedMetadata={() => {
          if (!audioRef.current) return;
          setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          if (hasNext) {
            onSongChange!(songIndex! + 1);
          } else {
            onSongEnd?.();
          }
        }}
      />

      <div className="kf-player">
        {/* Progress bar */}
        <div className="kf-player__progress">
          <Box sx={{ width: "100%" }}>
            <Slider
              value={progress}
              onChange={handleSeek}
              size="small"
              sx={{
                color: "#6d5efc",
                height: 3,
                padding: "4px 0",
                "& .MuiSlider-thumb": {
                  width: 10,
                  height: 10,
                  "&:hover": { boxShadow: "0 0 0 6px rgba(109,94,252,0.16)" },
                },
                "& .MuiSlider-track": { border: "none" },
                "& .MuiSlider-rail": { opacity: 0.2, backgroundColor: "#8e97ab" },
              }}
            />
          </Box>
        </div>

        {/* Song info */}
        <div className="kf-player__info">
          {!blind && (
            <div className="kf-player__thumb">
              <img src={song.imgUrl} alt="" />
            </div>
          )}
          {!blind && (
            <div className="kf-player__meta">
              <div className="kf-player__title">{song.trackName}</div>
              <div className="kf-player__sub">
                {song.artistName}
                <GoDotFill size={8} style={{ display: "inline", margin: "0 4px", verticalAlign: "middle" }} />
                {song.genreName}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="kf-player__controls">
          <button
            className="kf-player__btn"
            onClick={() => isPlaylist && onSongChange!(songIndex! - 1)}
            disabled={!hasPrev}
          >
            <FaStepBackward size={18} />
          </button>

          <button className="kf-player__playBtn" onClick={handlePlayPause}>
            {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
          </button>

          <button
            className="kf-player__btn"
            onClick={() => isPlaylist && onSongChange!(songIndex! + 1)}
            disabled={!hasNext}
          >
            <FaStepForward size={18} />
          </button>

          <div className="kf-player__time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Volume */}
        <div className="kf-player__volume">
          <button className="kf-player__btn" onClick={handleMute}>
            {isMute ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
          </button>
          <Box sx={{ width: 90, display: "flex" }}>
            <Slider
              value={volume}
              onChange={handleVolume}
              size="small"
              sx={{
                color: "#8e97ab",
                height: 3,
                "& .MuiSlider-thumb": { width: 10, height: 10 },
                "& .MuiSlider-rail": { opacity: 0.2 },
              }}
            />
          </Box>
        </div>

        {/* Close */}
        <button className="kf-player__closeBtn" onClick={setIsPlayerVisible}>
          <FaChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}

export default MusicPlayer;
