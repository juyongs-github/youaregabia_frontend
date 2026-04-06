import type { Board, BoardSong } from "../../types/board";
import BoardSongList from "../../components/ui/BoardSongList";
import { usePlayer } from "../../contexts/PlayerContext";
import type { Song } from "./SongListItem";

interface Props {
  board: Board;
  isMyBoard: boolean;
}

const extractFirstImageFromHtml = (html?: string) => {
  if (!html) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const firstImg = doc.querySelector("img");
  return firstImg?.getAttribute("src") ?? null;
};

const CriticSidePanel = ({ songs }: { songs: BoardSong[]; isMyBoard: boolean }) => {
  const { play, song: currentSong } = usePlayer();
  const song = songs[0];
  const isPlaying = currentSong?.id === song.songId;

  const toSong = (s: BoardSong): Song => ({
    id: s.songId,
    trackName: s.trackName,
    artistName: s.artistName,
    imgUrl: s.imgUrl,
    previewUrl: s.previewUrl,
    genreName: s.genreName,
    durationMs: s.durationMs,
    releaseDate: s.releaseDate,
  });

  const handleClick = () => {
    play(toSong(song), { songs: [toSong(song)], songIndex: 0 });
  };

  return (
    <div
      className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-black/5 transition-colors"
      onClick={handleClick}
      style={{
        borderTop: "1px solid var(--kf-border)",
        borderLeft: isPlaying ? "4px solid var(--kf-brand)" : "4px solid transparent",
        background: isPlaying ? "rgba(109,94,252,0.08)" : "transparent",
      }}
    >
      <img
        src={song.imgUrl}
        alt={song.trackName}
        style={{
          width: "36px",
          height: "36px",
          minWidth: "36px",
          borderRadius: "8px",
          objectFit: "cover",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: isPlaying ? "var(--kf-brand)" : "var(--kf-text-main)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {isPlaying ? "🎵 " : "▶ "}
          {song.trackName}
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "var(--kf-text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            margin: 0,
            marginTop: "2px",
          }}
        >
          {song.artistName}
        </p>
      </div>
    </div>
  );
};

const BoardSidePanel = ({ board, isMyBoard }: Props) => {
  if (board.boardType === "FREE") {
    const contentImageUrl = extractFirstImageFromHtml(board.content);
    return (
      <div className="kf-board-side-card">
        {contentImageUrl ? (
          <img src={contentImageUrl} alt={board.title} className="kf-board-side-image" />
        ) : (
          <div className="kf-board-side-empty">이미지가 없습니다.</div>
        )}
      </div>
    );
  }

  if (board.boardType === "PLAYLIST_SHARE" && board.songs && board.songs.length > 0) {
    return <BoardSongList songs={board.songs} isMyBoard={isMyBoard} />;
  }

  if (board.boardType === "CRITIC") {
    const contentImageUrl = extractFirstImageFromHtml(board.content);
    return (
      <div className="kf-board-side-card">
        {contentImageUrl ? (
          <img src={contentImageUrl} alt={board.title} className="kf-board-side-image" />
        ) : (
          <div className="kf-board-side-empty">이미지가 없습니다.</div>
        )}
        {board.songs && board.songs.length > 0 && (
          <CriticSidePanel songs={board.songs} isMyBoard={isMyBoard} />
        )}
      </div>
    );
  }

  return null;
};

export default BoardSidePanel;
