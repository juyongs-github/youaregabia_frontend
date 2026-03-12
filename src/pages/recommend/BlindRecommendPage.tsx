import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import api from "../../api/axios";
import { playlistApi } from "../../api/playlistApi";
import MusicPlayer from "../../components/layout/MusicPlayer";
import type { Song } from "../../components/ui/SongListItem";

interface Playlist {
  id: number;
  title: string;
}

type Step = "playing" | "liked" | "adding";

const BlindRecommendPage = () => {
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);
  const [song, setSong] = useState<Song | null>(null);
  const [step, setStep] = useState<Step>("playing");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRandomSong = async () => {
    setIsLoading(true);
    setStep("playing");
    setSong(null);
    try {
      const res = await api.get("/api/random");
      setSong(res.data);
    } catch (e) {
      console.error("랜덤 곡 로드 실패", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    if (!userEmail) return;
    const res = await playlistApi.getAllPlaylist(userEmail);
    setPlaylists(res.data);
  };

  useEffect(() => {
    fetchRandomSong();
  }, []);

  const handleLike = async () => {
    await fetchPlaylists();
    setStep("liked");
  };

  const handleDislike = () => {
    fetchRandomSong();
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!song || !userEmail) return;
    await playlistApi.addSongToPlaylist(playlistId, song.id, userEmail);
    alert("플레이리스트에 추가됐어요!");
    setStep("adding");
    fetchRandomSong();
  };

  return (
    <div className="mx-auto max-w-xl p-8 text-white">
      <h2 className="mb-6 text-2xl font-bold text-center">🎵 블라인드 추천</h2>

      {isLoading && <p className="text-center text-gray-400">곡 불러오는 중...</p>}

      {/* playing 단계 - 곡 정보 숨기고 호불호만 */}
      {!isLoading && song && step === "playing" && (
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center text-5xl">
            🎵
          </div>
          <p className="text-gray-400">지금 흘러나오는 곡이 마음에 드나요?</p>
          <div className="flex gap-4">
            <button
              onClick={handleLike}
              className="rounded-full bg-indigo-600 px-8 py-3 text-lg font-semibold hover:bg-indigo-500"
            >
              좋아요 👍
            </button>
            <button
              onClick={handleDislike}
              className="rounded-full bg-neutral-700 px-8 py-3 text-lg font-semibold hover:bg-neutral-600"
            >
              별로에요 👎
            </button>
          </div>
        </div>
      )}

      {/* liked 단계 - 곡 정보 공개 + 플레이리스트 선택 */}
      {song && step === "liked" && (
        <div className="flex flex-col items-center gap-4 mt-8">
          <img src={song.imgUrl} className="w-40 h-40 rounded-xl" />
          <p className="text-xl font-bold">{song.trackName}</p>
          <p className="text-gray-400">{song.artistName}</p>
          <p className="text-sm text-gray-500">{song.genreName}</p>

          <p className="mt-4 text-gray-300">플레이리스트에 추가할까요?</p>

          {playlists.length === 0 ? (
            <p className="text-gray-500">플레이리스트가 없어요.</p>
          ) : (
            <ul className="w-full flex flex-col gap-2">
              {playlists.map((pl) => (
                <li key={pl.id}>
                  <button
                    onClick={() => handleAddToPlaylist(pl.id)}
                    className="w-full rounded border border-neutral-700 px-4 py-2 text-left hover:bg-neutral-800"
                  >
                    {pl.title}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button onClick={fetchRandomSong} className="mt-2 text-sm text-gray-500 hover:text-white">
            추가 안 하고 다음 곡 →
          </button>
        </div>
      )}

      {/* 뮤직 플레이어 - playing 단계에서만 */}
      {song && step === "playing" && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer song={song} setIsPlayerVisible={fetchRandomSong} blind={true} />
        </div>
      )}
    </div>
  );
};

export default BlindRecommendPage;
