import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Playlist } from "../../types/playlist";
import { playlistApi } from "../../api/playlistApi";

function PlaylistDetailPage() {
  const navigate = useNavigate();
  const { playlistId } = useParams<string>();

  const [data, setData] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      playlistApi.getPlaylist(playlistId).then((res) => {
        if (res.data) {
          setData(res.data || []);
        }
      });
    } catch (error) {
      console.error(error);
      setData(null);
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
      <h1>플레이리스트 상세</h1>
    </div>
  );
}

export default PlaylistDetailPage;
