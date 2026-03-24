import { useState } from "react";
import { login } from "../../api/auth";
import "../../styles/auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/authSlice";

function LoginForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // function handleGoogleLogin() {
  //   window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  // }

  // function handleKakaoLogin() {
  //   window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
  // }

  // function handleNaverLogin() {
  //   window.location.href = `${API_BASE_URL}/oauth2/authorization/naver`;
  // }
  // ❌ 환경변수 방식 제거

  // ✅ 그냥 경로만 사용 (vite proxy가 처리)
  function handleGoogleLogin() {
    window.location.href = "/oauth2/authorization/google";
  }

  function handleKakaoLogin() {
    window.location.href = "/oauth2/authorization/kakao";
  }

  function handleNaverLogin() {
    window.location.href = "/oauth2/authorization/naver";
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
      const response = await login({ email: form.email, password: form.password });

      dispatch(
        loginSuccess({
          email: response.data.email || form.email,
          name: response.data.name || "사용자",
          createDate: response.data.createdAt,
          imgUrl: response.data.imgUrl || undefined,
          token: response.data.token,
          role: response.data.role,
          rememberMe,
        })
      );

      console.log("🔍 LOGIN RESPONSE:", response.data);
      console.log("🔍 ROLE VALUE:", response.data.role);
      alert("로그인 성공");
      if (response.data.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (error: any) {
      console.error("Login Error Details:", error.response?.data);
      alert(error.response?.data?.message || "로그인 정보가 올바르지 않습니다.");
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

        <div className="remember-me-row">
          <label className="remember-me-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>로그인 상태 유지</span>
          </label>
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
          <button
            type="button"
            className="social-icon naver"
            aria-label="Naver Login"
            onClick={handleNaverLogin}
          >
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
