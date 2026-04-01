import { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import CollaborationPlaylistTopicItem from "../../components/ui/CollaboPlaylistTopicItem";
import CollaboPlaylistCreateModal from "../../components/ui/CollaboPlaylistCreateModal";
import { playlistApi } from "../../api/playlistApi";
import type { CollaboPlaylist } from "../../types/playlist";
import Spinner from "../../components/ui/Spinner";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

// 공동 플레이리스트 제작 페이지
function CollaboPlaylistPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [tab, setTab] = useState("1");
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
    if (!user?.email) { alert("로그인이 필요합니다."); return; }
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
      alert(e?.response?.data?.message ?? "좋아요에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // 필터 적용
  const filtered = playlists.filter(p =>
    !filter.trim() ||
    p.title?.toLowerCase().includes(filter.toLowerCase()) ||
    p.description?.toLowerCase().includes(filter.toLowerCase()) ||
    p.creatorEmail?.toLowerCase().includes(filter.toLowerCase())
  );

  // 탭별 정렬
  const allPlaylists = filtered;
  const popularPlaylists = [...filtered].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
  const recentPlaylists = [...filtered].sort((a, b) =>
    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  return (
    <div>
      {/* 제목 부분 */}
      <div className="flex items-center justify-between mb-8 tracking-tighter">
        <div>
          <h1 className="mb-2 text-3xl font-bold">공동 플레이리스트 제작</h1>
          <p className="text-gray-400">다른 사람들과 함께 플레이리스트를 만들어보세요.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 p-4 font-semibold transition-colors bg-red-600 rounded-full hover:bg-red-700"
        >
          <FaPlus size={20} />
        </button>
      </div>

      {/* 검색바 */}
      {!isLoading && playlists.length > 0 && (
        <div className="relative mb-4">
          <FaSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="제목, 설명 또는 작성자로 검색"
            className="w-full pl-11 pr-4 py-3 text-base rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/30 transition-colors placeholder-white/30"
          />
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      )}

      {/* Filter Tabs */}
      {!isLoading && (
        <Box sx={{ width: "100%", typography: "body1" }}>
          <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <TabList
                onChange={(_, v) => setTab(v)}
                aria-label="공동 플레이리스트 제작 Filter Tab"
                sx={{
                  "& .MuiTab-root": { color: "#ffffff", fontWeight: 600, fontSize: 16 },
                  "& .Mui-selected": { color: "#ffffff" },
                  "& .MuiTabs-indicator": { backgroundColor: "#ffffff" },
                }}
              >
                <Tab label="전체" value="1" />
                <Tab label="인기순" value="2" />
                <Tab label="최신순" value="3" />
              </TabList>
            </Box>
            <TabPanel value="1">
              <CollaborationPlaylistTopicItem playlists={allPlaylists} onLike={handleLike} />
            </TabPanel>
            <TabPanel value="2">
              <CollaborationPlaylistTopicItem playlists={popularPlaylists} onLike={handleLike} />
            </TabPanel>
            <TabPanel value="3">
              <CollaborationPlaylistTopicItem playlists={recentPlaylists} onLike={handleLike} />
            </TabPanel>
          </TabContext>
        </Box>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <CollaboPlaylistCreateModal
          onClose={() => setIsModalOpen(false)}
          onCreated={() => {
            setIsModalOpen(false);
            fetchPlaylists();
          }}
        />
      )}
    </div>
  );
}

export default CollaboPlaylistPage;
