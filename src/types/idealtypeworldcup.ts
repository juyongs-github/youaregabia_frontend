// ============================================================
// TYPES — 노래 이상형 월드컵
// ============================================================

// 백엔드 SongDTO (iTunes 기준)
// ※ Spotify API로 교체 시 이 인터페이스와 normalizeSongDTO()만 수정
export interface SongDTO {
  id: number;
  trackName: string;
  artistName: string;
  previewUrl: string | null;
  imgUrl: string | null;
  releaseDate: string | null;
  durationMs: number | null;
  genreName: string | null;
}

// 프론트에서 사용하는 내부 Song 타입
// SongDTO에서 normalizeSongDTO()를 통해 변환됨
export interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string | null;
  previewUrl: string | null; // iTunes 30초 미리듣기 URL
}

// 화면 상태 — start: 강 선택 / game: 토너먼트 진행 / result: 결과
export type Screen = "start" | "game" | "result";

// useAudio 훅 반환 타입
export interface AudioState {
  playing: number | null; // 현재 재생 중인 곡의 id (null이면 미재생)
  progress: Record<number, number>; // 곡별 재생 진행률 { [songId]: 0~100 } — 이어듣기용
  play: (song: Song) => void; // 재생 / 일시정지 토글
  stop: () => void; // 즉시 정지 + 전체 초기화
}

// SongCard 컴포넌트 props
export interface SongCardProps {
  song: Song;
  onChoose: (song: Song) => void; // 이 곡 선택 버튼 클릭 시 호출
  isChosen: boolean; // 이 카드가 선택됐는지
  isLoser: boolean; // 상대 카드가 선택됐는지 (탈락)
  audio: AudioState;
}
