import { useEffect, useState } from "react";
import { FaHeadphones, FaPlus, FaThumbsUp } from "react-icons/fa";
import { playlistSongApi, type CollaboSong } from "../../api/playlistSongApi";
import type { CollaboPlaylist } from "../../types/playlist";
import type { Song } from "../ui/SongListItem";
import AddToPlaylistModal from "../ui/AddToPlaylistModal";

type Props = {
  playlist: CollaboPlaylist;
  onSongClick: (song: Song) => void;
  onModalOpenChange?: (open: boolean) => void;
};

function RankSection({ playlist, onSongClick, onModalOpenChange }: Props) {
  const [songs, setSongs] = useState<CollaboSong[]>([]);
  const [modalSong, setModalSong] = useState<Song | null>(null);

  const openModal = (song: Song) => {
    setModalSong(song);
    onModalOpenChange?.(true);
  };

  const closeModal = () => {
    setModalSong(null);
    onModalOpenChange?.(false);
  };


  useEffect(() => {
    playlistSongApi
      .getCollaborativeSongs(playlist.id)
      .then((res) => {
        const sorted = [...(res.data || [])].sort(
          (a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0)
        );
        setSongs(sorted);
      })
      .catch(() => setSongs([]));
  }, [playlist.id]);

  const getRank = (index: number): number => {
    if (index === 0) return 1;
    const cur = songs[index].voteCount ?? 0;
    const prev = songs[index - 1].voteCount ?? 0;
    return cur === prev ? getRank(index - 1) : index + 1;
  };

  const rankClass = (rank: number) => {
    if (rank === 1) return "rank-number gold";
    if (rank === 2) return "rank-number silver";
    if (rank === 3) return "rank-number bronze";
    return "rank-number";
  };

  return (
    <>
      <div className="rank-section">
        <ul className="rank-list">
          {songs.length === 0 ? (
            <li className="rank-empty">아직 곡이 없습니다.</li>
          ) : (
            songs.map((song, index) => {
              const rank = getRank(index);
              return (
              <li className="rank-item" key={song.playlistSongId}>
                <span className={rankClass(rank)}>{rank}</span>
                <img className="rank-album-img" src={song.imgUrl} alt={song.trackName} />
                <span className="rank-text">
                  <span className="rank-track">{song.trackName}</span>
                  <span className="rank-artist">{song.artistName}</span>
                </span>
                <div className="rank-actions">
                  <button onClick={() => onSongClick(song)} title="미리듣기">
                    <FaHeadphones size={13} />
                  </button>
                  <button onClick={() => openModal(song)} title="플레이리스트에 추가">
                    <FaPlus size={13} />
                  </button>
                </div>
                <div className="rank-vote-btn">
                  <FaThumbsUp size={11} />
                  <span>{song.voteCount ?? 0}</span>
                </div>
              </li>
              );
            })
          )}
        </ul>
      </div>

      {modalSong && (
        <AddToPlaylistModal
          song={modalSong}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}
    </>
  );
}

export default RankSection;
