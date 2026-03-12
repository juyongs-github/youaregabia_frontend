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

interface MusicPlayerProps {
  song: Song;
  setIsPlayerVisible: () => void;
  songs?: Song[];
  songIndex?: number;
  onSongChange?: (index: number) => void;
  onSongEnd?: () => void;
  // 블라인드 추천을 위한 보기 설정
  blind?: boolean;
}

// 음악 재생 바 UI
function MusicPlayer({
  song,
  setIsPlayerVisible,
  songs,
  songIndex,
  onSongChange,
  onSongEnd,
  blind = false,
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
    audioRef.current.volume = volume / 100;
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.load();
    audioRef.current.play();
  }, [song.previewUrl]);

  return (
    <div className="px-10 pt-10 bg-black border-t border-gray-800 pb-7">
      <audio
        ref={audioRef}
        src={song.previewUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          const currentTime = audioRef.current.currentTime;
          const totalTime = audioRef.current.duration;
          setProgress((currentTime / totalTime) * 100);
          setCurrentTime(currentTime);
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

      {/* 진행 바 */}
      <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%" }}>
        <Slider
          value={progress}
          onChange={(e, value) => {
            if (!audioRef.current) return;
            setProgress(value);
            audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
          }}
          sx={{ color: "red" }}
        />
      </Box>

      <div className="flex items-center justify-between">
        {/* 왼쪽: 이전/재생/다음 + 시간 — 항상 동일한 너비 유지 */}
        <div className="flex items-center gap-7">
          {/* 이전 버튼 */}
          <button
            onClick={() => isPlaylist && onSongChange!(songIndex! - 1)}
            disabled={!hasPrev}
            className="disabled:opacity-30"
          >
            <FaStepBackward size={24} color="white" />
          </button>

          {/* 재생/일시정지 */}
          <button
            onClick={() => {
              if (!audioRef.current) return;
              if (isPlaying) {
                audioRef.current.pause();
              } else {
                audioRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? <FaPause size={40} color="white" /> : <FaPlay size={40} color="white" />}
          </button>

          {/* 다음 버튼 */}
          <button
            onClick={() => isPlaylist && onSongChange!(songIndex! + 1)}
            disabled={!hasNext}
            className="disabled:opacity-30"
          >
            <FaStepForward size={24} color="white" />
          </button>

          <div className="text-lg">
            <span>{formatTime(currentTime)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 가운데: 곡 정보 */}
        <div className="flex items-center gap-5">
          {/* 곡 이미지 부분 */}

          {!blind && (
            <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-orange-500 rounded-2xl">
              <img src={song.imgUrl} alt="" className="object-cover w-full h-full" />
            </div>
          )}
          {/* 곡 정보 부분 */}
          {!blind && (
            <div className="flex flex-col">
              <span className="text-lg font-bold">{song.trackName}</span>
              <div className="flex items-center gap-2 text-base">
                <span>{song.artistName}</span>
                <GoDotFill size={10} />
                <span>{song.genreName}</span>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 볼륨 + 닫기 */}
        <div className="flex items-center gap-7">
          <div className="flex items-center w-40 gap-7">
            <button
              onClick={() => {
                if (!audioRef.current) return;
                if (isMute) {
                  audioRef.current.muted = false;
                  setVolume(audioRef.current.volume * 100);
                } else {
                  audioRef.current.muted = true;
                  setVolume(0);
                }
                setIsMute(audioRef.current.muted);
              }}
            >
              {isMute ? (
                <FaVolumeMute size={30} color="white" />
              ) : (
                <FaVolumeUp size={30} color="white" />
              )}
            </button>
            <Box sx={{ width: "100%", display: "flex" }}>
              <Slider
                value={volume}
                onChange={(e, value) => {
                  if (!audioRef.current) return;
                  audioRef.current.volume = value / 100;
                  setVolume(value);
                  setIsMute(value === 0);
                }}
                sx={{ color: "grey" }}
              />
            </Box>
          </div>
          <button onClick={setIsPlayerVisible}>
            <FaChevronDown size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;
