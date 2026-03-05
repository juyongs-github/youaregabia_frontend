import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaPause, FaPlay, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";
import { GoDotFill } from "react-icons/go";
import type { Song } from "../ui/SongListItem";

interface MusicPlayerProps {
  song: Song;
  setIsPlayerVisible: () => void;
}

// 음악 재생 바 UI
function MusicPlayer({ song, setIsPlayerVisible }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // 재생 중 여부
  const [progress, setProgress] = useState<number>(0); // 곡 재생 진행바(%)
  const [currentTime, setCurrentTime] = useState<number>(0); // 재생 중 시간
  const [duration, setDuration] = useState<number>(0); // 총 시간
  const [volume, setVolume] = useState<number>(50); // 볼륨 크기
  const [isMute, setIsMute] = useState<boolean>(false); // 음소거 상태 여부

  // 시간 변환
  const formatTime = (time: number) => {
    const minute = Math.floor(time / 60);
    const second = Math.floor(time % 60);
    return `${minute}:${String(second).padStart(2, "0")}`;
  };

  // 곡 바뀔 때 마다 정보 로드 후 자동 재생
  useEffect(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.pause();
    audioRef.current.load();
    audioRef.current.play();
  }, [song.previewUrl]);

  return (
    <div className="px-10 pt-10 bg-black border-t border-gray-800 pb-7">
      {/* 오디오 컨트롤 */}
      <audio
        ref={audioRef}
        src={song.previewUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (!audioRef.current) {
            return;
          }

          const currentTime = audioRef.current.currentTime;
          const totalTime = audioRef.current.duration;

          setProgress((currentTime / totalTime) * 100);
          setCurrentTime(currentTime);
        }}
        onLoadedMetadata={() => {
          if (!audioRef.current) {
            return;
          }
          setDuration(audioRef.current.duration);
        }}
      />

      {/* 곡 재생 진행 바 */}
      <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%" }}>
        <Slider
          value={progress}
          onChange={(e, value) => {
            if (!audioRef.current) return;
            setProgress(value);
            audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
          }}
          sx={{
            color: "red",
          }}
        />
      </Box>

      <div className="flex items-center justify-between">
        {/* 곡 재생 / 일시정지 */}
        <div className="flex items-center gap-7">
          <button
            onClick={() => {
              if (!audioRef.current) {
                return;
              }

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
          <div className="text-lg">
            <span>{formatTime(currentTime)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        {/* 가운데 영역 */}
        <div className="flex items-center gap-5">
          {/* 곡 이미지 부분 */}
          <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-orange-500 rounded-2xl">
            <img src={song.imgUrl} alt="" className="object-cover w-full h-full" />
          </div>
          {/* 곡 정보 부분 */}
          <div className="flex flex-col">
            <span className="text-lg font-bold">{song.trackName}</span>
            <div className="flex items-center gap-2 text-base">
              <span>{song.artistName}</span>
              <GoDotFill size={10} />
              <span>{song.genreName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-7">
          {/* 볼륨 부분 */}
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
                sx={{
                  color: "grey",
                }}
              />
            </Box>
          </div>
          {/* 숨기기 버튼 */}
          <button onClick={setIsPlayerVisible}>
            <FaChevronDown size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;
