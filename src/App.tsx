<<<<<<< HEAD
import { Routes, Route } from 'react-router-dom';
import AppLayout from './component/layout/AppLayout';
import BoardListPage from './pages/BoardListPage';
import BoardDetailPage from './pages/BoardDetailPage';
import BoardWritePage from './pages/BoardWrite';
import BoardUpdate from './pages/BoardUpdate';
=======
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./layout/Layout";
// import SearchResult from "./pages/SearchResult";
// import Home from "./pages/Home";
>>>>>>> develop

function App() {
  return (
    <Routes>
<<<<<<< HEAD
      <Route element={<AppLayout />}>
        <Route path="/boards" element={<BoardListPage />} />
        <Route path="/boards/:boardId" element={<BoardDetailPage />} />
        <Route path="/boards/new" element={<BoardWritePage />} />
        <Route path="/boards/:boardId" element={<BoardDetailPage />} />
        <Route path="/boards/:boardId/update" element={<BoardUpdate />} />
      </Route>
=======
      {/* Layout 적용 화면만 Layout Route 안에 Route 추가 */}
      <Route element={<Layout />}>
        {/* <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResult />} /> */}
      </Route>
      {/* 아닌 것들은 여기 밑으로 Route 추가 */}
>>>>>>> develop
    </Routes>
  );
}

export default App;
