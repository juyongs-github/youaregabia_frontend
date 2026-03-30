import { useState, useRef, useEffect } from "react";
import {
  FaCommentDots, FaTimes, FaPaperPlane, FaRobot, FaTrash,
  FaChevronLeft, FaChevronRight, FaPlay, FaPause, FaPlus, FaCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../api/axios";
import type { Song } from "./SongListItem";
import { usePlayer } from "../../contexts/PlayerContext";
import { playlistApi } from "../../api/playlistApi";
import type { RootState } from "../../store";

interface iTunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  primaryGenreName?: string;
  previewUrl?: string;
  reason?: string;
}

interface InquiryItem {
  id: number;
  type: string;
  content: string;
  status: string;
  createdAt: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isRule?: boolean;
  tracks?: iTunesTrack[];
  inquiries?: InquiryItem[];
  link?: string;
  linkLabel?: string;
  links?: { label: string; path: string }[];
}

interface ChatResponse {
  message: string;
  type: "rule" | "ai";
  sessionId?: string;
}

// **"곡 제목" - 아티스트** 또는 **"곡 제목"** 패턴만 파싱 (따옴표 필수)
function parseSongs(text: string): { title: string; artist: string; reason: string }[] {
  const lines = text.split("\n");
  const results: { title: string; artist: string; reason: string }[] = [];
  // ASCII 따옴표 " 와 유니코드 곡선따옴표 " " 모두 처리
  const songPattern = /\*{0,2}[\u201C"]([^"*\n\u201C\u201D]{2,})[\u201D"]\s*(?:[-–]\s*([^\n*]{2,}?))?\*{0,2}\s*$/;
  const isSongLine = (l: string) => songPattern.test(l);

  for (let i = 0; i < lines.length; i++) {
    const match = songPattern.exec(lines[i]);
    if (!match) continue;
    const title = match[1].trim();
    const artist = match[2] ? match[2].trim().replace(/\*+$/, "").trim() : "";
    if (!title) continue;

    let reason = "";
    for (let j = i + 1; j < lines.length && j <= i + 5; j++) {
      const line = lines[j].trim();
      if (!line) continue;
      if (isSongLine(line) || /^\d+\.\s+\*/.test(line)) break;
      const bulletMatch = line.match(/^[-•→]\s*(.+)/);
      if (bulletMatch) { reason = bulletMatch[1].trim(); break; }
      const colonMatch = line.match(/^(?:이유|추천\s*이유|설명|reason)\s*[:\-]\s*(.+)/i);
      if (colonMatch) { reason = colonMatch[1].trim(); break; }
      if (!/^\d+\./.test(line)) { reason = line; break; }
    }

    results.push({ title, artist, reason });
  }
  return results;
}

async function fetchItunesTracks(songs: { title: string; artist: string; reason: string }[]): Promise<iTunesTrack[]> {
  const results = await Promise.all(
    songs.map(async ({ title, artist, reason }) => {
      try {
        const query = encodeURIComponent(artist ? `${title} ${artist}` : title);
        // limit=5로 후보를 가져와 previewUrl 있는 트랙 우선 선택
        const res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=5&country=KR&lang=ko_kr`);
        const data = await res.json();
        const tracks: iTunesTrack[] = data.results ?? [];
        let track = tracks.find((t) => t.previewUrl) ?? tracks[0];
        if (!track) return undefined;

        // 여전히 previewUrl 없으면 US 스토어로 재시도
        if (!track.previewUrl) {
          try {
            const res2 = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=5`);
            const data2 = await res2.json();
            const tracks2: iTunesTrack[] = data2.results ?? [];
            const withPreview = tracks2.find((t) => t.previewUrl);
            if (withPreview) track = { ...track, previewUrl: withPreview.previewUrl };
          } catch {}
        }

        return { ...track, reason };
      } catch {
        return undefined;
      }
    })
  );
  return results.filter(Boolean) as iTunesTrack[];
}

type Category = "main" | "feature" | "recommend" | "recommend_mood" | "recommend_vibe" | "faq" | "genre" | "inquiry";

const PARENT_CATEGORY: Partial<Record<Category, Category>> = {
  feature: "main",
  recommend: "main",
  recommend_mood: "recommend",
  recommend_vibe: "recommend",
  faq: "main",
  genre: "recommend",
  inquiry: "main",
};

const WELCOME_MESSAGE =
  "안녕하세요! GAP Music 챗봇입니다 🎵\n궁금한 점을 자유롭게 물어보거나 아래 버튼을 눌러보세요!";

const MOODS = [
  { emoji: "😊", label: "신남", value: "신나고 기분이 좋을 때 들을 음악을 추천해줘" },
  { emoji: "😢", label: "슬픔", value: "슬프고 우울한 기분일 때 들을 음악을 추천해줘" },
  { emoji: "😌", label: "편안함", value: "마음이 편안하고 차분할 때 들을 음악을 추천해줘" },
  { emoji: "🥰", label: "설렘", value: "설레고 두근거리는 기분일 때 들을 음악을 추천해줘" },
  { emoji: "😤", label: "스트레스", value: "스트레스받고 지쳐있을 때 들을 음악을 추천해줘" },
  { emoji: "😔", label: "우울함", value: "우울하고 무기력할 때 들을 음악을 추천해줘" },
  { emoji: "💪", label: "활기참", value: "활기차고 에너지 넘칠 때 들을 음악을 추천해줘" },
  { emoji: "🌙", label: "몽환적", value: "몽환적이고 감성적인 기분일 때 들을 음악을 추천해줘" },
];

const CATEGORIES: Record<Category, { label: string; options: { label: string; value: string; link?: string; links?: { label: string; path: string }[] }[] }> = {
  main: {
    label: "메인",
    options: [
      { label: "1. 기능 사용법", value: "feature" },
      { label: "2. AI 음악 추천", value: "recommend" },
      { label: "3. 자주 묻는 질문", value: "faq" },
      { label: "4. 문의하기", value: "inquiry" },
    ],
  },
  feature: {
    label: "기능 사용법",
    options: [
      { label: "1. 플레이리스트 만들기", value: "플레이리스트 만드는 방법을 알려줘", link: "/playlist/me" },
      { label: "2. 음악 검색하기", value: "음악 검색 방법을 알려줘" },
      { label: "3. 추천 기능 사용법", value: "추천 기능 사용 방법을 알려줘", links: [
        { label: "블라인드 곡 추천", path: "/recommend/blind" },
        { label: "이상형 월드컵 곡 추천", path: "/recommend/worldcup" },
      ]},
      { label: "4. 랭킹 보기", value: "랭킹 기능을 알려줘", link: "/home" },
      { label: "5. 음악 공유 게시판", value: "공유 게시판 커뮤니티 이용 방법을 알려줘", link: "/community/share" },
      { label: "6. 자유게시판 이용", value: "자유게시판 이용 방법을 알려줘", link: "/community/free" },
      { label: "7. 음악 평론", value: "뮤직 크리틱 평론 이용 방법을 알려줘", link: "/recommend/critic" },
      { label: "8. 공동 플레이리스트 제작", value: "콜라보 공동 플레이리스트 제작 기능을 알려줘", link: "/community/collabo" },
      { label: "9. 게임 방법", value: "퀴즈 게임 이용 방법을 알려줘", links: [
        { label: "노래 맞추기", path: "/game/music-quiz" },
        { label: "앨범 맞추기", path: "/game/album-quiz" },
        { label: "카드 맞추기", path: "/game/card-match" },
      ]},
      { label: "10. 포인트 & 등급", value: "포인트 등급 적립 시스템을 알려줘", link: "/profile/points" },
      { label: "11. 굿즈 구매", value: "굿즈 상품 구매 방법을 알려줘", link: "/goods" },
      { label: "12. 주문 내역 확인", value: "주문 내역 조회 방법을 알려줘", link: "/goods/orders" },
      { label: "13. 마이페이지 이용", value: "마이페이지 이용 방법을 알려줘", link: "/profile/me" },
    ],
  },
  recommend: {
    label: "AI 음악 추천",
    options: [
      { label: "1. 기분별 추천", value: "recommend_mood" },
      { label: "2. 분위기별 추천", value: "recommend_vibe" },
      { label: "3. 장르별 추천", value: "genre" },
    ],
  },
  recommend_mood: {
    label: "기분별 추천",
    options: [], // MOODS 컴포넌트로 별도 렌더링
  },
  recommend_vibe: {
    label: "분위기별 추천",
    options: [
      { label: "1. 오늘의 추천곡", value: "오늘 들을 만한 노래를 추천해줘" },
      { label: "2. 드라이브", value: "드라이브할 때 들을 신나는 노래 추천해줘" },
      { label: "3. 공부/집중", value: "공부하거나 집중할 때 들을 음악 추천해줘" },
      { label: "4. 운동", value: "운동할 때 들을 신나는 음악 추천해줘" },
      { label: "5. 감성 발라드", value: "감성적인 발라드 노래 추천해줘" },
      { label: "6. 잠들기 전", value: "자기 전에 들을 잔잔한 음악 추천해줘" },
      { label: "7. 파티/신남", value: "파티 분위기에 어울리는 신나는 음악 추천해줘" },
      { label: "8. 카페 분위기", value: "카페에서 틀 것 같은 분위기 있는 음악 추천해줘" },
    ],
  },
  faq: {
    label: "자주 묻는 질문",
    options: [
      { label: "1. 포인트는 어떻게 적립되나요?", value: "포인트 적립 방법을 알려줘" },
      { label: "2. 등급 기준이 어떻게 되나요?", value: "등급 기준을 알려줘" },
      { label: "3. 비밀번호를 변경하고 싶어요", value: "비밀번호 변경 방법을 알려줘", link: "/profile/me" },
      { label: "4. 계정 문제가 생겼어요", value: "계정 문제 해결 방법을 알려줘" },
      { label: "5. 기능 오류가 발생했어요", value: "기능 오류 해결 방법을 알려줘" },
    ],
  },
  genre: {
    label: "장르별 추천",
    options: [
      { label: "1. K-POP", value: "K-POP 장르 중 인기곡을 추천해줘" },
      { label: "2. 재즈", value: "재즈 장르 중 인기곡을 추천해줘" },
      { label: "3. 시티팝", value: "시티팝 장르 중 인기곡을 추천해줘" },
      { label: "4. 클래식", value: "클래식 음악을 처음 접하는 사람에게 입문곡을 추천해줘" },
      { label: "5. 힙합/R&B", value: "힙합과 R&B 장르 중 인기곡을 추천해줘" },
      { label: "6. 록/인디", value: "록과 인디 장르 중 인기곡을 추천해줘" },
      { label: "7. 팝", value: "팝 장르 중 인기곡을 추천해줘" },
      { label: "8. EDM", value: "EDM 일렉트로닉 장르 중 인기곡을 추천해줘" },
    ],
  },
  inquiry: {
    label: "문의하기",
    options: [
      { label: "1. 계정 문제", value: "__inquiry__계정 문제" },
      { label: "2. 기능 오류", value: "__inquiry__기능 오류" },
      { label: "3. 기타 문의", value: "__inquiry__기타 문의" },
      { label: "4. 내 문의 내역", value: "__inquiry_history__" },
    ],
  },
};

// 규칙 응답 제목에서 아이콘 결정
function getGuideIcon(title: string): string {
  if (title.includes("플레이리스트")) return "📋";
  if (title.includes("검색")) return "🔍";
  if (title.includes("추천")) return "🎵";
  if (title.includes("랭킹") || title.includes("순위")) return "🏆";
  if (title.includes("게시판") || title.includes("커뮤니티") || title.includes("자유")) return "✍️";
  if (title.includes("평론") || title.includes("크리틱")) return "📝";
  if (title.includes("콜라보") || title.includes("공동")) return "🤝";
  if (title.includes("게임") || title.includes("퀴즈")) return "🎮";
  if (title.includes("포인트") || title.includes("등급")) return "⭐";
  if (title.includes("굿즈") || title.includes("상품")) return "🛍️";
  if (title.includes("주문") || title.includes("배송")) return "📦";
  if (title.includes("마이페이지") || title.includes("내 정보")) return "👤";
  if (title.includes("계정") || title.includes("비밀번호")) return "🔐";
  if (title.includes("오류") || title.includes("버그")) return "🔧";
  if (title.includes("문의")) return "💬";
  if (title.includes("GAP Music") || title.includes("기능")) return "🎶";
  return "📌";
}

interface GuideItem {
  type: "step" | "bullet" | "note";
  number?: number;
  text: string;
}
interface GuideCardData {
  title: string;
  items: GuideItem[];
}

// 규칙 응답 텍스트를 제목 + 항목 구조로 파싱
function parseGuideCard(content: string): GuideCardData | null {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  // 첫 줄이 ':'으로 끝나야 제목으로 인식
  if (!lines[0].endsWith(":")) return null;
  const title = lines[0].slice(0, -1).trim();
  const items: GuideItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const stepMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (stepMatch) {
      items.push({ type: "step", number: parseInt(stepMatch[1]), text: stepMatch[2] });
      continue;
    }
    if (line.startsWith("※") || line.startsWith("이메일:") || line.startsWith("📧")) {
      items.push({ type: "note", text: line.startsWith("※") ? line.slice(1).trim() : line });
      continue;
    }
    // 이모지 불릿 (전체 기능 안내용)
    if (/^[\p{Emoji}]/u.test(line)) {
      items.push({ type: "bullet", text: line });
      continue;
    }
  }

  return items.length > 0 ? { title, items } : null;
}

// AI 답변 응답값 **bold**, "따옴표", URL 렌더링
function renderContent(content: string) {
  const tokenRegex = /(\*\*(.+?)\*\*|[\u201C"]([^\u201C\u201D"\n]{2,})[\u201D"]|https?:\/\/[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = tokenRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }
    if (match[0].startsWith("**")) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // "따옴표" → bold (따옴표 제거)
      parts.push(<strong key={key++}>{match[3]}</strong>);
    } else {
      parts.push(
        <a key={key++} href={match[0]} target="_blank" rel="noopener noreferrer" className="underline text-red-300 hover:text-red-200">
          {match[0]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }
  return parts;
}

const STORAGE_KEY = "chatbot_messages";
const SESSION_KEY = "chatbot_session_id";

function ChatbotButton() {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as Message[];
    } catch {}
    return [{ role: "assistant", content: WELCOME_MESSAGE }];
  });

  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState<Category>("main");

  const [inquiryStep, setInquiryStep] = useState<null | "email" | "content">(null);
  const [inquiryType, setInquiryType] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const { play: playGlobal, stop: stopGlobal, song: previewSong } = usePlayer();

  // 플레이리스트 추가
  const [playlists, setPlaylists] = useState<{ id: number; title: string; imageUrl: string }[]>([]);
  const [addingTrack, setAddingTrack] = useState<iTunesTrack | null>(null);
  const [addStatus, setAddStatus] = useState<Record<number, "idle" | "loading" | "done" | "error">>({});
  const [addingPlaylistId, setAddingPlaylistId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // messages 변경 시 localStorage 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // 채팅창 닫혀있을 때 새 AI 응답 → 뱃지
  useEffect(() => {
    if (!isOpen && messages.length > 1 && messages[messages.length - 1].role === "assistant") {
      setHasUnread(true);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  // 미리듣기
  const handlePreview = (track: iTunesTrack) => {
    if (!track.previewUrl) return;
    if (previewSong?.id === track.trackId) {
      stopGlobal();
      return;
    }
    const song: Song = {
      id: track.trackId,
      trackName: track.trackName,
      artistName: track.artistName,
      genreName: track.primaryGenreName ?? "",
      imgUrl: track.artworkUrl100,
      previewUrl: track.previewUrl,
      durationMs: 30000,
      releaseDate: "",
    };
    playGlobal(song, { onClose: () => stopGlobal() });
  };

  // 플레이리스트 목록 불러오기
  const loadPlaylists = async () => {
    if (playlists.length > 0) return;
    try {
      const res = await playlistApi.getAllPlaylist();
      setPlaylists(res.data);
    } catch {}
  };

  // 플레이리스트에 곡 추가
  const handleAddToPlaylist = async (playlistId: number) => {
    if (!addingTrack) return;
    const trackId = addingTrack.trackId;
    const trackName = addingTrack.trackName;
    setAddingPlaylistId(playlistId);
    setAddStatus((prev) => ({ ...prev, [trackId]: "loading" }));
    let succeeded = false;
    let isDuplicate = false;
    try {
      const res = await api.get("/api/search", {
        params: { q: `${addingTrack.trackName} ${addingTrack.artistName}` },
      });
      const songs: Song[] = res.data || [];
      const match = songs.find(
        (s) =>
          s.trackName.toLowerCase() === addingTrack.trackName.toLowerCase() ||
          s.previewUrl === addingTrack.previewUrl
      );
      if (!match) throw new Error("not found");
      await playlistApi.addSongToPlaylist(playlistId, match.id);
      setAddStatus((prev) => ({ ...prev, [trackId]: "done" }));
      succeeded = true;
    } catch (err: any) {
      const data = JSON.stringify(err?.response?.data ?? "").toLowerCase();
      isDuplicate = data.includes("duplicate entry");
      setAddStatus((prev) => ({ ...prev, [trackId]: "error" }));
    }
    setAddingPlaylistId(null);
    setAddingTrack(null);
    setToast({
      message: succeeded
        ? `"${trackName}"이(가) 플레이리스트에 추가되었습니다.`
        : isDuplicate
          ? `"${trackName}"은(는) 이미 플레이리스트에 있는 곡입니다.`
          : `추가에 실패했습니다. 다시 시도해주세요.`,
      type: succeeded ? "success" : "error",
    });
    setTimeout(() => setToast(null), 3000);
  };

  const sendMessage = async (text?: string, displayText?: string, link?: string, linkLabel?: string, links?: { label: string; path: string }[]) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    // 문의 이메일 입력 단계
    if (inquiryStep === "email") {
      const userMsg: Message = { role: "user", content: msg };
      setInput("");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(msg)) {
        setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "올바른 이메일 형식이 아닙니다. 다시 입력해주세요." }]);
        return;
      }
      setInquiryEmail(msg);
      setInquiryStep("content");
      setMessages((prev) => [...prev, userMsg, { role: "assistant", content: `이메일이 확인되었습니다.\n${inquiryType}에 대한 문의 내용을 아래 입력창에 자세히 입력해주세요.\n\n접수된 문의는 담당자 이메일로 전달되며, 빠른 시일 내에 답변드리겠습니다.` }]);
      return;
    }

    // 문의 내용 입력 단계
    if (inquiryStep === "content") {
      const userMsg: Message = { role: "user", content: msg };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      try {
        await api.post("/api/inquiry", {
          type: inquiryType,
          content: msg,
          email: inquiryEmail || undefined,
        });
        setMessages((prev) => [...prev, { role: "assistant", content: "문의가 접수되었습니다! 빠른 시일 내에 답변 드리겠습니다 😊" }]);
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요." }]);
      } finally {
        setInquiryStep(null);
        setInquiryType("");
        setInquiryEmail("");
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return;
    }

    const userMessage: Message = { role: "user", content: displayText ?? msg };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setCategory("main");
    setIsLoading(true);

    try {
      const res = await api.post<ChatResponse>("/api/chatbot/message", {
        message: msg,
        sessionId,
      });
      if (res.data.sessionId && res.data.sessionId !== sessionId) {
        setSessionId(res.data.sessionId);
        localStorage.setItem(SESSION_KEY, res.data.sessionId);
      }
      const assistantMessage: Message = { role: "assistant", content: res.data.message, isRule: res.data.type === "rule", link, linkLabel, links };
      if (res.data.type === "ai") {
        const songs = parseSongs(res.data.message);
        if (songs.length > 0) {
          const tracks = await fetchItunesTracks(songs);
          assistantMessage.tracks = tracks;
        }
      }
      setMessages([...updatedMessages, assistantMessage]);
    } catch {
      setMessages([...updatedMessages, { role: "assistant", content: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleOption = async (label: string, value: string, link?: string, links?: { label: string; path: string }[]) => {
    if (value === "__inquiry_history__") {
      setCategory("main");
      if (!isLoggedIn) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: "[문의] 내 문의 내역" },
          { role: "assistant", content: "문의 내역은 로그인 후 확인할 수 있습니다." },
        ]);
        return;
      }
      setMessages((prev) => [...prev, { role: "user", content: "[문의] 내 문의 내역" }]);
      setIsLoading(true);
      try {
        const res = await api.get<InquiryItem[]>("/api/inquiry/my");
        const list = res.data;
        if (list.length === 0) {
          setMessages((prev) => [...prev, { role: "assistant", content: "아직 접수된 문의가 없습니다." }]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: `내 문의 내역 (${list.length}건)`, inquiries: list }]);
        }
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "문의 내역을 불러오는 데 실패했습니다." }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (value.startsWith("__inquiry__")) {
      const type = value.replace("__inquiry__", "");
      setInquiryType(type);
      setCategory("main");
      const botMsg = isLoggedIn
        ? `${type}에 대한 문의 내용을 아래 입력창에 자세히 입력해주세요.\n\n접수된 문의는 담당자 이메일로 전달되며, 빠른 시일 내에 답변드리겠습니다.`
        : `문의 답변을 받으실 이메일 주소를 먼저 입력해주세요.`;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `[문의] ${type}` },
        { role: "assistant", content: botMsg },
      ]);
      setInquiryStep(isLoggedIn ? "content" : "email");
      return;
    }
    const isSubCategory = value in PARENT_CATEGORY;
    if (isSubCategory) {
      setCategory(value as Category);
    } else {
      sendMessage(value, label, link, label, links);
    }
  };

  const handleReset = async () => {
    if (sessionId) {
      try {
        await api.delete(`/api/chatbot/sessions/${sessionId}`);
      } catch {}
      setSessionId(null);
      localStorage.removeItem(SESSION_KEY);
    }
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    setInput("");
    setCategory("main");
    setInquiryStep(null);
    setInquiryType("");
    setInquiryEmail("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const currentOptions = CATEGORIES[category].options;

  return (
    <>
      {/* 채팅창 */}
      <div
        className={`fixed right-6 z-50 w-80 top-[5.5rem] bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          previewSong ? "bottom-40" : "bottom-24"
        } ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-red-600 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FaRobot size={16} />
            <div>
              <p className="font-semibold text-sm leading-none">GAP Music 챗봇</p>
              <p className="text-xs text-red-200 mt-0.5">무엇이든 물어보세요</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} title="대화 초기화" className="hover:opacity-70 transition-opacity p-1">
              <FaTrash size={12} />
            </button>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-70 transition-opacity p-1">
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-1`}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2 w-full`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mb-0.5">
                    <FaRobot size={10} />
                  </div>
                )}
                {msg.isRule && msg.role === "assistant" ? (
                  (() => {
                    const guide = parseGuideCard(msg.content);
                    if (!guide) return (
                      <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-white/10 text-gray-100 rounded-bl-sm">
                        {renderContent(msg.content)}
                      </div>
                    );
                    return (
                      <div className="max-w-[85%] rounded-2xl overflow-hidden border border-white/10 rounded-bl-sm">
                        {/* 카드 헤더 */}
                        <div className="bg-red-600/25 border-b border-red-500/20 px-3 py-2 flex items-center gap-2">
                          <span className="text-base leading-none">{getGuideIcon(guide.title)}</span>
                          <span className="text-sm font-semibold text-white">{guide.title}</span>
                        </div>
                        {/* 항목 목록 */}
                        <div className="bg-white/5 px-3 py-2.5 flex flex-col gap-2">
                          {guide.items.map((item, idx) =>
                            item.type === "step" ? (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-[18px] h-[18px] rounded-full bg-red-600/80 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                                  {item.number}
                                </span>
                                <span className="text-xs text-gray-200 leading-relaxed">{renderContent(item.text)}</span>
                              </div>
                            ) : item.type === "bullet" ? (
                              <div key={idx} className="text-xs text-gray-200 leading-relaxed pl-1">
                                {item.text}
                              </div>
                            ) : (
                              <div key={idx} className="text-[11px] text-gray-400 pl-1 border-t border-white/5 pt-1.5">
                                {renderContent(item.text)}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : msg.tracks && msg.tracks.length > 0 ? (
                  <div className="max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-white/10 text-gray-100 rounded-bl-sm">
                    {renderContent(msg.content.split("\n").find(l => l.trim() && !/[\u201C"]/.test(l) && !/^\d+\./.test(l.trim())) ?? "")}
                  </div>
                ) : (
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-red-600 text-white rounded-br-sm"
                        : "bg-white/10 text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    {renderContent(msg.content)}
                  </div>
                )}
              </div>

              {msg.role === "assistant" && msg.link && (
                <div className="pl-8">
                  <button
                    onClick={() => navigate(msg.link!)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-full px-3 py-1 transition-all"
                  >
                    <FaChevronRight size={8} />
                    {"페이지 바로가기"}
                  </button>
                </div>
              )}
              {msg.role === "assistant" && msg.links && msg.links.length > 0 && (
                <div className="pl-8 flex flex-wrap gap-1.5">
                  {msg.links.map((l) => (
                    <button
                      key={l.path}
                      onClick={() => navigate(l.path)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-full px-3 py-1 transition-all"
                    >
                      <FaChevronRight size={8} />
                      {l.label}
                    </button>
                  ))}
                </div>
              )}

              {msg.inquiries && msg.inquiries.length > 0 && (
                <div className="flex flex-col gap-2 w-full pl-8">
                  {msg.inquiries.map((item) => (
                    <div key={item.id} className="flex flex-col gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white bg-white/10 rounded-full px-2 py-0.5 truncate">
                          {item.type}
                        </span>
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0 ${
                          item.status === "접수중"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-green-500/20 text-green-300"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{item.content}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {msg.tracks && msg.tracks.length > 0 && (
                <div className="flex flex-col gap-2 w-full pl-8">
                  {msg.tracks.map((track) => (
                    <div
                      key={track.trackId}
                      className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={track.artworkUrl100}
                          alt={track.trackName}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-medium text-white truncate">{track.trackName}</span>
                          <span className="text-xs text-gray-400 truncate">
                            {track.artistName}
                            {track.primaryGenreName && <> · {track.primaryGenreName}</>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* 플레이리스트 추가 버튼 */}
                          {isLoggedIn && (
                            <button
                              onClick={() => { loadPlaylists(); setAddingTrack(track); }}
                              title="플레이리스트에 추가"
                              className={`w-7 h-7 flex items-center justify-center rounded-full border transition-all ${
                                addStatus[track.trackId] === "done"
                                  ? "border-green-500/40 text-green-400"
                                  : addStatus[track.trackId] === "error"
                                  ? "border-red-400/40 text-red-400"
                                  : "border-white/20 text-gray-400 hover:border-red-500/40 hover:text-white"
                              }`}
                            >
                              {addStatus[track.trackId] === "done" ? <FaCheck size={9} /> : <FaPlus size={9} />}
                            </button>
                          )}
                          {/* 미리듣기 버튼 */}
                          {track.previewUrl && (
                            <button
                              onClick={() => handlePreview(track)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                            >
                              {previewSong?.id === track.trackId ? <FaPause size={10} /> : <FaPlay size={10} />}
                            </button>
                          )}
                        </div>
                      </div>
                      {track.reason && (
                        <p className="text-xs text-gray-200 leading-relaxed border-t border-white/5 pt-2">
                          {track.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                <FaRobot size={10} />
              </div>
              <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 플레이리스트 선택 모달 */}
        {addingTrack && (
          <div className="absolute inset-0 z-20 flex flex-col justify-end">
            {/* 배경 오버레이 */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setAddingTrack(null)}
            />
            {/* 바텀 시트 */}
            <div className="relative bg-[#13131f] rounded-t-2xl shadow-2xl overflow-hidden">
              {/* 핸들 바 */}
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-8 h-1 rounded-full bg-white/20" />
              </div>
              {/* 트랙 미리보기 헤더 */}
              <div className="px-4 py-4 flex items-center gap-3 border-b border-white/10">
                <img
                  src={addingTrack.artworkUrl100}
                  alt={addingTrack.trackName}
                  className="w-12 h-12 rounded-xl object-cover shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{addingTrack.trackName}</p>
                  <p className="text-xs text-gray-400 truncate">{addingTrack.artistName}</p>
                </div>
                <button
                  onClick={() => setAddingTrack(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all flex-shrink-0"
                >
                  <FaTimes size={10} />
                </button>
              </div>
              {/* 섹션 레이블 */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-sm font-semibold text-gray-200">플레이리스트 선택</p>
              </div>
              {/* 플레이리스트 목록 */}
              <div className="max-h-52 overflow-y-auto py-2">
                {playlists.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <FaPlus size={13} className="text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-400">플레이리스트가 없습니다</p>
                    <p className="text-[11px] text-gray-600">먼저 플레이리스트를 만들어보세요</p>
                  </div>
                ) : (
                  playlists.map((pl) => {
                    const isThisLoading = addingPlaylistId === pl.id;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => handleAddToPlaylist(pl.id)}
                        disabled={addingPlaylistId !== null}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                          {pl.imageUrl ? (
                            <img src={pl.imageUrl} alt={pl.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-700/30 to-purple-800/30">
                              <span className="text-sm text-red-400">♪</span>
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-left text-sm text-gray-200 truncate">{pl.title}</span>
                        {isThisLoading ? (
                          <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <FaChevronRight size={10} className="text-gray-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 빠른 선택 옵션 */}
        {!isLoading && (
          <div className="border-t border-white/5 flex-shrink-0">
            {/* 현재 미리듣기 중인 곡 기반 추천 */}
            {previewSong && (
              <div className="px-3 pt-2">
                <button
                  onClick={() =>
                    sendMessage(
                      `"${previewSong.trackName}" - ${previewSong.artistName} 이 곡과 비슷한 음악을 추천해줘`,
                      `🎵 "${previewSong.trackName}"과 비슷한 음악 추천`
                    )
                  }
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 hover:bg-teal-500/20 transition-colors flex items-center gap-2"
                >
                  <FaPlay size={8} />
                  <span className="truncate">"{previewSong.trackName}"과 비슷한 음악 추천</span>
                </button>
              </div>
            )}

            <>
                {category !== "main" && (
                  <div className="flex items-center gap-2 px-3 pt-2">
                    <button
                      onClick={() => setCategory(PARENT_CATEGORY[category] ?? "main")}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-2.5 py-0.5 transition-all"
                    >
                      <FaChevronLeft size={8} />
                      이전
                    </button>
                    <span className="text-xs font-medium text-gray-300">{CATEGORIES[category].label}</span>
                  </div>
                )}

                {/* 기분 선택 UI (음악 추천 카테고리일 때만) */}
                {category === "recommend_mood" && (
                  <div className="px-3 pt-2">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      {MOODS.map((mood) => (
                        <button
                          key={mood.label}
                          onClick={() => sendMessage(mood.value, `${mood.emoji} ${mood.label} 음악 추천`)}
                          className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30 transition-all"
                        >
                          <span className="text-base leading-none">{mood.emoji}</span>
                          <span className="text-xs text-gray-400">{mood.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-3 py-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {currentOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleOption(opt.label, opt.value, opt.link, opt.links)}
                      className="px-2.5 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 text-xs text-indigo-300 hover:text-indigo-200 transition-all whitespace-nowrap"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
          </div>
        )}

        {/* 입력창 */}
        <div className="px-3 py-3 border-t border-white/10 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "답변 중..." : "메시지를 입력하세요 (Enter)"}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-500/50 placeholder-white/20 transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
          >
            <FaPaperPlane size={13} />
          </button>
        </div>
      </div>

      {/* 플로팅 버튼 (뱃지 포함) */}
      <div className={`fixed right-6 z-50 ${previewSong ? "bottom-28" : "bottom-6"}`}>
        <button
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          className="relative w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        >
          {isOpen ? <FaTimes size={20} /> : <FaCommentDots size={22} />}
          {!isOpen && hasUnread && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-[#0f0f1a] animate-pulse" />
          )}
        </button>
      </div>

      {/* 저장 결과 토스트 */}
      {toast && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white transition-all duration-300 ${
            previewSong ? "bottom-24" : "bottom-8"
          } ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
            <FaTimes size={11} />
          </button>
        </div>
      )}

    </>
  );
}

export default ChatbotButton;
