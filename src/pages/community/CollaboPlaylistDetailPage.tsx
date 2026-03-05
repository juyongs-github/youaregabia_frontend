import { FaClock, FaMusic, FaUsers } from "react-icons/fa";
import { GrFormPrevious } from "react-icons/gr";
import { IoIosMore } from "react-icons/io";
import SongListItem from "../../components/ui/SongListItem";
import { useNavigate } from "react-router-dom";

function CollaboPlaylistDetailPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full gap-10">
      {/* 목록 및 더보기 버튼 */}
      <div className="flex justify-between">
        <button className="flex items-center gap-3" onClick={() => navigate("/community/collabo")}>
          <GrFormPrevious size={30} />
          <span className="text-lg font-bold">목록</span>
        </button>
        <button>
          <IoIosMore size={30} />
        </button>
      </div>
      <div className="flex gap-10">
        <div className="flex-shrink-0 w-64 h-64 bg-slate-500 rounded-2xl">
          <img />
        </div>
        <div className="flex flex-col justify-around w-full">
          <div className="flex flex-col gap-3">
            <p className="text-sm">공동 플레이리스트 제작</p>
            <p className="text-2xl font-bold">운동할 때 듣는 최고의 플레이리스트</p>
            <p className="text-lg">헬스장에서 들으려고 하는데 신나는 음악 추천해주세요!</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <FaUsers size={16} />
              <span>10명 참여 중</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <FaMusic size={16} />
              <span>30곡</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <FaClock size={16} />
              <span>20분 전</span>
            </div>
            <div className="flex items-center gap-2 ml-auto text-gray-400">
              <span className="text-xs">등록자: </span>
              <span className="font-semibold text-white">빵빵이</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-20">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">수록곡</h1>
          <button>
            <IoIosMore size={30} />
          </button>
        </div>
        {/* <SongListItem /> */}
      </div>
    </div>
  );
}

export default CollaboPlaylistDetailPage;
