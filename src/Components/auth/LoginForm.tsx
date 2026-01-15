import { useState } from "react";
import "../../styles/auth.css";

interface LoginFormValues {
  id: string;
  password: string;
}
function LoginForm() {
  const [form, setForm] = useState<LoginFormValues>({
    id: "",
    password: "",
  });

  function hadleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("login form:", form);
  }
  return (
    <form className="auth-box" onSubmit={handleSubmit}>
      <p className="auth-desc">Welcome Gabia Music</p>
      <div className="auth-field">
        <label htmlFor="">Email</label>
        <input type="id" name="id" placeholder="Email" value={form.id} onChange={hadleChange} />
      </div>
      <div className="auth-field">
        <label htmlFor="">Password</label>
        <input
          type="password"
          name="password"
          placeholder="password"
          value={form.password}
          onChange={hadleChange}
        />
      </div>
      {/* 소셜미디어 로그인창 들어올 곳  */}
      <div className="social-login-row">
        <button type="button" className="social-icon google" aria-label="Google Login">
          <img src="/public/icons/google.svg" alt="Google" />
        </button>

        <button type="button" className="social-icon kakao" aria-label="Kakao Login">
          <img src="/public/icons/kakao.svg" alt="Kakao" />
        </button>

        <button type="button" className="social-icon naver" aria-label="Naver Login">
          <img src="/public/icons/naver.svg" alt="Naver" />
        </button>
      </div>
      <a href="">
        <p>회원가입</p>
      </a>
      <a href="">
        <p>아이디/비밀번호 찾기</p>
      </a>
      <button type="submit" className="auth-button">
        로그인
      </button>
    </form>
  );
}

export default LoginForm;
