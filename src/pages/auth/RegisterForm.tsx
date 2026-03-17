import { useEffect, useRef, useState } from "react";
import "../../styles/auth.css";
import { register, checkEmailDuplicate } from "../../api/auth";
import { useNavigate, useLocation } from "react-router-dom";

interface RegisterFormValues {
  email: string;
  name: string;
  birthDate: string;
  password: string;
  passwordcheck: string;
  phone: string;
  address: string;
  detailAddress: string;
  ci?: string;
}

function RegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. ✅ CiVerifyPage에서 보낸 데이터들(ci, phone, name, birth)을 모두 꺼냅니다.
  const { ci, phone, name, birth } = (location.state || {}) as {
    ci?: string;
    phone?: string;
    name?: string;
    birth?: string;
  };

  useEffect(() => {
    if (!ci) {
      alert("잘못된 접근입니다. 본인인증을 다시 진행해주세요.");
      navigate("/auth/ci");
    }
  }, [ci, navigate]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  const latestEmailRef = useRef("");
  const [emailTimer, setEmailTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const detailAddressRef = useRef<HTMLInputElement>(null);

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // 2. ✅ 꺼낸 값들을 폼의 초기값(form state)에 넣어줍니다.
  const [form, setForm] = useState<RegisterFormValues>({
    email: "",
    name: name || "",       // 넘어온 이름 자동 입력
    birthDate: birth || "", // 넘어온 생년월일 자동 입력
    password: "",
    passwordcheck: "",
    phone: phone || "",     // 넘어온 폰번호 자동 입력
    address: "",
    detailAddress: "",
    ci: ci,
  });

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

  const validateField = (name: string, value: string) => {
    if (name === "email") {
      if (!value) return "이메일은 필수입니다.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "이메일 형식이 올바르지 않습니다.";
    }
    if (name === "password" && value.length < 4) return "4자 이상 입력해주세요.";
    return "";
  };

  const isPasswordMatch = form.password && form.password === form.passwordcheck;
  const isFormValid = isEmailValid && !clientErrors.email && form.name && isPasswordMatch && form.address && !isSubmitting;

  const getFieldClass = (name: keyof RegisterFormValues) => {
    if (name === "email" && isEmailValid) return "input-success";
    if (name === "email" && emailMessage && !isEmailValid) return "input-error";
    if (name === "passwordcheck" && isPasswordMatch) return "input-success";
    // 본인인증으로 넘어온 값들은 바로 성공 스타일 적용
    if ((name === "name" || name === "birthDate" || name === "phone") && form[name]) return "input-success";
    return form[name] && !clientErrors[name] ? "input-success" : "";
  };

  const checkEmail = async (email: string) => {
    setIsCheckingEmail(true);
    setEmailMessage(null);
    try {
      const res = await checkEmailDuplicate(email);
      if (latestEmailRef.current !== email) return;

      if (res.data === true) {
        setEmailMessage("이미 사용 중인 이메일입니다.");
        setIsEmailValid(false);
      } else {
        setEmailMessage("사용 가능한 이메일입니다.");
        setIsEmailValid(true);
      }
    } catch (error) {
      setEmailMessage("중복 확인 중 오류가 발생했습니다.");
      setIsEmailValid(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "birthDate") finalValue = formatBirthDate(value);

    setForm(prev => ({ ...prev, [name]: finalValue }));
    setClientErrors(prev => ({ ...prev, [name]: validateField(name, finalValue) }));

    if (name === "email") {
      latestEmailRef.current = finalValue;
      setIsEmailValid(false);
      setEmailMessage(null);
      if (emailTimer) clearTimeout(emailTimer);

      if (finalValue && !validateField("email", finalValue)) {
        const timer = setTimeout(() => checkEmail(finalValue), 500);
        setEmailTimer(timer);
      }
    }
  };

  useEffect(() => {
    if (window.daum?.Postcode) return;
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const openAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        setForm(prev => ({ ...prev, address: data.address }));
        setTimeout(() => detailAddressRef.current?.focus(), 0);
      },
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    try {
      setIsSubmitting(true);
      await register({
        ...form,
        address: form.address,
        addressDetail: form.detailAddress,
        phoneNumber: form.phone,
      });
      alert("회원가입이 완료되었습니다.");
      navigate("/login");
    } catch {
      alert("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={handleSubmit}>
        <h1>회원가입</h1>
        <p className="auth-desc">정보를 입력하여 가입을 완료해 주세요.</p>

        <div className="auth-field">
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} className={getFieldClass("email")} placeholder="example@email.com" />
          {isCheckingEmail && <p className="auth-message">확인 중...</p>}
          {emailMessage && <p className={`auth-message ${isEmailValid ? "success" : "error"}`}>{emailMessage}</p>}
        </div>

        <div className="auth-field">
          <label>Name</label>
          {/* ✅ readOnly 속성을 추가해 인증된 정보 보호 */}
          <input name="name" value={form.name} onChange={handleChange} className={getFieldClass("name")} readOnly={!!name} />
        </div>

        <div className="auth-field">
          <label>생년월일</label>
          {/* ✅ readOnly 속성을 추가해 인증된 정보 보호 */}
          <input name="birthDate" value={form.birthDate} onChange={handleChange} className={getFieldClass("birthDate")} placeholder="YYYY-MM-DD" maxLength={10} readOnly={!!birth} />
        </div>

        <div className="auth-field">
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className={getFieldClass("password")} />
        </div>

        <div className="auth-field">
          <label>Password Check</label>
          <input name="passwordcheck" type="password" value={form.passwordcheck} onChange={handleChange} className={form.passwordcheck ? (isPasswordMatch ? "input-success" : "input-error") : ""} />
          {form.passwordcheck && !isPasswordMatch && <p className="auth-message error">비밀번호가 일치하지 않습니다.</p>}
        </div>

        <div className="auth-field">
          <label>Phone</label>
          <div className="phone-row">
            <input name="phone" value={form.phone} readOnly className="input-success" />
            <button type="button" className="sub-button success" disabled>인증완료</button>
          </div>
        </div>

        <div className="auth-field">
          <label>Address</label>
          <div className="address-row">
            <input value={form.address} readOnly placeholder="주소" className={form.address ? "input-success" : ""} />
            <button type="button" className="sub-button" onClick={openAddressSearch}>주소검색</button>
          </div>
          <input ref={detailAddressRef} name="detailAddress" value={form.detailAddress} onChange={handleChange} placeholder="상세주소" className={form.detailAddress ? "input-success" : ""} />
        </div>

        <button type="submit" className="auth-button" disabled={!isFormValid}>
          {isSubmitting ? "처리 중..." : "회원가입"}
        </button>
      </form>
    </div>
  );
}

export default RegisterForm;
