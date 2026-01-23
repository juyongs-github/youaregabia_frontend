import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Layout from "./layout/Layout";
// import SearchResult from "./pages/SearchResult";
// import Home from "./pages/Home";

function App() {
  return (
    <Routes>
      {/* Layout 적용 화면만 Layout Route 안에 Route 추가 */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
      {/* 아닌 것들은 여기 밑으로 Route 추가 */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
    </Routes>
  );
}

export default App;
