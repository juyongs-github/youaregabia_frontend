import { Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './component/layout/Layout';
import BoardListPage from './pages/BoardListPage';
import BoardDetailPage from './pages/BoardDetailPage';
import BoardWrite from './pages/BoardWrite';
import BoardUpdate from './pages/BoardUpdate';
// import SearchResult from "./pages/SearchResult";
// import Home from "./pages/Home";

function App() {
  return (
    <Routes>
      {/* Layout 적용 화면만 Layout Route 안에 Route 추가 */}
      <Route element={<Layout />}>
        {/* <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResult />} /> */}
        <Route path="/community/share" element={<BoardListPage />} />
        <Route path="/community/share/:boardId" element={<BoardDetailPage />} />
        <Route path="/community/share/new" element={<BoardWrite />} />
        <Route path="/community/share/:boardId/update" element={<BoardUpdate />} />

      </Route>
      {/* 아닌 것들은 여기 밑으로 Route 추가 */}
    </Routes>
  );
}

export default App;
