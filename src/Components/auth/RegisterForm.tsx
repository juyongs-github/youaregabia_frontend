import { useState } from "react";
import "../../styles/auth.css";

interface RegisterFormValues {
  username: string;
  email: string;
  name: string;
  password: string;
  phone: string;
  address: string;
}
function RegisterForm() {
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [form, setForm] = useState<RegisterFormValues>({
    username: "",
    email: "",
    name: "",
    password: "",
    phone: "",
    address: "",
  });
  const isFormValid = form.username && form.email && form.name && form.password && isPhoneVerified;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isPhoneVerified) {
      alert("휴대폰 인증을 완료해주세요");
      return;
    }

    const payload = {
      ...form,
      phoneVerified: true,
    };

    console.log("register payload:", payload);
  }
  return (
    <form className="auth-box" onSubmit={handleSubmit}>
      <h1>회원가입</h1>

      <p className="auth-desc">Create your account to start streaming.</p>

      <div className="auth-field">
        <label htmlFor="username">ID</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="ID"
          value={form.username}
          onChange={handleChange}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="phone">Phone</label>

        <div className="phone-row">
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={handleChange}
            disabled={isPhoneVerified}
          />
          <button
            type="button"
            className="sub-button"
            disabled={isCodeSent}
            onClick={() => {
              if (!form.phone) {
                alert("휴대폰 번호를 입력하세요");
                return;
              }
              setIsCodeSent(true);
            }}
          >
            {isCodeSent ? "전송됨" : "인증번호 요청"}
          </button>
        </div>

        {/* 인증번호 입력칸은 isCodeSent === true 일 때만 보이게 */}
        {isCodeSent && !isPhoneVerified && (
          <div className="phone-auth-row">
            <input
              type="text"
              placeholder="인증번호 입력"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <button
              type="button"
              className="sub-button"
              onClick={() => {
                if (verificationCode.length < 4) {
                  alert("인증번호를 확인하세요");
                  return;
                }
                setIsPhoneVerified(true);
                alert("휴대폰 인증 완료");
              }}
            >
              확인
            </button>
          </div>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="address">Address</label>

        <div className="address-row">
          <input
            id="address"
            name="address"
            type="text"
            placeholder="주소"
            value={form.address}
            readOnly
          />
          <button type="button" className="sub-button">
            주소 검색
          </button>
        </div>

        <input type="text" placeholder="상세 주소" className="detail-address" />
      </div>

      <button type="submit" className="auth-button" disabled={!isFormValid}>
        회원가입
      </button>
    </form>
  );
}

export default RegisterForm;
