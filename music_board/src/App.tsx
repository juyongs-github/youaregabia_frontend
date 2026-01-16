import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BoardListPage from './pages/BoardListPage';
import BoardDetailPage from './pages/BoardDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/boards" />} />
        <Route path="/boards" element={<BoardListPage />} />
        <Route path="/boards/:boardId" element={<BoardDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
