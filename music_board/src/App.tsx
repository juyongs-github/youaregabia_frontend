import { Routes, Route } from 'react-router-dom';
import AppLayout from './component/layout/AppLayout';
import BoardListPage from './pages/BoardListPage';
import BoardDetailPage from './pages/BoardDetailPage';
import BoardWritePage from './pages/BoardWrite';
import BoardUpdate from './pages/BoardUpdate';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/boards" element={<BoardListPage />} />
        <Route path="/boards/:boardId" element={<BoardDetailPage />} />
        <Route path="/boards/new" element={<BoardWritePage />} />
        <Route path="/boards/:boardId" element={<BoardDetailPage />} />
        <Route path="/boards/:boardId/update" element={<BoardUpdate />} />
      </Route>
    </Routes>
  );
}

export default App;
