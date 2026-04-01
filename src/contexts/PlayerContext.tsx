import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { Song } from "../components/ui/SongListItem";

interface PlayerOptions {
  songs?: Song[];
  songIndex?: number;
  blind?: boolean;
  externalPaused?: boolean;
  playKey?: number;
  onSongEnd?: () => void;
  onSongChange?: (index: number) => void;
  onClose?: () => void;
}

interface PlayerContextValue {
  song: Song | null;
  songs: Song[];
  songIndex: number;
  blind: boolean;
  externalPaused: boolean;
  playKey: number;
  onSongEnd?: () => void;
  onSongChange?: (index: number) => void;
  onClose?: () => void;
  play: (song: Song, options?: PlayerOptions) => void;
  stop: () => void;
  setExternalPaused: (paused: boolean) => void;
  setSongIndex: (index: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [song, setSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const songsRef = useRef<Song[]>([]);
  const [songIndex, _setSongIndex] = useState(0);
  const [blind, setBlind] = useState(false);
  const [externalPaused, setExternalPaused] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [onSongEnd, setOnSongEnd] = useState<(() => void) | undefined>();
  const [onSongChange, setOnSongChange] = useState<((index: number) => void) | undefined>();
  const [onClose, setOnClose] = useState<(() => void) | undefined>();

  const setSongIndex = useCallback((index: number) => {
    _setSongIndex(index);
    const nextSong = songsRef.current[index];
    if (nextSong) setSong(nextSong);
  }, []);

  const play = useCallback((newSong: Song, options?: PlayerOptions) => {
    const newSongs = options?.songs ?? [];
    setSong(newSong);
    setSongs(newSongs);
    songsRef.current = newSongs;
    _setSongIndex(options?.songIndex ?? 0);
    setBlind(options?.blind ?? false);
    setExternalPaused(options?.externalPaused ?? false);
    if (options?.playKey !== undefined) setPlayKey(options.playKey);
    setOnSongEnd(options?.onSongEnd ? () => options.onSongEnd : undefined);
    setOnSongChange(options?.onSongChange ? () => options.onSongChange : undefined);
    setOnClose(options?.onClose ? () => options.onClose : undefined);
  }, []);

  const stop = useCallback(() => {
    setSong(null);
    setSongs([]);
    songsRef.current = [];
    _setSongIndex(0);
    setBlind(false);
    setExternalPaused(false);
    setOnSongEnd(undefined);
    setOnSongChange(undefined);
    setOnClose(undefined);
  }, []);

  return (
    <PlayerContext.Provider value={{
      song, songs, songIndex, blind, externalPaused, playKey,
      onSongEnd, onSongChange, onClose,
      play, stop, setExternalPaused, setSongIndex,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
