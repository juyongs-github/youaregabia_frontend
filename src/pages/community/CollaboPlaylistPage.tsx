import { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdOutlineLibraryMusic } from "react-icons/md";
import CollaborationPlaylistTopicItem from "../../components/ui/CollaboPlaylistTopicItem";
import CollaboPlaylistCreateModal from "../../components/ui/CollaboPlaylistCreateModal";
import { playlistApi } from "../../api/playlistApi";
import type { CollaboPlaylist } from "../../types/playlist";
import Spinner from "../../components/ui/Spinner";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import "../../styles/collabo-playlist-page-kfandom.css";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

function CollaboPlaylistPage() {
  const { toast, showToast, closeToast } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [tab, setTab] = useState<"all" | "popular" | "recent">("all");
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState<CollaboPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const res = await playlistApi.getAllCollaborativePlaylist();
      setPlaylists(res.data || []);
    } catch (e) {
      console.error(e);
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (playlist: CollaboPlaylist) => {
    if (!user?.email) { showToast("로그인이 필요합니다.", "info"); return; }
    try {
      if (playlist.hasLiked) {
        await playlistApi.unlikeCollabo(playlist.id);
      } else {
        await playlistApi.likeCollabo(playlist.id);
      }
      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlist.id
            ? { ...p, hasLiked: !p.hasLiked, likeCount: (p.likeCount ?? 0) + (p.hasLiked ? -1 : 1) }
            : p
        )
      );
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "좋아요에 실패했습니다.", "error");
    }
  };

  useEffect(() => { fetchPlaylists(); }, []);

  const filtered = playlists.filter(p =>
    !filter.trim() ||
    p.title?.toLowerCase().includes(filter.toLowerCase()) ||
    p.description?.toLowerCase().includes(filter.toLowerCase()) ||
    p.creatorEmail?.toLowerCase().includes(filter.toLowerCase())
  );

  const tabs = [
    { key: "all" as const, label: "전체" },
    { key: "popular" as const, label: "인기순" },
    { key: "recent" as const, label: "최신순" },
  ];

  const displayList =
    tab === "popular"
      ? [...filtered].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
      : tab === "recent"
      ? [...filtered].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      : filtered;

  return (
    <div className="kf-community-page kf-collabo-page">
      <div className="kf-community-page__shell">
        <div style={{ padding: 24 }}>
          {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background: "linear-gradient(135deg, rgba(109,94,252,0.15), rgba(255,92,168,0.12))", border: "1px solid rgba(109,94,252,0.18)" }}>
                <MdOutlineLibraryMusic size={20} style={{ color: "#6d5efc" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#1f2430" }}>공동 플레이리스트 제작</h1>
                <p className="text-sm" style={{ color: "#677086" }}>다른 사람들과 함께 플레이리스트를 만들어보세요.</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm text-white rounded-full transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", boxShadow: "0 6px 18px rgba(109,94,252,0.28)" }}
            >
              <FaPlus size={13} />
              <span>새 플레이리스트</span>
            </button>
          </div>

          {/* 검색바 */}
          {!isLoading && playlists.length > 0 && (
            <div className="relative mb-5">
              <FaSearch size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8e97ab" }} />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="제목, 설명 또는 작성자로 검색"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1.5px solid rgba(88,95,138,0.15)",
                  color: "#1f2430",
                }}
              />
            </div>
          )}

          {/* 탭 */}
          {!isLoading && (
            <>
              <div className="flex gap-1.5 mb-4">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={tab === t.key
                      ? { background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", color: "#fff", boxShadow: "0 4px 12px rgba(109,94,252,0.25)" }
                      : { background: "rgba(255,255,255,0.6)", color: "#677086", border: "1px solid rgba(88,95,138,0.15)" }}
                  >
                    {t.label}
                  </button>
                ))}
                {filtered.length > 0 && (
                  <span
                    className="ml-auto flex items-center gap-1.5 text-sm font-semibold self-center px-2.5 py-1 rounded-full"
                    style={{ color: "#7d879d", background: "rgba(255,255,255,0.72)", border: "1px solid rgba(88,95,138,0.16)" }}
                  >
                    <span>총</span>
                    <span>{filtered.length}개</span>
                  </span>
                )}
              </div>
              <CollaborationPlaylistTopicItem playlists={displayList} onLike={handleLike} />
            </>
          )}

          {isLoading && (
            <div className="flex justify-center py-24">
              <Spinner />
            </div>
          )}

          {isModalOpen && (
            <CollaboPlaylistCreateModal
              onClose={() => setIsModalOpen(false)}
              onCreated={() => { setIsModalOpen(false); fetchPlaylists(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CollaboPlaylistPage;
