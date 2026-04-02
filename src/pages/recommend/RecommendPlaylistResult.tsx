import { useEffect, useState, useRef } from "react";
import type { Song } from "../../components/ui/SongListItem";
import api from "../../api/axios";
import { FaHeadphones, FaMusic, FaSave } from "react-icons/fa";
import SongListItem from "../../components/ui/SongListItem";
import { IoWarning } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { HiPencil } from "react-icons/hi2";
import { BsQuestionCircleFill, BsFillCircleFill } from "react-icons/bs";
import { RiArrowLeftLine, RiPlayList2Fill } from "react-icons/ri";
import { usePlayer } from "../../contexts/PlayerContext";
import { RiResetLeftFill } from "react-icons/ri";
import PlaylistReviewCreateModal from "../../components/ui/PlaylistReviewCreateModal";
import Toast from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Checkbox from "@mui/material/Checkbox";
import { playlistApi } from "../../api/playlistApi";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import "../../styles/SongListItem.kfandom.css";

interface RecommendedSong {
  song: Song;
  reason: string;
  source: string;
  score: number;
}


// 플레이리스트 추천 결과 페이지
function RecommendPlaylistResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackName, artistName, coverImageUrl, previewUrl } = location.state || {};
  const user = useSelector((state: RootState) => state.auth.user);

  const [data, setData] = useState<RecommendedSong[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const { play, stop } = usePlayer();
  const setSelectSong = (song: Song | null) => song ? play(song, { onClose: stop }) : stop();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isReviewSubmitted, setIsReviewSubmitted] = useState<boolean>(false);

  const [checkedSongIds, setCheckedSongIds] = useState<number[]>([]);
  const [savedPlaylistId, setSavedPlaylistId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [playlistTitle, setPlaylistTitle] = useState<string>("");
  const [playlistDescription, setPlaylistDescription] = useState<string>("");

  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);

  const prevTitleRef = useRef<string>("");
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => setToast({ message, type });
  const showConfirm = (message: string, onConfirm: () => void) => setConfirmState({ message, onConfirm });

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
        params: { trackName, artistName },
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

  useEffect(() => { fetchData(); }, [location]);

  useEffect(() => {
    if (trackName && artistName) {
      setPlaylistTitle(`${trackName} - ${artistName} 유사곡 추천 플레이리스트`);
      setPlaylistDescription(`"${trackName}" 곡과 유사한 음악들로 구성된 플레이리스트입니다.`);
    }
  }, [trackName, artistName]);

  useEffect(() => {
    const titleEl = titleTextareaRef.current;
    if (titleEl) { titleEl.style.height = "0"; titleEl.style.height = `${titleEl.scrollHeight}px`; }
    const descEl = descriptionTextareaRef.current;
    if (descEl) { descEl.style.height = "0"; descEl.style.height = `${descEl.scrollHeight}px`; }
  }, [data.length, playlistTitle, playlistDescription]);

  useEffect(() => {
    if (data.length > 0) {
      setCheckedSongIds(data.map((item) => item.song.id));
    }
  }, [data]);

  useEffect(() => {
    if (selectedImageFile) {
      const url = URL.createObjectURL(selectedImageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(coverImageUrl || null);
    }
  }, [selectedImageFile, coverImageUrl]);

  useEffect(() => {
    if (isEditingTitle && titleTextareaRef.current) {
      const el = titleTextareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
    if (isEditingDescription && descriptionTextareaRef.current) {
      const el = descriptionTextareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditingTitle, isEditingDescription]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("이미지 파일만 선택할 수 있습니다."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("파일 크기는 10MB 이하여야 합니다."); return; }
    setSelectedImageFile(file);
  };

  const handleImageReset = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(coverImageUrl || null);
    const fileInput = document.getElementById("playlist-cover-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleCoverClick = () => {
    if (savedPlaylistId) return;
    (document.getElementById("playlist-cover-input") as HTMLInputElement)?.click();
  };

  const doSavePlaylist = async () => {
    setConfirmState(null);
    setIsSaving(true);
    try {
      const formData = new FormData();
      if (!user) { showToast("로그인이 필요합니다.", "error"); return; }

      let fileToUpload: File | null = selectedImageFile;
      if (!fileToUpload && coverImageUrl) fileToUpload = await convertImageUrlToFile(coverImageUrl);

      formData.append("file", fileToUpload ?? "");
      formData.append("title", playlistTitle.trim());
      formData.append("description", playlistDescription.trim());
      formData.append("email", user.email);
      formData.append("type", "RECOMMENDED");
      checkedSongIds.forEach((id) => formData.append("songIds", String(id)));

      const res = await playlistApi.createPlaylist(formData);
      if (res.status === 200 || res.status === 201) {
        const playlistId = res.data?.id || res.data?.playlistId;
        if (playlistId) { setSavedPlaylistId(playlistId); showToast("플레이리스트가 저장되었습니다.", "success"); }
      }
    } catch (error: any) {
      if (error?.response?.status === 409) showToast("같은 제목의 플레이리스트가 이미 존재합니다.", "error");
      else showToast("플레이리스트 저장에 실패했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlaylist = () => {
    if (checkedSongIds.length === 0) { showToast("저장할 곡을 선택해주세요.", "error"); return; }
    if (!playlistTitle.trim()) { showToast("플레이리스트 제목을 입력해주세요.", "error"); return; }
    showConfirm("플레이리스트를 저장 하시겠습니까?", doSavePlaylist);
  };

  const handleOpenReviewModal = () => {
    if (!savedPlaylistId) { showToast("먼저 플레이리스트를 저장해주세요.", "error"); return; }
    setIsModalOpen(true);
  };

  const displayList = savedPlaylistId
    ? data.filter((item) => checkedSongIds.includes(item.song.id))
    : data;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-48">
          <div className="flex flex-col items-center gap-4">
            <div className="text-3xl animate-bounce">🎵</div>
            <p className="text-lg" style={{ color: "var(--kf-sub)" }}>유사 곡 추천 중입니다...</p>
          </div>
        </div>
      )}

      {/* 에러 */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <IoWarning size={56} style={{ color: "var(--kf-danger, #ff687d)" }} />
          <p className="text-lg font-bold" style={{ color: "var(--kf-text)" }}>추천 중 문제가 발생했습니다.</p>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-full"
            style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)" }}
          >
            <RiResetLeftFill size={20} />
            <span>다시 시도</span>
          </button>
        </div>
      )}

      {/* 결과 없음 */}
      {!isLoading && !isError && data.length === 0 && trackName && artistName && (
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <BsQuestionCircleFill size={52} style={{ color: "var(--kf-brand)" }} />
          <p style={{ fontSize: 18, color: "var(--kf-sub)", textAlign: "center", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--kf-text)", fontWeight: 800 }}>"{trackName} - {artistName}"</strong>
            <br />에 대한 추천 결과가 없습니다.
          </p>
        </div>
      )}

      {/* 추천 플레이리스트 */}
      {!isLoading && !isError && data.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-10">
          {/* 커버 이미지 */}
          <div
            className="relative overflow-hidden w-56 h-56 rounded-3xl cursor-pointer transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(109,94,252,0.18), rgba(255,92,168,0.14))",
              boxShadow: "0 20px 50px rgba(109,94,252,0.18)",
              transform: savedPlaylistId ? undefined : undefined,
            }}
            onClick={handleCoverClick}
            title={savedPlaylistId ? "저장 후에는 변경할 수 없습니다" : "클릭하여 커버 이미지 선택"}
          >
            {imagePreviewUrl ? (
              <>
                <img src={imagePreviewUrl} alt="플레이리스트 커버" className="object-cover w-full h-full" />
                {!savedPlaylistId && imagePreviewUrl !== coverImageUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleImageReset(); }}
                    className="absolute flex items-center justify-center w-8 h-8 rounded-full top-2 right-2"
                    style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
                  >✕</button>
                )}
                {!savedPlaylistId && imagePreviewUrl === coverImageUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCoverClick(); }}
                    className="absolute flex items-center justify-center w-8 h-8 rounded-full top-2 right-2"
                    style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
                  ><HiPencil size={16} /></button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                <RiPlayList2Fill size={64} style={{ color: "rgba(109,94,252,0.5)" }} />
                {!savedPlaylistId && (
                  <span className="text-sm font-semibold" style={{ color: "var(--kf-brand, #6d5efc)" }}>커버 이미지 선택</span>
                )}
              </div>
            )}
          </div>

          <input
            id="playlist-cover-input"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={savedPlaylistId !== null}
          />

          {/* 제목 · 설명 · 버튼 */}
          <div className="flex flex-col items-center w-full max-w-lg px-6 gap-2">
            {/* 제목 */}
            <div className="relative flex items-center justify-center w-full group">
              <textarea
                ref={titleTextareaRef}
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                onBlur={() => { if (!playlistTitle.trim()) setPlaylistTitle(prevTitleRef.current); setIsEditingTitle(false); }}
                readOnly={!isEditingTitle || !!savedPlaylistId}
                placeholder="플레이리스트 제목 입력.."
                maxLength={100}
                className="text-3xl font-extrabold text-center w-full resize-none leading-tight overflow-hidden bg-transparent"
                style={{
                  color: "var(--kf-text)",
                  border: isEditingTitle && !savedPlaylistId
                    ? "1.5px solid rgba(109,94,252,0.45)"
                    : "1.5px solid transparent",
                  borderRadius: 14,
                  padding: "10px 44px 10px 16px",
                  cursor: savedPlaylistId ? "default" : "pointer",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onClick={() => { if (!savedPlaylistId) { prevTitleRef.current = playlistTitle; setIsEditingTitle(true); } }}
              />
              {!savedPlaylistId && !isEditingTitle && (
                <button
                  onClick={() => { prevTitleRef.current = playlistTitle; setIsEditingTitle(true); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(109,94,252,0.1)", color: "#6d5efc" }}
                >
                  <HiPencil size={15} />
                </button>
              )}
            </div>

            <BsFillCircleFill size={4} style={{ color: "var(--kf-muted)", marginTop: 6 }} />

            {/* 곡 수 + 기준 곡 듣기 */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full"
                style={{ background: "rgba(109,94,252,0.09)", color: "#6d5efc" }}>
                <FaMusic size={13} />
                <span>{savedPlaylistId ? checkedSongIds.length : data.length}곡</span>
              </div>
              {previewUrl && (
                <button
                  onClick={() => setSelectSong({ id: 0, trackName, artistName, genreName: "", imgUrl: coverImageUrl || "", previewUrl, durationMs: 0, releaseDate: "" })}
                  title={`${trackName} - ${artistName}`}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition-all"
                  style={{
                    border: "1.5px solid rgba(109,94,252,0.25)",
                    color: "#6d5efc",
                    background: "rgba(109,94,252,0.06)",
                  }}
                >
                  <FaHeadphones size={13} />
                  <span>기준 곡 듣기</span>
                </button>
              )}
            </div>

            <BsFillCircleFill size={4} style={{ color: "var(--kf-muted)", marginTop: 6 }} />

            {/* 설명 */}
            <div className="relative flex items-center justify-center w-full group">
              <textarea
                ref={descriptionTextareaRef}
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                onBlur={() => setIsEditingDescription(false)}
                readOnly={!isEditingDescription || !!savedPlaylistId}
                placeholder="플레이리스트 설명 입력.."
                maxLength={200}
                className="text-sm text-center w-full resize-none overflow-hidden break-all bg-transparent"
                style={{
                  color: "var(--kf-sub)",
                  border: isEditingDescription && !savedPlaylistId
                    ? "1.5px solid rgba(109,94,252,0.45)"
                    : "1.5px solid transparent",
                  borderRadius: 12,
                  padding: "8px 40px 8px 14px",
                  cursor: savedPlaylistId ? "default" : "pointer",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onClick={() => { if (!savedPlaylistId) setIsEditingDescription(true); }}
              />
              {!savedPlaylistId && !isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(109,94,252,0.1)", color: "#6d5efc" }}
                >
                  <HiPencil size={15} />
                </button>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-7 py-3 text-base font-semibold rounded-full transition-all"
                style={{
                  border: "1.5px solid rgba(92,103,151,0.22)",
                  color: "var(--kf-sub)",
                  background: "rgba(255,255,255,0.6)",
                }}
              >
                <RiArrowLeftLine size={18} />
                <span>이전</span>
              </button>
              {!savedPlaylistId ? (
                <button
                  onClick={handleSavePlaylist}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-7 py-3 text-base font-semibold text-white rounded-full transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", boxShadow: "0 12px 28px rgba(109,94,252,0.28)" }}
                >
                  <FaSave size={16} />
                  <span>{isSaving ? "저장 중..." : "플레이리스트 저장"}</span>
                </button>
              ) : isReviewSubmitted ? (
                <button
                  onClick={() => navigate("/playlist/review", { state: { searchQuery: playlistTitle, tab: "mine" } })}
                  className="flex items-center gap-2 px-7 py-3 text-base font-semibold text-white rounded-full"
                  style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", boxShadow: "0 12px 28px rgba(109,94,252,0.28)" }}
                >
                  <HiPencil size={16} />
                  <span>리뷰 보기</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenReviewModal}
                  className="flex items-center gap-2 px-7 py-3 text-base font-semibold text-white rounded-full"
                  style={{ background: "linear-gradient(135deg, #6d5efc, #ff5ca8)", boxShadow: "0 12px 28px rgba(109,94,252,0.28)" }}
                >
                  <HiPencil size={16} />
                  <span>리뷰 작성</span>
                </button>
              )}
            </div>
          </div>

          {/* 추천 곡 리스트 */}
          <div className="w-[70%]">
            {!savedPlaylistId && (
              <FormControlLabel
                label={
                  <span className="text-base font-semibold" style={{ color: "var(--kf-sub)" }}>
                    {`전체 선택 (${checkedSongIds.length} / ${data.length})`}
                  </span>
                }
                control={
                  <Checkbox
                    size="medium"
                    checked={isAllChecked}
                    indeterminate={isIndeterminate}
                    onChange={(e) =>
                      setCheckedSongIds(e.target.checked ? data.map((item) => item.song.id) : [])
                    }
                    sx={{ color: "#6d5efc", "&.Mui-checked": { color: "#6d5efc" } }}
                  />
                }
              />
            )}

            <div className="kf-song-list" style={{ marginTop: 8 }}>
              {displayList.map((item) => (
                <div key={item.song.id} className="kf-rec-row">
                  {/* 체크박스 */}
                  {!savedPlaylistId && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckedSongIds((prev) =>
                          prev.includes(item.song.id)
                            ? prev.filter((id) => id !== item.song.id)
                            : [...prev, item.song.id]
                        );
                      }}
                      style={{ cursor: "pointer", paddingTop: 4 }}
                    >
                      <Checkbox
                        size="medium"
                        checked={checkedSongIds.includes(item.song.id)}
                        sx={{ color: "#6d5efc", "&.Mui-checked": { color: "#6d5efc" } }}
                      />
                    </div>
                  )}

                  {/* 곡 아이템 + 추천 이유 */}
                  <div className="kf-rec-row__item">
                    <SongListItem song={item.song} setSelectSong={setSelectSong} />
                    {item.reason && (
                      <div className="kf-rec-row__reason">
                        <span className="kf-song-badge">추천 이유</span>
                        <span className="kf-song-reason">{item.reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && savedPlaylistId && (
        <PlaylistReviewCreateModal
          onClose={() => setIsModalOpen(false)}
          playlistId={savedPlaylistId}
          onSuccess={() => { setIsReviewSubmitted(true); setIsModalOpen(false); }}
        />
      )}
    </div>
  );
}

export default RecommendPlaylistResult;
