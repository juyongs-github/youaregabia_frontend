import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
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

// 공동 플레이리스트 제작 페이지
function CollaboPlaylistPage() {
  const [tab, setTab] = useState("1");
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

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // 탭별 정렬
  const allPlaylists = playlists;
  const popularPlaylists = [...playlists].sort((a, b) => b.songCount - a.songCount);
  const recentPlaylists = [...playlists].reverse();

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
              <CollaborationPlaylistTopicItem playlists={allPlaylists} />
            </TabPanel>
            <TabPanel value="2">
              <CollaborationPlaylistTopicItem playlists={popularPlaylists} />
            </TabPanel>
            <TabPanel value="3">
              <CollaborationPlaylistTopicItem playlists={recentPlaylists} />
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
