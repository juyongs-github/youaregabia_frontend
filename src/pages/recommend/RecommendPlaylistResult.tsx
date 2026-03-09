import { useEffect, useState } from "react";
import type { Song } from "../../components/ui/SongListItem";
import api from "../../api/axios";
import { FaMusic, FaSave } from "react-icons/fa";
import SongListItem from "../../components/ui/SongListItem";
import Spinner from "../../components/ui/Spinner";
import { IoWarning } from "react-icons/io5";
import { useLocation } from "react-router-dom";
import { HiPencil } from "react-icons/hi2";
import { BsQuestionCircleFill } from "react-icons/bs";
import { RiPlayList2Fill } from "react-icons/ri";
import MusicPlayer from "../../components/layout/MusicPlayer";
import { RiResetLeftFill } from "react-icons/ri";

import Checkbox from "@mui/material/Checkbox";
import { playlistApi } from "../../api/playlistApi";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import { useSelector } from "react-redux";
import PlaylistReviewModal from "../../Components/ui/PlaylistReviewModal";

// 플레이리스트 추천 결과 페이지
function RecommendPlaylistResult() {
  const location = useLocation();
  const { trackName, artistName } = location.state || {};

  const [data, setData] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // 수정한 것 --
  const email = useSelector((state: any) => state.auth.user?.email);

  // 곡 정보 UI에서 선택한 곡(미리듣기, 유사 곡 추천)
  const [selectSong, setSelectSong] = useState<Song | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState<boolean>(false);

  // 리뷰 작성 Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [checkedSongIds, setCheckedSongIds] = useState<number[]>([]);
  const isAllChecked = data.length > 0 && checkedSongIds.length === data.length;
  const isIndeterminate = checkedSongIds.length > 0 && !isAllChecked;

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.get("/api/recommend", {
        params: {
          trackName: trackName,
          artistName: artistName,
        },
      });

      setData(response.data || []);
    } catch (error) {
      console.error(error);
      setData([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {/* 로딩 중인 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-48">
          <Spinner />
        </div>
      )}

      {/* 에러인 상태 */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <div className="flex flex-col items-center justify-center gap-4">
            <IoWarning size={60} />
            <p className="text-lg font-bold text-white">추천 중 문제가 발생 했습니다.</p>
          </div>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-5 py-3 font-semibold text-white transition-colors bg-red-600 rounded-full hover:bg-red-700"
          >
            <RiResetLeftFill size={25} />
            <span>다시 시도</span>
          </button>
        </div>
      )}

      {/* 추천 결과 없는 상태 */}
      {!isLoading && !isError && data.length === 0 && trackName && artistName && (
        <div className="flex flex-col items-center justify-center gap-5 py-48 text-gray-400">
          <BsQuestionCircleFill size={60} />
          <p className="mb-2 text-lg">
            <span className="font-bold tracking-tight">
              "{trackName} - {artistName}"
            </span>
            <span>에 대한 추천 결과가 없습니다.</span>
          </p>
        </div>
      )}

      {/* 추천 플레이리스트 표시 */}
      {!isLoading && !isError && data.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-10">
          {/* 플레이리스트 이미지 커버 부분 */}
          <div className="flex items-center justify-center overflow-hidden w-60 h-60 bg-slate-500 rounded-2xl">
            <RiPlayList2Fill size={100} className="text-white opacity-60" />
          </div>
          {/* 플레이리스트 제목, 설명, 버튼 부분 */}
          <div className="flex flex-col items-center justify-center gap-5">
            <h1 className="text-4xl font-bold">플레이리스트 제목</h1>
            <div className="flex items-center gap-3 text-lg">
              <FaMusic size={20} className="text-white" />
              {data.length}곡
            </div>
            <p className="text-lg">플레이리스트 설명</p>
            <div className="flex gap-5">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 p-4 font-bold text-white border rounded-xl hover:bg-gray-800 text-[17px]"
              >
                <HiPencil size={25} />
                <span>리뷰 작성</span>
              </button>
              <button
                onClick={() => {
                  if (!email) {
                    alert("로그인이 필요합니다.");
                    return;
                  }

                  if (!confirm("플레이리스트를 저장 하시겠습니까?")) {
                    return;
                  }

                  // 테스트용 formData (수정 필요)
                  const formData = new FormData();
                  formData.append("file", "");
                  formData.append("title", "플레이리스트 제목");
                  formData.append("description", "플레이리스트 설명");
                  formData.append("email", email);

                  // 선택 곡들 Controller에 List로 보내기 위한 작업
                  checkedSongIds.forEach((id) => {
                    formData.append("songIds", String(id));
                  });

                  playlistApi
                    .createPlaylist(formData)
                    .then((res) => {
                      if (res.status === 200) {
                        alert("플레이리스트가 저장되었습니다.");
                      }
                    })
                    .catch((error) => {
                      console.error(error);
                      alert("플레이리스트 저장에 실패했습니다.");
                    });
                }}
                className="flex items-center gap-3 p-4 font-bold text-white border rounded-xl hover:bg-gray-800 text-[17px]"
              >
                <FaSave size={25} />
                <span>플레이리스트 저장</span>
              </button>
            </div>
          </div>
          {/* 추천 곡 리스트 */}
          <div className="w-[70%]">
            <FormControlLabel
              label={
                <span className="text-lg">
                  전체 선택 ({checkedSongIds.length} / {data.length})
                </span>
              }
              control={
                <Checkbox
                  size="large"
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCheckedSongIds(data.map((song) => song.id)); // 전체 선택
                    } else {
                      setCheckedSongIds([]); // 전체 해제
                    }
                  }}
                  sx={{ color: "white" }}
                />
              }
            />
            {data.map((item) => (
              <Box key={item.id} sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  size="large"
                  checked={checkedSongIds.includes(item.id)}
                  onChange={(e) => {
                    setCheckedSongIds((prev) =>
                      e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                    );
                  }}
                  sx={{ color: "white" }}
                />

                <Box sx={{ flex: 1 }}>
                  <SongListItem song={item} setSelectSong={setSelectSong} />
                </Box>
              </Box>
            ))}
          </div>
        </div>
      )}

      {/* 음악 플레이어 (미리듣기용) */}
      {selectSong && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer
            song={selectSong}
            setIsPlayerVisible={() => setIsPlayerVisible(!isPlayerVisible)}
          />
        </div>
      )}

      {/* 추천 플레이리스트 리뷰 작성 */}
      {isModalOpen && <PlaylistReviewModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default RecommendPlaylistResult;
