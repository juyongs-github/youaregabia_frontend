import { useEffect, useState, useRef } from "react";
import type { Song } from "../../Components/ui/SongListItem";
import api from "../../api/axios";
import { FaMusic, FaSave } from "react-icons/fa";
import SongListItem from "../../Components/ui/SongListItem";
import { IoWarning } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { HiPencil } from "react-icons/hi2";
import { BsQuestionCircleFill, BsFillCircleFill } from "react-icons/bs";
import { RiArrowLeftLine, RiPlayList2Fill } from "react-icons/ri";
import { usePlayer } from "../../contexts/PlayerContext";
import { RiResetLeftFill } from "react-icons/ri";
import PlaylistReviewCreateModal from "../../Components/ui/PlaylistReviewCreateModal";
import Checkbox from "@mui/material/Checkbox";
import { playlistApi } from "../../api/playlistApi";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

// 플레이리스트 추천 결과 페이지
function RecommendPlaylistResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackName, artistName, coverImageUrl } = location.state || {};
  const user = useSelector((state: RootState) => state.auth.user);

  const [data, setData] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // 곡 정보 UI에서 선택한 곡(미리듣기, 유사 곡 추천)
  const { play, stop } = usePlayer();
  const setSelectSong = (song: Song | null) => song ? play(song, { onClose: stop }) : stop();

  // 리뷰 작성 Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  // 리뷰 등록 완료 여부
  const [isReviewSubmitted, setIsReviewSubmitted] = useState<boolean>(false);

  const [checkedSongIds, setCheckedSongIds] = useState<number[]>([]);
  const [savedPlaylistId, setSavedPlaylistId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 플레이리스트 제목과 설명
  const [playlistTitle, setPlaylistTitle] = useState<string>("");
  const [playlistDescription, setPlaylistDescription] = useState<string>("");

  // 수정 모드 상태
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);

  // 이전 제목 저장
  const prevTitleRef = useRef<string>("");
  // 제목 textarea ref
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  // 설명 textarea ref
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 플레이리스트 커버 이미지
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const isAllChecked = data.length > 0 && checkedSongIds.length === data.length;
  const isIndeterminate = checkedSongIds.length > 0 && !isAllChecked;

  const convertImageUrlToFile = async (url: string): Promise<File | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) return null;

      const ext = blob.type.split("/")[1]?.split(";")[0] || "jpg";
      return new File([blob], `playlist-cover.${ext}`, { type: blob.type });
    } catch (error) {
      console.error("cover image conversion failed", error);
      return null;
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.get("/api/recommend", {
        params: {
          trackName: trackName,
          artistName: artistName,
        },
      });

      setData(response.data || []);
    } catch (error) {
      console.error(error);
      setData([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location]);

  // 초기 플레이리스트 제목과 설명 설정
  useEffect(() => {
    if (trackName && artistName) {
      setPlaylistTitle(`${trackName} - ${artistName} 유사곡 추천 플레이리스트`);
      setPlaylistDescription(`"${trackName}" 곡과 유사한 음악들로 구성된 플레이리스트입니다.`);
    }
  }, [trackName, artistName]);

  useEffect(() => {
    const titleEl = titleTextareaRef.current;
    if (titleEl) {
      titleEl.style.height = "0";
      titleEl.style.height = `${titleEl.scrollHeight}px`;
    }

    const descEl = descriptionTextareaRef.current;
    if (descEl) {
      descEl.style.height = "0";
      descEl.style.height = `${descEl.scrollHeight}px`;
    }
  }, [data.length, playlistTitle, playlistDescription]);

  // 데이터 로드 시 전체 곡 자동 선택
  useEffect(() => {
    if (data.length > 0) {
      setCheckedSongIds(data.map((song) => song.id));
    }
  }, [data]);

  // 이미지 파일 선택 시 미리보기 URL 생성
  useEffect(() => {
    if (selectedImageFile) {
      const url = URL.createObjectURL(selectedImageFile);
      setImagePreviewUrl(url);

      // 컴포넌트 언마운트 시 URL 정리
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(coverImageUrl || null);
    }
  }, [selectedImageFile, coverImageUrl]);

  // 플레이리스트 제목 & 설명 수정 모드 시작 시 커서 끝으로 이동
  useEffect(() => {
    if (isEditingTitle && titleTextareaRef.current) {
      const el = titleTextareaRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }

    if (isEditingDescription && descriptionTextareaRef.current) {
      const el = descriptionTextareaRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [isEditingTitle, isEditingDescription]);

  // 이미지 파일 선택 핸들러
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일 타입 검증
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 선택할 수 있습니다.");
        return;
      }

      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기는 10MB 이하여야 합니다.");
        return;
      }

      setSelectedImageFile(file);
    }
  };

  // 이미지 초기화 핸들러
  const handleImageReset = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(coverImageUrl || null);

    // 파일 초기화
    const fileInput = document.getElementById("playlist-cover-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // 커버 이미지 클릭 핸들러
  const handleCoverClick = () => {
    if (savedPlaylistId) return; // 저장 후에는 클릭 불가
    const fileInput = document.getElementById("playlist-cover-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // 플레이리스트 저장 핸들러
  const handleSavePlaylist = async () => {
    if (checkedSongIds.length === 0) {
      alert("저장할 곡을 선택해주세요.");
      return;
    }

    if (!playlistTitle.trim()) {
      alert("플레이리스트 제목을 입력해주세요.");
      return;
    }

    if (!confirm("플레이리스트를 저장 하시겠습니까?")) {
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();

      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 선택된 이미지 파일이 있으면 추가, 없으면 빈 문자열
      let fileToUpload: File | null = selectedImageFile;
      if (!fileToUpload && coverImageUrl) {
        fileToUpload = await convertImageUrlToFile(coverImageUrl);
      }

      if (fileToUpload) {
        formData.append("file", fileToUpload);
      } else {
        formData.append("file", "");
      }

      formData.append("title", playlistTitle.trim());
      formData.append("description", playlistDescription.trim());
      formData.append("email", user.email);
      formData.append("type", "RECOMMENDED");

      // 선택 곡들 Controller에 List로 보내기 위한 작업
      checkedSongIds.forEach((id) => {
        formData.append("songIds", String(id));
      });

      const res = await playlistApi.createPlaylist(formData);

      if (res.status === 200 || res.status === 201) {
        // 백엔드 응답에서 플레이리스트 ID 추출
        const playlistId = res.data?.id || res.data?.playlistId;
        if (playlistId) {
          setSavedPlaylistId(playlistId);
          alert("플레이리스트가 저장되었습니다.");
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 409) {
        alert("같은 제목의 플레이리스트가 이미 존재합니다.");
      } else {
        alert("플레이리스트 저장에 실패했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 리뷰 작성 버튼 핸들러
  const handleOpenReviewModal = () => {
    if (!savedPlaylistId) {
      alert("먼저 플레이리스트를 저장해주세요.");
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div>
      {/* 로딩 중인 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-48">
          <div className="flex flex-col items-center justify-center py-48 space-y-4">
            <div className="text-3xl animate-bounce">🎵</div>
            <p className="text-lg text-white">유사 곡 추천 중입니다...</p>
          </div>
        </div>
      )}

      {/* 에러인 상태 */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <div className="flex flex-col items-center justify-center gap-4">
            <IoWarning size={60} />
            <p className="text-lg font-bold text-white">추천 중 문제가 발생 했습니다.</p>
          </div>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-5 py-3 font-semibold text-white transition-colors bg-red-600 rounded-full hover:bg-red-700"
          >
            <RiResetLeftFill size={25} />
            <span>다시 시도</span>
          </button>
        </div>
      )}

      {/* 추천 결과 없는 상태 */}
      {!isLoading && !isError && data.length === 0 && trackName && artistName && (
        <div className="flex flex-col items-center justify-center gap-5 py-48 text-gray-400">
          <BsQuestionCircleFill size={60} />
          <p className="mb-2 text-lg">
            <span className="font-bold tracking-tight">
              "{trackName} - {artistName}"
            </span>
            <span>에 대한 추천 결과가 없습니다.</span>
          </p>
        </div>
      )}

      {/* 추천 플레이리스트 표시 */}
      {!isLoading && !isError && data.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-12">
          {/* 플레이리스트 이미지 커버 부분 */}
          <div
            className={`relative overflow-hidden w-60 h-60 bg-slate-500 rounded-2xl cursor-pointer transition-all ${
              savedPlaylistId ? "cursor-not-allowed" : "hover:bg-slate-400 hover:scale-105"
            }`}
            onClick={handleCoverClick}
            title={savedPlaylistId ? "저장 후에는 변경할 수 없습니다" : "클릭하여 커버 이미지 선택"}
          >
            {imagePreviewUrl ? (
              <>
                <img
                  src={imagePreviewUrl}
                  alt="플레이리스트 커버"
                  className="object-cover w-full h-full"
                />
                {/* 이미지 초기화 버튼 (저장 전만) */}
                {!savedPlaylistId && imagePreviewUrl !== coverImageUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageReset();
                    }}
                    className="absolute flex items-center justify-center w-8 h-8 text-white transition-all bg-black bg-opacity-50 rounded-full top-2 right-2 hover:bg-opacity-70"
                    title="이미지 초기화"
                  >
                    ✕
                  </button>
                )}
                {!savedPlaylistId && imagePreviewUrl === coverImageUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCoverClick();
                    }}
                    className="absolute flex items-center justify-center w-8 h-8 text-white transition-all bg-black bg-opacity-50 rounded-full top-2 right-2 hover:bg-opacity-70"
                    title="이미지 수정"
                  >
                    <HiPencil size={18} />
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <RiPlayList2Fill size={80} className="mb-2 text-white opacity-60" />
                <span className="text-sm text-white opacity-80">
                  {!savedPlaylistId ? "커버 이미지 선택" : ""}
                </span>
              </div>
            )}
          </div>

          {/* 파일 input 요소 */}
          <input
            id="playlist-cover-input"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={savedPlaylistId !== null}
          />

          {/* 플레이리스트 제목, 설명, 버튼 부분 */}
          <div className="flex flex-col items-center w-full max-w-lg px-6">
            {/* 제목 표시/수정 영역 */}
            <div className="relative flex items-center justify-center w-full group">
              <textarea
                ref={titleTextareaRef}
                value={playlistTitle}
                onChange={(e) => {
                  setPlaylistTitle(e.target.value);
                }}
                onBlur={() => {
                  if (!playlistTitle.trim()) setPlaylistTitle(prevTitleRef.current);
                  setIsEditingTitle(false);
                }}
                readOnly={!isEditingTitle || !!savedPlaylistId}
                placeholder="플레이리스트 제목 입력.."
                maxLength={100}
                className={`
                  text-4xl font-extrabold text-center text-white placeholder-gray-500
                  w-full resize-none leading-tight px-2 py-1 overflow-hidden
                  bg-transparent transition-colors duration-200 rounded-lg
                  ${
                    isEditingTitle && !savedPlaylistId
                      ? "border-b-2 border-blue-400 cursor-text"
                      : `border-b-2 border-transparent ${!savedPlaylistId ? "cursor-pointer hover:border-white/20" : "cursor-default focus:outline-none"}`
                  }
                `}
                onClick={() => {
                  if (!savedPlaylistId) {
                    prevTitleRef.current = playlistTitle;
                    setIsEditingTitle(true);
                  }
                }}
              />
              {!savedPlaylistId && !isEditingTitle && (
                <button
                  onClick={() => {
                    prevTitleRef.current = playlistTitle;
                    setIsEditingTitle(true);
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-white/60 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                >
                  <HiPencil size={16} />
                </button>
              )}
            </div>

            {/* 사이점 */}
            <BsFillCircleFill size={5} className="mt-5 text-white/30" />

            {/* 곡 수 표시 */}
            <div className="flex items-center gap-2 px-5 py-2 mt-4 text-base font-medium rounded-full bg-white/10 text-white/80">
              <FaMusic size={15} />
              <span>{savedPlaylistId ? checkedSongIds.length : data.length}곡</span>
            </div>

            {/* 사이점 */}
            <BsFillCircleFill size={5} className="mt-4 text-white/30" />

            {/* 설명 표시/수정 영역 */}
            <div className="relative flex items-center justify-center w-full mt-4 group">
              <textarea
                ref={descriptionTextareaRef}
                value={playlistDescription}
                onChange={(e) => {
                  setPlaylistDescription(e.target.value);
                }}
                onBlur={() => setIsEditingDescription(false)}
                readOnly={!isEditingDescription || !!savedPlaylistId}
                placeholder="플레이리스트 설명 입력.."
                maxLength={200}
                className={`
                  text-base text-center text-white/70 placeholder-gray-500
                  w-full resize-none px-2 py-1 overflow-hidden break-all
                  bg-transparent transition-colors duration-200 rounded-lg
                  ${
                    isEditingDescription && !savedPlaylistId
                      ? "border border-blue-400 cursor-text"
                      : `border border-transparent ${!savedPlaylistId ? "cursor-pointer hover:border-white/20" : "cursor-default focus:outline-none"}`
                  }
                `}
                onClick={() => {
                  if (!savedPlaylistId) setIsEditingDescription(true);
                }}
              />
              {!savedPlaylistId && !isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-white/60 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                >
                  <HiPencil size={16} />
                </button>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3 mt-7">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all border rounded-full border-white/40 hover:bg-white/10"
              >
                <RiArrowLeftLine size={22} />
                <span>이전</span>
              </button>
              {!savedPlaylistId ? (
                <button
                  onClick={handleSavePlaylist}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50"
                >
                  <FaSave size={20} />
                  <span>{isSaving ? "저장 중..." : "플레이리스트 저장"}</span>
                </button>
              ) : isReviewSubmitted ? (
                <button
                  onClick={() =>
                    navigate("/playlist/review", {
                      state: { searchQuery: playlistTitle, tab: "mine" },
                    })
                  }
                  className="flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all rounded-full bg-white/20 hover:bg-white/30"
                >
                  <HiPencil size={20} />
                  <span>리뷰 보기</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenReviewModal}
                  className="flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all rounded-full bg-white/20 hover:bg-white/30"
                >
                  <HiPencil size={20} />
                  <span>리뷰 작성</span>
                </button>
              )}
            </div>
          </div>
          {/* 추천 곡 리스트 */}
          <div className="w-[70%]">
            <FormControlLabel
              label={
                <span className="text-lg">
                  {savedPlaylistId
                    ? "저장된 곡들"
                    : `전체 선택 (${checkedSongIds.length} / ${data.length})`}
                </span>
              }
              control={
                <Checkbox
                  size="large"
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCheckedSongIds(data.map((song) => song.id)); // 전체 선택
                    } else {
                      setCheckedSongIds([]); // 전체 해제
                    }
                  }}
                  disabled={savedPlaylistId !== null}
                  sx={{ color: "white" }}
                />
              }
            />
            {(savedPlaylistId ? data.filter((song) => checkedSongIds.includes(song.id)) : data).map(
              (item) => (
                <Box key={item.id} sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    onClick={(e) => {
                      if (savedPlaylistId) {
                        return; // 저장 후에는 선택 불가
                      }
                      e.stopPropagation();
                      setCheckedSongIds((prev) => {
                        if (prev.includes(item.id)) {
                          return prev.filter((id) => id !== item.id);
                        } else {
                          return [...prev, item.id];
                        }
                      });
                    }}
                    sx={{ cursor: savedPlaylistId ? "not-allowed" : "pointer", pd: 0 }}
                  >
                    <Checkbox
                      size="large"
                      checked={checkedSongIds.includes(item.id)}
                      disabled={savedPlaylistId !== null}
                      sx={{ color: "white" }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <SongListItem song={item} setSelectSong={setSelectSong} />
                  </Box>
                </Box>
              )
            )}
          </div>
        </div>
      )}

      {/* 리뷰 작성 모달 */}
      {isModalOpen && savedPlaylistId && (
        <PlaylistReviewCreateModal
          onClose={() => setIsModalOpen(false)}
          playlistId={savedPlaylistId}
          onSuccess={() => {
            setIsReviewSubmitted(true);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default RecommendPlaylistResult;
