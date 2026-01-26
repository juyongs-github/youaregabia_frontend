import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
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

function App() {
  return (
    <Routes>
      {/* Layout 적용 화면만 Layout Route 안에 Route 추가 */}
      <Route element={<Layout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchResult />} />
        <Route path="/recommend/result" element={<RecommendPlaylistResult />} />
        <Route path="/community/share" element={<BoardListPage />} />
        <Route path="/community/share/:boardId" element={<BoardDetailPage />} />
        <Route path="/community/share/new" element={<BoardWrite />} />
        <Route path="/community/share/:boardId/update" element={<BoardUpdate />} />
      </Route>
      {/* 아닌 것들은 여기 밑으로 Route 추가 */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
    </Routes>
  );
}

export default App;
