import { useEffect, useState } from "react";
import SongListItem from "../ui/SongListItem";
import { useLocation, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../ui/Spinner";
import { BsQuestionCircleFill } from "react-icons/bs";
import { IoWarning } from "react-icons/io5";
import MusicPlayer from "../layout/MusicPlayer";

interface Song {
  id: number;
  trackName: string;
  artistName: string;
  genreName: string;
  imgUrl: string;
  previewUrl: string;
  durationMs: number;
  releaseDate: string;
}

// 검색 결과 페이지
function SearchResult() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  const [data, setData] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // 곡 정보 UI에서 선택한 곡(미리듣기, 유사 곡 추천)
  const [selectSong, setSelectSong] = useState<Song | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.get("/api/search", {
        params: { q: query },
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

  // 검색 값, 이전 검색어 재검색 상태 값에 따라 재렌더링
  useEffect(() => {
    fetchData();
  }, [query, location.state]);

  return (
    <div>
      <h1 className="text-3xl font-bold">곡 검색 결과</h1>

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
            <p className="text-lg font-bold text-white">검색 중 문제가 발생 했습니다.</p>
          </div>
          <button
            onClick={() => fetchData()}
            className="px-5 py-3 font-semibold text-white transition-colors bg-red-600 rounded-full hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 검색 결과 없는 상태 */}
      {!isLoading && !isError && data.length === 0 && query && (
        <div className="flex flex-col items-center justify-center gap-5 text-gray-400 py-72">
          <BsQuestionCircleFill size={60} />
          <p className="mb-2 text-lg">
            <span className="font-bold tracking-tight">"{query}"</span>
            <span>에 대한 검색 결과가 없습니다.</span>
          </p>
        </div>
      )}

      {/* 검색 결과 리스트 표시 */}
      {!isLoading && !isError && data.length > 0 && (
        <div className="mt-7">
          {data.map((item) => (
            <SongListItem key={item.id} song={item} setSelectSong={setSelectSong} />
          ))}
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

export default SearchResult;
