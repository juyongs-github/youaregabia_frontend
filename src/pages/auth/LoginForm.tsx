import { useMemo, useState } from "react";
import { login } from "../../api/auth";
import "../../styles/auth-kfandom.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/authSlice";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

function LoginForm() {
  const { toast, showToast, closeToast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(() => {
    return form.email.trim().length > 0 && form.password.trim().length > 0 && !isSubmitting;
  }, [form.email, form.password, isSubmitting]);

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
    if (!form.email || !form.password) {
      showToast("이메일과 비밀번호를 입력하세요.", "info");
      return;
    }

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

      showToast("로그인 성공", "success");
      if (response.data.role === "ADMIN") {
        setTimeout(() => navigate("/admin"), 350);
      } else {
        setTimeout(() => navigate("/home"), 350);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "로그인 정보가 올바르지 않습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="kf-auth-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <header className="kf-auth-header">
        <Link to="/" className="kf-brand" aria-label="GAP Music 홈으로 이동">
          <span className="kf-brand__logo">G</span>
          <span className="kf-brand__text">GAP Music</span>
        </Link>
        <div className="kf-auth-header__actions">
          <Link to="/register" className="kf-chip-link">
            회원가입
          </Link>
        </div>
      </header>

      <main className="kf-auth-main">
        <section className="kf-auth-hero">
          <p className="kf-auth-hero__eyebrow">GAP Music Login</p>
          <h1 className="kf-auth-hero__title">다시 만나 반가워요</h1>
          <p className="kf-auth-hero__desc">
            좋아하는 음악과 팬덤 커뮤니티를 이어주는 GAP Music에 로그인해보세요.
          </p>
        </section>

        <form className="kf-auth-card" onSubmit={handleSubmit}>
          <div className="kf-auth-card__top">
            <span className="kf-auth-badge">Welcome Back</span>
            <h2>로그인</h2>
          </div>

          <div className="kf-auth-field">
            <label htmlFor="email">이메일</label>
            <div className="kf-auth-inputWrap">
              <input
                id="email"
                type="email"
                name="email"
                placeholder="example@gapmusic.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="kf-auth-field">
            <label htmlFor="password">비밀번호</label>
            <div className="kf-auth-inputWrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="비밀번호를 입력해주세요"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="kf-auth-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>
          </div>

          <div className="kf-auth-row">
            <label className="kf-check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>로그인 상태 유지</span>
            </label>
            <Link to="/find" className="kf-auth-link">
              아이디/비밀번호 찾기
            </Link>
          </div>

          <button type="submit" className="kf-auth-submit" disabled={!canSubmit}>
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>

          <div className="kf-auth-divider">
            <span>간편 로그인</span>
          </div>

          <div className="kf-social-grid">
            <button
              type="button"
              className="kf-social-btn kf-social-btn--google"
              onClick={handleGoogleLogin}
            >
              <svg viewBox="0 0 48 48" aria-hidden="true" className="kf-social-icon">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5Z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7Z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.4 39.5 16.1 44 24 44Z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.7-6.1 7.4l6.2 5.2C39.1 37 44 31.1 44 24c0-1.3-.1-2.4-.4-3.5Z"
                />
              </svg>
              <span>Google로 계속하기</span>
            </button>

            <button
              type="button"
              className="kf-social-btn kf-social-btn--kakao"
              onClick={handleKakaoLogin}
            >
              <svg viewBox="0 0 48 48" aria-hidden="true" className="kf-social-icon">
                <rect x="4" y="4" width="40" height="40" rx="14" fill="#FEE500" />
                <path
                  fill="#181600"
                  d="M24 13c-7.2 0-13 4.6-13 10.3 0 3.7 2.5 7 6.2 8.8l-1.5 5.6c-.1.4.3.7.6.5l6.6-4.4c.3 0 .7.1 1 .1 7.2 0 13-4.6 13-10.3S31.2 13 24 13Z"
                />
              </svg>
              <span>Kakao로 계속하기</span>
            </button>

            <button
              type="button"
              className="kf-social-btn kf-social-btn--naver"
              onClick={handleNaverLogin}
            >
              <svg viewBox="0 0 48 48" aria-hidden="true" className="kf-social-icon">
                <rect x="4" y="4" width="40" height="40" rx="14" fill="#03C75A" />
                <path fill="#fff" d="M17 15h6.1l7.8 10.9V15H31v18h-6.1L17 22.1V33V15Z" />
              </svg>
              <span>NAVER로 계속하기</span>
            </button>
          </div>

          <div className="kf-auth-footer">
            <span>아직 계정이 없나요?</span>
            <Link to="/register" className="kf-auth-link kf-auth-link--strong">
              회원가입 하러가기
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default LoginForm;
