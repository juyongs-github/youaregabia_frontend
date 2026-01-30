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
import Layout from "./components/layout/Layout";
import LoginForm from "./pages/auth/LoginForm";
import RegisterForm from "./pages/auth/RegisterForm";
import TermsAgreement from "./pages/auth/TermsAgreement";
import CiVerifyPage from "./pages/auth/CiVerifyPage";

function App() {
  // 2. Redux Store에서 로그인 여부 가져오기
  const isLogin = useSelector((state: RootState) => state.auth.isLoggedIn);

  return (
    <Routes>
      {/* Layout 적용 화면만 Layout Route 안에 Route 추가 */}
      <Route element={isLogin ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchResult />} />
        <Route path="/recommend/result" element={<RecommendPlaylistResult />} />
        <Route path="/community/share" element={<BoardListPage />} />
        <Route path="/community/share/:boardId" element={<BoardDetailPage />} />
        <Route path="/community/share/new" element={<BoardWrite />} />
        <Route path="/community/share/:boardId/update" element={<BoardUpdate />} />
      </Route>
      {/* 아닌 것들은 여기 밑으로 Route 추가 */}
      {/* 4. 로그인하지 않은 사용자만 접근 가능한 경로 (이미 로그인했다면 홈으로 이동) */}
      <Route path="/login" element={!isLogin ? <LoginForm /> : <Navigate to="/home" replace />} />
      <Route path="/register" element={!isLogin ? <TermsAgreement /> : <Navigate to="/home" replace />} />

      {/* 5. 기타 경로 처리 */}
      <Route path="/auth/ci" element={<CiVerifyPage />} />
      <Route path="/auth/" element={<RegisterForm />} />

      {/* 6. 초기 접속 시 경로 설정 */}
      <Route path="/" element={<Navigate to={isLogin ? "/home" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
