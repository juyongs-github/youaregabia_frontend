import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import "./App.css";
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import SearchResult from "./pages/home/SearchResult";
import RecommendPlaylistResult from "./pages/recommend/RecommendPlaylistResult";
import HomePage from "./pages/home/HomePage";
import BoardListPage from "./pages/community/BoardListPage";
import BoardDetailPage from "./pages/community/BoardDetailPage";
import BoardWrite from "./pages/community/BoardWrite";
import BoardUpdate from "./pages/community/BoardUpdate";
import Layout from "./Components/layout/Layout";
import LoginForm from "./pages/auth/LoginForm";
import RegisterForm from "./pages/auth/RegisterForm";
import TermsAgreement from "./pages/auth/TermsAgreement";
import CiVerifyPage from "./pages/auth/CiverifyPage";
import MyPlaylistPage from "./pages/playlist/MyPlaylistPage";
import PlaylistDetailPage from "./pages/playlist/PlaylistDetailPage";
import CollaboPlaylistPage from "./pages/community/CollaboPlaylistPage";
import CollaboPlaylistDetailPage from "./pages/community/CollaboPlaylistDetailPage";
import MyPage from "./pages/auth/MyPage";
import OAuth2CallbackPage from "./pages/auth/OAuth2CallbackPage";
import SocialRegisterPage from "./pages/auth/SocialRegisterPage";
import FindAccountPage from "./pages/auth/FindAccountPage";
import AdminPage from "./pages/admin/AdminPage";
import FreeBoardListPage from "./pages/community/FreeBoardListPage";
import FreeBoardCreatePage from "./pages/community/FreeBoardCreatePage";
import FreeBoardDetailPage from "./pages/community/FreeBoardDetailPage";
import FreeBoardUpdate from "./pages/community/FreeBoardUpdate";

function App() {
  // 2. Redux Store에서 로그인 여부 가져오기
  const isLogin = useSelector((state: RootState) => state.auth.isLoggedIn);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const loginRedirect = userRole === "ADMIN" ? "/admin" : "/home";

  return (
    <Routes>
      {/* Layout 적용 화면만 Layout Route 안에 Route 추가 */}
      <Route element={isLogin ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchResult />} />
        <Route path="/recommend/result" element={<RecommendPlaylistResult />} />
        <Route path="/playlist/me" element={<MyPlaylistPage />} />
        <Route path="/playlist/me/:playlistId" element={<PlaylistDetailPage />} />
        <Route path="/community/share" element={<BoardListPage />} />
        <Route path="/community/share/:boardId" element={<BoardDetailPage />} />
        <Route path="/community/share/new" element={<BoardWrite />} />
        <Route path="/community/share/:boardId/update" element={<BoardUpdate />} />
        <Route path="/community/collabo" element={<CollaboPlaylistPage />} />
        <Route path="/community/collabo/detail/:id" element={<CollaboPlaylistDetailPage />} />
        <Route path="/community/free" element={<FreeBoardListPage />} />
        <Route path="/community/free/:boardId" element={<FreeBoardDetailPage />} />
        <Route path="/community/free/new" element={<FreeBoardCreatePage />} />
        <Route path="/community/free/:boardId/update" element={<FreeBoardUpdate />} />
        <Route path="/profile/me" element={<MyPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      {/* 아닌 것들은 여기 밑으로 Route 추가 */}
      {/* 4. 로그인하지 않은 사용자만 접근 가능한 경로 (이미 로그인했다면 홈으로 이동) */}
      <Route path="/login" element={!isLogin ? <LoginForm /> : <Navigate to={loginRedirect} replace />} />
      <Route
        path="/register"
        element={!isLogin ? <TermsAgreement /> : <Navigate to={loginRedirect} replace />}
      />

      {/* 5. 기타 경로 처리 */}
      <Route path="/auth/ci" element={<CiVerifyPage />} />
      <Route path="/auth/" element={<RegisterForm />} />

      {/* 소셜 로그인 OAuth2 콜백 */}
      <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
      <Route path="/social-register" element={<SocialRegisterPage />} />

      {/* 아이디/비밀번호 찾기 */}
      <Route path="/find" element={<FindAccountPage />} />

      {/* 6. 초기 접속 시 경로 설정 */}
      <Route path="/" element={<Navigate to={isLogin ? loginRedirect : "/login"} replace />} />
    </Routes>
  );
}

export default App;
