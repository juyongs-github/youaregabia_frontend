import { useEffect, useState } from "react";
import SongListItem from "../../components/ui/SongListItem";
import { useLocation, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import Spinner from "../../components/ui/Spinner";
import { BsQuestionCircleFill } from "react-icons/bs";
import { IoWarning } from "react-icons/io5";
import { RiResetLeftFill } from "react-icons/ri";
import { usePlayer } from "../../contexts/PlayerContext";
import "../../styles/SearchResult.kfandom.css";

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

function SearchResult() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  const [data, setData] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const { play, stop } = usePlayer();
  const setSelectSong = (song: Song | null) => song ? play(song, { onClose: stop }) : stop();

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

  useEffect(() => {
    fetchData();
  }, [query, location.state]);

  return (
    <div className="kf-search-result">
      <h1>곡 검색 결과</h1>

      {/* 로딩 */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <Spinner />
        </div>
      )}

      {/* 에러 */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <IoWarning size={56} style={{ color: "var(--kf-danger, #ff687d)" }} />
          <p className="kf-search-state__text--error">검색 중 문제가 발생했습니다.</p>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-full"
            style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)" }}
          >
            <RiResetLeftFill size={20} />
            <span>다시 시도</span>
          </button>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!isLoading && !isError && data.length === 0 && query && (
        <div className="kf-search-state">
          <div className="kf-search-state__icon--empty">
            <BsQuestionCircleFill size={52} />
          </div>
          <p className="kf-search-state__text--empty">
            <strong>"{query}"</strong>에 대한 검색 결과가 없습니다.
          </p>
        </div>
      )}

      {/* 검색 결과 */}
      {!isLoading && !isError && data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map((item) => (
            <SongListItem key={item.id} song={item} setSelectSong={setSelectSong} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResult;
