import { useEffect, useState } from "react";
import { FaCheck, FaClock, FaMusic, FaPlay, FaSearch, FaTrash, FaUsers } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { GrFormPrevious } from "react-icons/gr";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { playlistApi } from "../../api/playlistApi";
import { playlistSongApi, type SongSuggestion } from "../../api/playlistSongApi";
import type { Song } from "../../components/ui/SongListItem";
import type { CollaboPlaylist } from "../../types/playlist";
import MusicPlayer from "../../components/layout/MusicPlayer";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";

interface PlaylistSong extends Song {
  playlistSongId: number;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return diff + "초 전";
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 2592000) return Math.floor(diff / 86400) + "일 전";
  return Math.floor(diff / 2592000) + "달 전";
}

function CollaboPlaylistDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [playlist, setPlaylist] = useState<CollaboPlaylist | null>(null);
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [isSongsLoading, setIsSongsLoading] = useState(false);

  // 곡 제안 대기 목록 (작성자용)
  const [pendingSongs, setPendingSongs] = useState<SongSuggestion[]>([]);
  const [isPendingSongsLoading, setIsPendingSongsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [playerSongs, setPlayerSongs] = useState<Song[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  const isCreator = !!user?.email && playlist?.creatorEmail === user.email;

  const fetchPlaylist = async () => {
    if (!id) return;
    try { const res = await playlistApi.getPlaylist(id); setPlaylist(res.data as CollaboPlaylist); }
    catch (e) { console.error(e); }
  };
  const fetchSongs = async () => {
    if (!id) return;
    setIsSongsLoading(true);
    try { const res = await playlistApi.getPlaylistSongs(Number(id)); setSongs((res.data as PlaylistSong[]) || []); }
    catch (e) { console.error(e); }
    finally { setIsSongsLoading(false); }
  };
  const fetchPendingSongs = async () => {
    if (!id || !user?.email) return;
    setIsPendingSongsLoading(true);
    try { const res = await playlistSongApi.getPendingSuggestions(Number(id), user.email); setPendingSongs(res.data || []); }
    catch (e) { console.error(e); }
    finally { setIsPendingSongsLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true); setHasSearched(true);
    try { const res = await api.get("/search", { params: { q: searchQuery } }); setSearchResults(res.data || []); }
    catch (e) { console.error(e); setSearchResults([]); }
    finally { setIsSearching(false); }
  };

  // 작성자 직접 추가 (즉시 수록)
  const handleAddSongDirectly = async (song: Song) => {
    if (!id) return;
    try { await playlistApi.addSongToPlaylist(Number(id), song.id); alert("곡이 추가되었습니다."); fetchSongs(); }
    catch (e) { alert("곡 추가에 실패했습니다."); }
  };

  // 곡 제안 (로그인 유저 → 대기)
  const handleSuggestSong = async (song: Song) => {
    if (!id || !user?.email) return;
    try { await playlistSongApi.suggestSong(Number(id), song.id, user.email); alert("곡 제안이 완료되었습니다. 작성자의 수락을 기다려주세요."); }
    catch (e) { alert("곡 제안에 실패했습니다."); }
  };

  // 수록곡 삭제 (작성자만)
  const handleRemoveSong = async (playlistSongId: number) => {
    if (!window.confirm("이 곡을 수록곡에서 삭제하시겠습니까?")) return;
    try { await playlistApi.removeSongFromPlaylist(playlistSongId); fetchSongs(); }
    catch (e) { alert("곡 삭제에 실패했습니다."); }
  };

  // 곡 제안 수락 (작성자만)
  const handleAcceptSuggestion = async (suggestionId: number) => {
    if (!id || !user?.email) return;
    try { await playlistSongApi.acceptSuggestion(Number(id), suggestionId, user.email); setPendingSongs(prev => prev.filter(s => s.id !== suggestionId)); fetchSongs(); }
    catch (e) { alert("수락에 실패했습니다."); }
  };

  // 곡 제안 거절 (작성자만)
  const handleRejectSuggestion = async (suggestionId: number) => {
    if (!id || !user?.email) return;
    try { await playlistSongApi.rejectSuggestion(Number(id), suggestionId, user.email); setPendingSongs(prev => prev.filter(s => s.id !== suggestionId)); }
    catch (e) { alert("거절에 실패했습니다."); }
  };

  const handlePlayAll = () => { if (songs.length === 0) return; setPlayerSongs(songs); setPlayerIndex(0); setIsPlayerVisible(true); };
  const handlePlaySong = (index: number) => { setPlayerSongs(songs); setPlayerIndex(index); setIsPlayerVisible(true); };

  useEffect(() => { fetchPlaylist(); fetchSongs(); }, [id]);
  useEffect(() => { if (isCreator) fetchPendingSongs(); }, [isCreator]);

  return (
    <div className="flex flex-col w-full gap-8">
      <button className="flex items-center gap-3 self-start" onClick={() => navigate("/community/collabo")}>
        <GrFormPrevious size={30} /><span className="text-lg font-bold">목록</span>
      </button>

      {/* 플레이리스트 정보 */}
      <div className="flex gap-8">
        <div className="flex-shrink-0 w-52 h-52 bg-slate-700 rounded-2xl overflow-hidden">
          {playlist?.imageUrl
            ? <img src={import.meta.env.VITE_API_BASE_URL + playlist.imageUrl} alt="" className="w-full h-full object-cover" />
            : <div className="flex items-center justify-center w-full h-full"><FaMusic size={48} className="text-white opacity-40" /></div>
          }
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-400">공동 플레이리스트 제작</p>
            <p className="text-2xl font-bold truncate">{playlist?.title || "-"}</p>
            {playlist?.description && <p className="text-gray-300 line-clamp-3">{playlist.description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
            {playlist?.participantCount !== undefined && (
              <div className="flex items-center gap-1.5"><FaUsers size={14} /><span>{playlist.participantCount}명 참여 중</span></div>
            )}
            <div className="flex items-center gap-1.5"><FaMusic size={14} /><span>{songs.length}곡</span></div>
            {playlist?.createdAt && <div className="flex items-center gap-1.5"><FaClock size={14} /><span>{timeAgo(playlist.createdAt)}</span></div>}
            {playlist?.creatorEmail && <div className="flex items-center gap-1.5"><MdEmail size={15} /><span className="text-white">{playlist.creatorEmail}</span></div>}
          </div>
          <div className="flex items-center gap-3 mt-2">
            {songs.length > 0 && (
              <button onClick={handlePlayAll} className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 transition-colors rounded-full text-sm font-semibold">
                <FaPlay size={12} />전체 듣기
              </button>
            )}
            {isCreator && <span className="flex items-center gap-2 px-5 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold">작성자</span>}
          </div>
        </div>
      </div>

      {/* 수록곡 + 검색 패널 */}
      <div className="flex gap-8 items-start">
        {/* 수록곡 */}
        <div className="flex-1 min-w-0">
          <h2 className="mb-4 text-xl font-bold">수록곡</h2>
          {isSongsLoading || (isCreator && isPendingSongsLoading)
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : songs.length === 0 && pendingSongs.length === 0
              ? (
                <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                  <FaMusic size={36} className="opacity-40" />
                  <p>아직 수록곡이 없습니다.</p>
                  <p className="text-sm">오른쪽에서 곡을 검색하여 {isCreator ? "추가" : "제안"}해보세요.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 확정된 수록곡 */}
                  {songs.map((song, index) => (
                    <div key={song.playlistSongId ?? song.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                      <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-600">
                        {song.imgUrl
                          ? <img src={song.imgUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="flex items-center justify-center w-full h-full"><FaMusic size={18} className="text-white opacity-40" /></div>
                        }
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg" onClick={() => handlePlaySong(index)}>
                          <FaPlay size={14} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" title={song.trackName}>{song.trackName}</p>
                        <p className="text-sm text-gray-400 truncate">{song.artistName}</p>
                      </div>
                      <button onClick={() => handlePlaySong(index)} className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded-full border border-white/10 hover:border-white/30 transition-colors opacity-0 group-hover:opacity-100">미리듣기</button>
                      {isCreator && (
                        <button onClick={() => handleRemoveSong(song.playlistSongId ?? song.id)} className="text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100">
                          <FaTrash size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* 수락 대기 중인 제안 곡 (작성자에게만 표시) */}
                  {isCreator && pendingSongs.length > 0 && (
                    <>
                      {songs.length > 0 && <div className="border-t border-white/10 my-3" />}
                      <p className="text-xs text-yellow-400/70 font-semibold px-1 mb-1">수락 대기 중</p>
                      {pendingSongs.map(s => (
                        <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 group">
                          <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-600">
                            {s.imgUrl
                              ? <img src={s.imgUrl} alt="" className="w-full h-full object-cover" />
                              : <div className="flex items-center justify-center w-full h-full"><FaMusic size={18} className="text-white opacity-40" /></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate" title={s.trackName}>{s.trackName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-sm text-gray-400 truncate">{s.artistName}</p>
                              <span className="text-xs text-yellow-400/80 shrink-0 flex items-center gap-1">
                                <MdEmail size={11} />{s.suggestedByEmail}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleAcceptSuggestion(s.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 transition-colors rounded-full">
                              <FaCheck size={10} />수락
                            </button>
                            <button onClick={() => handleRejectSuggestion(s.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors rounded-full text-red-400">
                              <FaTrash size={10} />취소
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )
          }
        </div>

        {/* 검색 패널 - 모든 유저에게 표시 */}
        <div className="w-96 shrink-0">
          <h2 className="mb-4 text-xl font-bold">
            {isCreator ? "곡 추가" : "곡 제안"}
          </h2>
          {!isCreator && (
            <p className="mb-3 text-xs text-gray-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              제안한 곡은 작성자의 수락 후 수록곡으로 등록됩니다.
            </p>
          )}
          <div className="flex gap-2 mb-4">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="곡명 또는 아티스트 검색"
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 outline-none focus:border-white/30 transition-colors placeholder-white/30"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"><FaSearch size={16} /></button>
          </div>
          {isSearching
            ? <div className="flex justify-center py-10"><Spinner /></div>
            : hasSearched && searchResults.length === 0
              ? <p className="text-center text-gray-400 py-10">검색 결과가 없습니다.</p>
              : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {searchResults.map(song => (
                    <div key={song.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-slate-600">
                        {song.imgUrl
                          ? <img src={song.imgUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="flex items-center justify-center w-full h-full"><FaMusic size={16} className="text-white opacity-40" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" title={song.trackName}>{song.trackName}</p>
                        <p className="text-xs text-gray-400 truncate">{song.artistName}</p>
                      </div>
                      {isCreator
                        ? <button onClick={() => handleAddSongDirectly(song)} className="text-xs bg-red-600 hover:bg-red-700 transition-colors px-3 py-1 rounded-full font-semibold shrink-0">추가</button>
                        : <button onClick={() => handleSuggestSong(song)} disabled={!user} className="text-xs bg-yellow-600 hover:bg-yellow-700 transition-colors px-3 py-1 rounded-full font-semibold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">+</button>
                      }
                    </div>
                  ))}
                </div>
              )
          }
          {!user && hasSearched && (
            <p className="text-center text-sm text-gray-400 mt-2">로그인 후 곡을 제안할 수 있습니다.</p>
          )}
        </div>
      </div>

      {isPlayerVisible && playerSongs.length > 0 && (
        <div className="fixed bottom-0 left-0 z-50 w-full">
          <MusicPlayer song={playerSongs[playerIndex]} setIsPlayerVisible={() => setIsPlayerVisible(false)} songs={playerSongs} songIndex={playerIndex} onSongChange={index => setPlayerIndex(index)} />
        </div>
      )}
    </div>
  );
}

export default CollaboPlaylistDetailPage;
