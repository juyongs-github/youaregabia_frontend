import { useEffect, useRef, useState } from "react";
import "../../styles/auth-kfandom-core.css";
import { register, checkEmailDuplicate } from "../../api/auth";
import { useNavigate, useLocation } from "react-router-dom";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

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

const PW_CONDITIONS = [
  { label: "8자 이상", test: (pw: string) => pw.length >= 8 },
  { label: "영문 포함", test: (pw: string) => /[a-zA-Z]/.test(pw) },
  { label: "숫자 포함", test: (pw: string) => /[0-9]/.test(pw) },
  { label: "특수문자 포함 (!@#$% 등)", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

function RegisterForm() {
  const { toast, showToast, closeToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { ci, phone, name, birth } = (location.state || {}) as {
    ci?: string;
    phone?: string;
    name?: string;
    birth?: string;
  };

  useEffect(() => {
    if (!ci) {
      showToast("잘못된 접근입니다. 본인인증을 다시 진행해주세요.", "info");
      navigate("/auth/ci");
    }
  }, [ci, navigate]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이메일 상태: idle(입력 중) | checking(검사 중) | valid(사용 가능) | duplicate(중복됨)
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "valid" | "duplicate">(
    "idle"
  );
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestEmailRef = useRef("");

  const detailAddressRef = useRef<HTMLInputElement>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<RegisterFormValues>({
    email: "",
    name: name || "",
    birthDate: birth || "",
    password: "",
    passwordcheck: "",
    phone: phone || "",
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

  const validateEmailFormat = (email: string) => {
    if (!email) return "이메일은 필수입니다.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "이메일 형식이 올바르지 않습니다.";
    return "";
  };

  // 비밀번호 조건
  const pwConditionResults = PW_CONDITIONS.map((c) => c.test(form.password));
  const isPasswordValid = pwConditionResults.every(Boolean);
  const isPasswordMatch = form.password && form.password === form.passwordcheck;
  const isEmailValid = emailStatus === "valid";

  const isFormValid =
    isEmailValid &&
    !clientErrors.email &&
    form.name &&
    isPasswordValid &&
    isPasswordMatch &&
    form.address &&
    !isSubmitting;

  const getEmailInputClass = () => {
    if (emailStatus === "valid") return "input-success";
    if (emailStatus === "duplicate") return "input-error";
    return "";
  };

  const getFieldClass = (name: keyof RegisterFormValues) => {
    if (name === "passwordcheck" && form.passwordcheck)
      return isPasswordMatch ? "input-success" : "input-error";
    if (name === "password" && form.password)
      return isPasswordValid ? "input-success" : "input-error";
    if ((name === "name" || name === "birthDate" || name === "phone") && form[name])
      return "input-success";
    return form[name] && !clientErrors[name] ? "input-success" : "";
  };

  const checkEmail = async (email: string) => {
    setEmailStatus("checking");
    try {
      const res = await checkEmailDuplicate(email);
      if (latestEmailRef.current !== email) return;
      setEmailStatus(res.data === true ? "duplicate" : "valid");
    } catch {
      if (latestEmailRef.current === email) setEmailStatus("idle");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "birthDate") finalValue = formatBirthDate(value);

    setForm((prev) => ({ ...prev, [name]: finalValue }));

    if (name === "email") {
      latestEmailRef.current = finalValue;
      setEmailStatus("idle");
      setClientErrors((prev) => ({ ...prev, email: validateEmailFormat(finalValue) }));

      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);

      if (finalValue && !validateEmailFormat(finalValue)) {
        emailTimerRef.current = setTimeout(() => checkEmail(finalValue), 600);
      }
    }
  };

  useEffect(() => {
    if ((window as any).daum?.Postcode) return;
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const openAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        setForm((prev) => ({ ...prev, address: data.address }));
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
      showToast("회원가입이 완료되었습니다.", "success");
      navigate("/login");
    } catch {
      showToast("회원가입 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    <div className="auth-container">
      <form className="auth-box" onSubmit={handleSubmit}>
        <h1>회원가입</h1>
        <p className="auth-desc">정보를 입력하여 가입을 완료해 주세요.</p>

        {/* 이메일 — 자동 debounce 중복 체크 */}
        <div className="auth-field">
          <label>이메일</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className={getEmailInputClass()}
            placeholder="example@email.com"
          />
          {clientErrors.email && emailStatus === "idle" && (
            <p className="auth-message error">{clientErrors.email}</p>
          )}
          {emailStatus === "checking" && <p className="auth-message">확인 중...</p>}
          {emailStatus === "valid" && (
            <p className="auth-message success">사용 가능한 이메일입니다.</p>
          )}
          {emailStatus === "duplicate" && (
            <p className="auth-message error">이미 사용 중인 이메일입니다.</p>
          )}
        </div>

        <div className="auth-field">
          <label>이름</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className={getFieldClass("name")}
            readOnly={!!name}
          />
        </div>

        <div className="auth-field">
          <label>생년월일</label>
          <input
            name="birthDate"
            value={form.birthDate}
            onChange={handleChange}
            className={getFieldClass("birthDate")}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            readOnly={!!birth}
          />
        </div>

        {/* 비밀번호 + 실시간 조건 체크 */}
        <div className="auth-field">
          <label>비밀번호</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className={getFieldClass("password")}
          />
          {form.password && (
            <ul className="pw-conditions">
              {PW_CONDITIONS.map((c, i) => (
                <li key={i} className={pwConditionResults[i] ? "pw-cond-ok" : "pw-cond-fail"}>
                  {pwConditionResults[i] ? "✓" : "✗"} {c.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="auth-field">
          <label>비밀번호 확인</label>
          <input
            name="passwordcheck"
            type="password"
            value={form.passwordcheck}
            onChange={handleChange}
            className={
              form.passwordcheck ? (isPasswordMatch ? "input-success" : "input-error") : ""
            }
          />
          {form.passwordcheck && !isPasswordMatch && (
            <p className="auth-message error">비밀번호가 일치하지 않습니다.</p>
          )}
          {form.passwordcheck && isPasswordMatch && (
            <p className="auth-message success">비밀번호가 일치합니다.</p>
          )}
        </div>

        <div className="auth-field">
          <label>휴대폰</label>
          <div className="phone-row">
            <input name="phone" value={form.phone} readOnly className="input-success" />
            <button type="button" className="sub-button success" disabled>
              인증완료
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label>주소</label>
          <div className="address-row">
            <input
              value={form.address}
              readOnly
              placeholder="주소"
              className={form.address ? "input-success" : ""}
            />
            <button type="button" className="sub-button" onClick={openAddressSearch}>
              주소검색
            </button>
          </div>
          <input
            ref={detailAddressRef}
            name="detailAddress"
            value={form.detailAddress}
            onChange={handleChange}
            placeholder="상세주소"
            className={form.detailAddress ? "input-success" : ""}
          />
        </div>

        <button type="submit" className="auth-button" disabled={!isFormValid}>
          {isSubmitting ? "처리 중..." : "회원가입"}
        </button>
      </form>
    </div>
    </>
  );
}

export default RegisterForm;
