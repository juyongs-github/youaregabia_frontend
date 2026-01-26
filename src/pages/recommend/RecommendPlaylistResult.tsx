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

// 플레이리스트 추천 결과 페이지
function RecommendPlaylistResult() {
  const location = useLocation();
  const { trackName, artistName } = location.state || {};

  const [data, setData] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // 곡 정보 UI에서 선택한 곡(미리듣기, 유사 곡 추천)
  const [selectSong, setSelectSong] = useState<Song | null>(null);

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
        <div className="flex items-center justify-center py-72">
          <Spinner />
        </div>
      )}

      {/* 에러인 상태 */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-5 py-56">
          <div className="flex flex-col items-center justify-center gap-4">
            <IoWarning size={60} />
            <p className="text-lg font-bold text-white">추천 중 문제가 발생 했습니다.</p>
          </div>
          <button
            className="px-5 py-3 font-semibold text-white transition-colors bg-red-600 rounded-full hover:bg-red-700"
            onClick={() => fetchData()}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 추천 결과 없는 상태 */}
      {!isLoading && !isError && data.length === 0 && trackName && artistName && (
        <div className="flex flex-col items-center justify-center gap-5 text-gray-400 py-72">
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
              <button className="flex items-center gap-3 p-4 font-bold text-white border rounded-xl hover:bg-gray-800 text-[17px]">
                <HiPencil size={25} />
                <span>리뷰 작성</span>
              </button>
              <button className="flex items-center gap-3 p-4 font-bold text-white border rounded-xl hover:bg-gray-800 text-[17px]">
                <FaSave size={25} />
                <span>플레이리스트 저장</span>
              </button>
            </div>
          </div>
          {/* 추천 곡 리스트 */}
          <div className="w-[70%]">
            {data.map((item) => (
              <SongListItem key={item.id} song={item} setSelectSong={setSelectSong} />
            ))}
          </div>
        </div>
      )}

      {/* 음악 플레이어 (미리듣기용) */}
      {selectSong && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer song={selectSong} />
        </div>
      )}
    </div>
  );
}

export default RecommendPlaylistResult;
