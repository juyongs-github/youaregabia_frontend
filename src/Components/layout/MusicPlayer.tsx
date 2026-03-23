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
import { spotifyApi } from "../../api/spotifyApi";

// ✅ Spotify SDK 타입 선언
declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface MusicPlayerProps {
  song: Song;
  setIsPlayerVisible: () => void;
  songs?: Song[];
  songIndex?: number;
  onSongChange?: (index: number) => void;
  onSongEnd?: () => void;
  blind?: boolean;
  fullPlay?: boolean; // ✅ 전곡 재생 모드
}

function MusicPlayer({
  song,
  setIsPlayerVisible,
  songs,
  songIndex,
  onSongChange,
  onSongEnd,
  blind = false,
  fullPlay = false,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(50);
  const [isMute, setIsMute] = useState<boolean>(false);

  // ✅ Spotify SDK 관련 상태
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [sdkReady, setSdkReady] = useState<boolean>(false);
  const spotifyPlayerRef = useRef<any>(null);

  const isPlaylist = !!(songs && onSongChange && songIndex != null);
  const hasPrev = isPlaylist && songIndex! > 0;
  const hasNext = isPlaylist && songIndex! < songs!.length - 1;

  const formatTime = (time: number) => {
    const minute = Math.floor(time / 60);
    const second = Math.floor(time % 60);
    return `${minute}:${String(second).padStart(2, "0")}`;
  };

  // ✅ Spotify SDK 초기화 (fullPlay 모드일 때만 1회 실행)
  useEffect(() => {
    if (!fullPlay) return;

    const initSpotify = async () => {
      console.log("Spotify init start", fullPlay);

      try {
        const res = await spotifyApi.getToken();
        const accessToken = res.data.accessToken;

        // SDK 스크립트 중복 로드 방지
        if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
          const script = document.createElement("script");
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          document.body.appendChild(script);
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
          const player = new window.Spotify.Player({
            name: "GAP Music Player",
            getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
            volume: volume / 100,
          });

          // 재생 상태 감지
          player.addListener("player_state_changed", (state: any) => {
            if (!state) return;
            setIsPlaying(!state.paused);
            setProgress((state.position / state.duration) * 100);
            setCurrentTime(state.position / 1000);
            setDuration(state.duration / 1000);

            // 곡 끝났을 때 다음 곡으로
            if (state.position === 0 && state.paused && isPlaylist) {
              if (hasNext) {
                onSongChange!(songIndex! + 1);
              } else {
                onSongEnd?.();
              }
            }
          });

          // 디바이스 연결 완료
          player.addListener("ready", ({ device_id }: { device_id: string }) => {
            console.log("Spotify Player 준비 완료, device_id:", device_id);
            setDeviceId(device_id);
            setSdkReady(true);
          });

          player.addListener("not_ready", () => {
            console.log("Spotify Player 연결 끊김");
            setSdkReady(false);
          });

          player.connect();
          setSpotifyPlayer(player);
          spotifyPlayerRef.current = player;
        };

        // SDK가 이미 로드된 경우 직접 실행
        if (window.Spotify) {
          window.onSpotifyWebPlaybackSDKReady();
        }
      } catch (e) {
        console.error("Spotify SDK 초기화 실패:", e);
      }
    };

    initSpotify();

    // 컴포넌트 언마운트 시 플레이어 해제
    return () => {
      spotifyPlayerRef.current?.disconnect();
    };
  }, [fullPlay]);

  // ✅ 곡 변경 시 재생
  useEffect(() => {
    if (fullPlay) {
      // Spotify 전곡 재생
      if (!sdkReady || !deviceId) return;

      const playSpotify = async () => {
        try {
          const trackRes = await spotifyApi.getSpotifyTrackId(song.trackName, song.artistName);
          const spotifyId = trackRes.data.spotifyId;
          if (!spotifyId) {
            console.error("Spotify ID 없음 - 재생 불가");
            return;
          }

          const tokenRes = await spotifyApi.getToken();
          const accessToken = tokenRes.data.accessToken;

          // ✅ 1단계: 디바이스 먼저 활성화
          await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              device_ids: [deviceId],
              play: false,
            }),
          });

          // ✅ 2단계: 잠깐 대기 후 재생
          await new Promise((resolve) => setTimeout(resolve, 500));

          // ✅ 3단계: 재생 요청
          await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [`spotify:track:${spotifyId}`],
            }),
          });
        } catch (e) {
          console.error("Spotify 재생 실패:", e);
        }
      };

      playSpotify();
    } else {
      // iTunes 미리듣기 재생
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [song, sdkReady, deviceId, fullPlay]);

  // 볼륨 초기화
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
  }, []);

  // ✅ 재생/일시정지
  const handlePlayPause = () => {
    if (fullPlay && spotifyPlayer) {
      spotifyPlayer.togglePlay();
    } else {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // ✅ 탐색
  const handleSeek = (_e: any, value: any) => {
    if (fullPlay && spotifyPlayer) {
      spotifyPlayer.seek((value / 100) * duration * 1000);
      setProgress(value);
    } else {
      if (!audioRef.current) return;
      setProgress(value);
      audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
    }
  };

  // ✅ 볼륨
  const handleVolume = (_e: any, value: any) => {
    if (fullPlay && spotifyPlayer) {
      spotifyPlayer.setVolume(value / 100);
    } else {
      if (!audioRef.current) return;
      audioRef.current.volume = value / 100;
    }
    setVolume(value);
    setIsMute(value === 0);
  };

  // ✅ 뮤트
  const handleMute = () => {
    if (fullPlay && spotifyPlayer) {
      if (isMute) {
        spotifyPlayer.setVolume(volume / 100);
      } else {
        spotifyPlayer.setVolume(0);
      }
      setIsMute(!isMute);
    } else {
      if (!audioRef.current) return;
      if (isMute) {
        audioRef.current.muted = false;
        setVolume(audioRef.current.volume * 100);
      } else {
        audioRef.current.muted = true;
        setVolume(0);
      }
      setIsMute(audioRef.current.muted);
    }
  };

  return (
    <div className="px-10 pt-10 bg-black border-t border-gray-800 pb-7">
      {/* ✅ 미리듣기 모드일 때만 audio 태그 사용 */}
      {!fullPlay && (
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
      )}

      {/* 진행 바 */}
      <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%" }}>
        <Slider value={progress} onChange={handleSeek} sx={{ color: "red" }} />
      </Box>

      <div className="flex items-center justify-between">
        {/* 왼쪽: 이전/재생/다음 + 시간 */}
        <div className="flex items-center gap-7">
          <button
            onClick={() => isPlaylist && onSongChange!(songIndex! - 1)}
            disabled={!hasPrev}
            className="disabled:opacity-30"
          >
            <FaStepBackward size={24} color="white" />
          </button>

          <button onClick={handlePlayPause}>
            {isPlaying ? <FaPause size={40} color="white" /> : <FaPlay size={40} color="white" />}
          </button>

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
          {!blind && (
            <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-orange-500 rounded-2xl">
              <img src={song.imgUrl} alt="" className="object-cover w-full h-full" />
            </div>
          )}
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
            <button onClick={handleMute}>
              {isMute ? (
                <FaVolumeMute size={30} color="white" />
              ) : (
                <FaVolumeUp size={30} color="white" />
              )}
            </button>
            <Box sx={{ width: "100%", display: "flex" }}>
              <Slider value={volume} onChange={handleVolume} sx={{ color: "grey" }} />
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
