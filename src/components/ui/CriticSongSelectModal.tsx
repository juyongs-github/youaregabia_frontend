import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import api from "../../api/axios";

interface Song {
  id: number;
  trackName: string;
  artistName: string;
  imgUrl: string;
}

interface Props {
  onClose: () => void;
  onSelect: (song: Song) => void;
}

function CriticSongSelectModal({ onClose, onSelect }: Props) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Song[]>([]);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    const res = await api.get("/api/search", { params: { q: keyword } });
    setResults(res.data || []);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 overflow-hidden shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-bold text-white">평론할 곡 선택</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={18} />
          </button>
        </div>

        {/* 검색바 */}
        <div className="px-6 py-4">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border border-neutral-700 bg-neutral-800 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              placeholder="곡 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button
              onClick={handleSearch}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
            >
              <FaSearch />
            </button>
          </div>
        </div>

        {/* 검색 결과 */}
        <ul className="max-h-80 overflow-y-auto divide-y divide-neutral-800 px-2 pb-4">
          {results.length === 0 ? (
            <li className="text-center text-gray-500 py-8 text-sm">곡을 검색해주세요.</li>
          ) : (
            results.map((song) => (
              <li
                key={song.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-800 rounded-lg"
                onClick={() => {
                  onSelect(song);
                  onClose();
                }}
              >
                <img
                  src={song.imgUrl}
                  alt={song.trackName}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{song.trackName}</p>
                  <p className="text-xs text-gray-400">{song.artistName}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default CriticSongSelectModal;
