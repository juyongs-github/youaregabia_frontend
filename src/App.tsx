import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./store";
import { loginSuccess, REMEMBER_KEY } from "./store/authSlice";
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
import CiVerifyPage from "./pages/auth/CiverifyPage";
import MyPlaylistPage from "./pages/playlist/MyPlaylistPage";
import PlaylistDetailPage from "./pages/playlist/PlaylistDetailPage";
import CollaboPlaylistPage from "./pages/community/CollaboPlaylistPage";
import CollaboPlaylistDetailPage from "./pages/community/CollaboPlaylistDetailPage";
import MyPage from "./pages/auth/MyPage";
import OAuth2CallbackPage from "./pages/auth/OAuth2CallbackPage";
import SocialRegisterPage from "./pages/auth/SocialRegisterPage";
import FindAccountPage from "./pages/auth/FindAccountPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminLoginLogsPage from "./pages/admin/AdminLoginLogsPage";
import AdminActivityLogsPage from "./pages/admin/AdminActivityLogsPage";
import AdminGoodsPage from "./pages/admin/AdminGoodsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminPointsPage from "./pages/admin/AdminPointsPage";
import FreeBoardListPage from "./pages/community/FreeBoardListPage";
import FreeBoardCreatePage from "./pages/community/FreeBoardCreatePage";
import FreeBoardDetailPage from "./pages/community/FreeBoardDetailPage";
import FreeBoardUpdate from "./pages/community/FreeBoardUpdate";
import PlaylistReviewPage from "./pages/playlist/PlaylistReviewPage";
import BlindRecommendPage from "./pages/recommend/BlindRecommendPage";
import MusicQuizPage from "./pages/game/MusicQuizPage";
import AlbumQuizPage from "./pages/game/AlbumQuizPage";
import GoodsListPage from "./pages/goods/GoodsListPage";
import GoodsDetailPage from "./pages/goods/GoodsDetailPage";
import CartPage from "./pages/goods/CartPage";
import OrderPage from "./pages/goods/OrderPage";
import OrderCompletePage from "./pages/goods/OrderCompletePage";
import OrderSuccessPage from "./pages/goods/OrderSuccessPage";
import OrderFailPage from "./pages/goods/OrderFailPage";
import OrderHistoryPage from "./pages/goods/OrderHistoryPage";
import CriticWrite from "./pages/recommend/CriticWrite";
import CriticListPage from "./pages/recommend/CriticListPage";
import MatchingGamePage from "./pages/game/MatchingGamePage";
import PointHistoryPage from "./pages/auth/PointHistoryPage";
import IdealTypeWorldCupPage from "./pages/recommend/IdealTypeWorldCupPage";
import { useEffect, useState } from "react";
import { setRateLimitHandler } from "./api/axios";
import RateLimitToast from "./components/ui/RateLimitToast";
import { useAttendance } from "./components/ui/useAttendance";
import AttendancePage from "./pages/auth/AttendancePage";

interface RateLimitInfo {
  message: string;
  remainSeconds: number;
}

function App() {
  const dispatch = useDispatch();
  // 2. Redux Store에서 로그인 여부 가져오기
  const isLogin = useSelector((state: RootState) => state.auth.isLoggedIn);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const loginRedirect = userRole === "ADMIN" ? "/admin" : "/home";
  // 매크로 방지 alert
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  // 로그인 상태 유지 체크 시 localStorage에서 복원
  useEffect(() => {
    if (!isLogin) {
      try {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
          const { user } = JSON.parse(saved);
          dispatch(loginSuccess(user));
        }
      } catch {
        localStorage.removeItem(REMEMBER_KEY);
      }
    }
  }, []);

  // axios interceptor에서 호출할 수 있도록 핸들러 등록
  useEffect(() => {
    setRateLimitHandler((message, remainSeconds) => {
      setRateLimitInfo({ message, remainSeconds });
    });
  }, []);

  useAttendance(); // 🆕 로그인 시 자동 출석 체크

  return (
    <>
      <Routes>
        {/* HomePage — 자체 Header/풀페이지 레이아웃, Layout 없이 */}
        <Route path="/home" element={isLogin ? <HomePage /> : <Navigate to="/login" replace />} />

        {/* Layout 적용 화면만 Layout Route 안에 Route 추가 */}
        <Route element={isLogin ? <Layout /> : <Navigate to="/login" replace />}>
          <Route path="/search" element={<SearchResult />} />
          <Route path="/recommend/result" element={<RecommendPlaylistResult />} />
          <Route path="/recommend/blind" element={<BlindRecommendPage />} />
          <Route path="/recommend/critic/write" element={<CriticWrite />} />
          <Route path="/recommend/critic/:boardId" element={<BoardDetailPage />} />
          <Route path="/recommend/critic" element={<CriticListPage />} />
          <Route path="/recommend/worldcup" element={<IdealTypeWorldCupPage />} />
          <Route path="/game/music-quiz" element={<MusicQuizPage />} />
          <Route path="/game/album-quiz" element={<AlbumQuizPage />} />
          <Route path="/game/card-match" element={<MatchingGamePage />} />
          <Route path="/playlist/me" element={<MyPlaylistPage />} />
          <Route path="/playlist/me/:playlistId" element={<PlaylistDetailPage />} />
          <Route path="/playlist/review" element={<PlaylistReviewPage />} />
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
          <Route path="/profile/points" element={<PointHistoryPage />} />
          <Route path="/profile/check" element={<AttendancePage />} />
          <Route path="/goods" element={<GoodsListPage />} />
          <Route path="/goods/cart" element={<CartPage />} />
          <Route path="/goods/order/complete" element={<OrderCompletePage />} />
          <Route path="/goods/order/success" element={<OrderSuccessPage />} />
          <Route path="/goods/order/fail" element={<OrderFailPage />} />
          <Route path="/goods/order" element={<OrderPage />} />
          <Route path="/goods/orders" element={<OrderHistoryPage />} />
          <Route path="/goods/:goodsId" element={<GoodsDetailPage />} />
        </Route>
        {/* 관리자 대시보드 (메인 Layout 없이 독립 렌더링) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="login-logs" element={<AdminLoginLogsPage />} />
          <Route path="activity-logs" element={<AdminActivityLogsPage />} />
          <Route path="goods" element={<AdminGoodsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="points" element={<AdminPointsPage />} />
        </Route>
        {/* 아닌 것들은 여기 밑으로 Route 추가 */}
        {/* 4. 로그인하지 않은 사용자만 접근 가능한 경로 (이미 로그인했다면 홈으로 이동) */}
        <Route
          path="/login"
          element={!isLogin ? <LoginForm /> : <Navigate to={loginRedirect} replace />}
        />
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
      {/* 전역 UI — 어느 페이지에서든 표시됨-> 매크로방지 alert */}
      {rateLimitInfo && (
        <RateLimitToast
          message={rateLimitInfo.message}
          remainSeconds={rateLimitInfo.remainSeconds}
          onClose={() => setRateLimitInfo(null)}
        />
      )}
    </>
  );
}

export default App;
