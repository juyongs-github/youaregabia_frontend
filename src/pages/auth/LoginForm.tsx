import { useState } from "react";
import { login } from "../../api/auth";
import "../../styles/auth.css";
import { Link, useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 소셜로그인 버튼 핸들러
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  function handleGoogleLogin() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  }

  function handleKakaoLogin() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
  }

  function handleNaverLogin() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/naver`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.email || !form.password) return alert("이메일과 비밀번호를 입력하세요.");

    try {
      setIsSubmitting(true);
      await login({ email: form.email, password: form.password });
      alert("로그인 성공");
      navigate("/home"); // 로그인 성공 후 홈페이지로 이동
    } catch (error: any) {
      alert(error.response?.data?.message || "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={handleSubmit}>
        <p className="auth-desc">Welcome Gabia Music</p>

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="password"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <div className="social-login-row">
          <button
            type="button"
            className="social-icon google"
            aria-label="Google Login"
            onClick={handleGoogleLogin}
          >
            <img src="/icons/google.svg" alt="Google" />
          </button>
          <button
            type="button"
            className="social-icon kakao"
            aria-label="Kakao Login"
            onClick={handleKakaoLogin}
          >
            <img src="/icons/kakao.svg" alt="Kakao" />
          </button>
          <button type="button" className="social-icon naver" aria-label="Naver Login">
            <img src="/icons/naver.svg" alt="Naver" />
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <Link to="/register">
            <p>회원가입</p>
          </Link>
          <Link to="/find">
            <p>아이디/비밀번호 찾기</p>
          </Link>
        </div>

        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
