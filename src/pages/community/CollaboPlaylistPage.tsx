import { FaPlus } from "react-icons/fa";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { useState } from "react";
import CollaborationPlaylistTopicItem from "../../components/ui/CollaboPlaylistTopicItem";
import CollaboPlaylistCreateModal from "../../components/ui/CollaboPlaylistCreateModal";

// 공동 플레이리스트 제작 페이지
function CollaboPlaylistPage() {
  const [value, setValue] = useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

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

      {/* Filter Tabs */}
      <Box sx={{ width: "100%", typography: "body1" }}>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleChange}
              aria-label="공동 플레이리스트 제작 Filter Tab"
              sx={{
                "& .MuiTab-root": {
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: 16,
                },
                // 선택된 탭
                "& .Mui-selected": {
                  color: "#ffffff",
                },
                // 하단 밑줄
                "& .MuiTabs-indicator": {
                  backgroundColor: "#ffffff",
                },
              }}
            >
              <Tab label="전체" value="1" />
              <Tab label="인기순" value="2" />
              <Tab label="최신순" value="3" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <CollaborationPlaylistTopicItem />
          </TabPanel>
          <TabPanel value="2">인기순</TabPanel>
          <TabPanel value="3">최신순</TabPanel>
        </TabContext>
      </Box>

      {/* ===== 모달 ===== */}
      {isModalOpen && <CollaboPlaylistCreateModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default CollaboPlaylistPage;
