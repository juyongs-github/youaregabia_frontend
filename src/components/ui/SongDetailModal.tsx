import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { FaMusic } from "react-icons/fa";
import type { Song } from "./SongListItem";
import type { Board } from "../../types/board";
import { boardApi } from "../../api/boardApi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

interface Props {
  song: Song;
  onClose: () => void;
}

type Tab = "info" | "review";

const SongDetailModal = ({ song, onClose }: Props) => {
  const [tab, setTab] = useState<Tab>("info");
  const [reviews, setReviews] = useState<Board[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const res = await boardApi.getCriticBoards(song.id, { page: 1, size: 5 });
      setReviews(res.dtoList);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (tab === "review") fetchReviews();
  }, [tab]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(80, 90, 140, 0.28)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          margin: "0 16px",
          borderRadius: 28,
          background: "#ffffff",
          border: "1px solid rgba(92,103,151,0.14)",
          boxShadow: "0 32px 72px rgba(80, 90, 140, 0.22)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 22px 16px",
          borderBottom: "1px solid rgba(92,103,151,0.1)",
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#22283a", letterSpacing: "-0.02em" }}>
            곡 상세정보
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(92,103,151,0.08)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#677086", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(92,103,151,0.16)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(92,103,151,0.08)")}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* 곡 기본 정보 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "16px 22px",
          borderBottom: "1px solid rgba(92,103,151,0.1)",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16, overflow: "hidden", flexShrink: 0,
            background: "linear-gradient(135deg, rgba(109,94,252,0.14), rgba(255,92,168,0.12))",
            boxShadow: "0 6px 18px rgba(80,90,140,0.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {song.imgUrl
              ? <img src={song.imgUrl} alt={song.trackName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <FaMusic size={26} style={{ color: "#9199ad" }} />
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#22283a", letterSpacing: "-0.02em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {song.trackName}
            </p>
            <p style={{ fontSize: 14, color: "#677086", marginTop: 3, fontWeight: 600 }}>{song.artistName}</p>
            <p style={{ fontSize: 12, color: "#9199ad", marginTop: 2 }}>{song.genreName}</p>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(92,103,151,0.1)" }}>
          {(["info", "review"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "12px 0",
                fontSize: 13, fontWeight: 700,
                color: tab === t ? "#6d5efc" : "#9199ad",
                borderBottom: tab === t ? "2px solid #6d5efc" : "2px solid transparent",
                background: "none", border: "none",
                borderBottom: tab === t ? "2px solid #6d5efc" : "2px solid transparent",
                cursor: "pointer", transition: "color 0.15s",
              }}
            >
              {t === "info" ? "곡 정보" : "평론"}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div style={{ padding: "18px 22px", minHeight: 200 }}>
          {tab === "info" && (
            <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none", margin: 0, padding: 0 }}>
              {[
                { label: "발매일", value: song.releaseDate?.slice(0, 10) ?? "-" },
                { label: "장르",   value: song.genreName ?? "-" },
                { label: "재생시간", value: formatDuration(song.durationMs) },
                { label: "아티스트", value: song.artistName },
              ].map(({ label, value }) => (
                <li key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: 12,
                  background: "rgba(109,94,252,0.04)",
                  border: "1px solid rgba(92,103,151,0.08)",
                }}>
                  <span style={{ fontSize: 13, color: "#9199ad", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, color: "#22283a", fontWeight: 700 }}>{value}</span>
                </li>
              ))}
            </ul>
          )}

          {tab === "review" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {userRole === "CRITIC" && (
                <button
                  onClick={() => {
                    onClose();
                    navigate("/recommend/critic/write", {
                      state: { songId: song.id, songName: song.trackName, artistName: song.artistName, imgUrl: song.imgUrl },
                    });
                  }}
                  style={{
                    padding: "10px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #6d5efc, #ff5ca8)",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    boxShadow: "0 8px 20px rgba(109,94,252,0.24)",
                  }}
                >
                  + 평론 작성
                </button>
              )}

              {isLoadingReviews ? (
                <p style={{ textAlign: "center", color: "#9199ad", padding: "24px 0", fontSize: 13 }}>불러오는 중...</p>
              ) : reviews.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9199ad", padding: "32px 0", fontSize: 13 }}>아직 평론이 없어요.</p>
              ) : (
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
                  {reviews.map((review) => (
                    <li
                      key={review.boardId}
                      onClick={() => { onClose(); navigate(`/recommend/critic/${review.boardId}`); }}
                      style={{
                        padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(92,103,151,0.1)",
                        transition: "background 0.15s, box-shadow 0.15s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLLIElement).style.background = "rgba(109,94,252,0.06)";
                        (e.currentTarget as HTMLLIElement).style.boxShadow = "0 4px 12px rgba(80,90,140,0.08)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLLIElement).style.background = "rgba(255,255,255,0.7)";
                        (e.currentTarget as HTMLLIElement).style.boxShadow = "none";
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#22283a" }}>{review.title}</p>
                      <p style={{ fontSize: 12, color: "#9199ad", marginTop: 4 }}>{review.writer}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default SongDetailModal;
