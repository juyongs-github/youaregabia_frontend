import { useEffect, useRef, useState } from "react";
import "../../styles/auth.css";
import { register, checkEmailDuplicate } from "../../api/auth";
import { sendSmsCode, verifySmsCode } from "../../api/sms";
import { useNavigate } from "react-router-dom";

interface RegisterFormValues {
  email: string;
  name: string;
  birthDate: string;
  password: string;
  passwordcheck: string;
  phone: string;
  // [FIX] 상세주소를 state로 들고 있어야 submit payload에 들어감
  // 주소 관련
  address: string;
  detailAddress: string;
}

function RegisterForm() {
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);

  // [ADD] 이메일 중복체크 중 표시(UX)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const latestEmailRef = useRef("");
  const [emailTimer, setEmailTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [smsError, setSmsError] = useState<string | null>(null);

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;

    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

  // [FIX/ADD] 재전송 쿨다운(연타 방지)
  const [resendSeconds, setResendSeconds] = useState(0);
  const canResend = resendSeconds === 0;

  /* ===============================
  주소 관련
  =============================== */
  const detailAddressRef = useRef<HTMLInputElement>(null);

  const [addressTouched, setAddressTouched] = useState(false);
  const [detailAddressTouched, setDetailAddressTouched] = useState(false);

  // 백엔드 Validation 에러 표시용
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    name?: string;
    birthDate?: string;
    password?: string;
    passwordcheck?: string;
  }>({});

  // 프론트 즉시 Validation
  const [clientErrors, setClientErrors] = useState<{
    email?: string;
    name?: string;
    birthDate?: string;
    password?: string;
    passwordcheck?: string;
  }>({});

  const [form, setForm] = useState<RegisterFormValues>({
    email: "",
    name: "",
    birthDate: "",
    password: "",
    passwordcheck: "",
    phone: "",
    address: "",
    detailAddress: "",
  });

  const navigate = useNavigate();

  /* ==================================================
  [UTIL] 휴대폰 번호 자동 포맷
  - 사용자는 숫자만 입력
  - 화면에는 010-1234-5678 형태로 표시
  ================================================== */
  function formatPhoneNumber(value: string) {
    const digits = value.replace(/\D/g, "");

    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    // 11자리 초과 방지
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  /* ======================================================
  1. 카카오 우편번호 스크립트 동적 로딩
  - index.html 수정 불필요
  - 이 컴포넌트가 처음 마운트될 때 1번만 로드
  ====================================================== */
  useEffect(() => {
    if (window.daum?.Postcode) return;

    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  /* ======================================================
     2. 주소 검색 팝업 실행
     - 선택 완료 시 address 세팅
     - 상세주소 input으로 자동 포커스
  ====================================================== */
  const openAddressSearch = () => {
    if (!window.daum?.Postcode) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도하세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        let fullAddress = data.address;
        let extraAddress = "";

        // 도로명 주소일 경우 법정동/건물명 조합
        if (data.addressType === "R") {
          if (data.bname) extraAddress += data.bname;
          if (data.buildingName) {
            extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddress) {
            fullAddress += ` (${extraAddress})`;
          }
        }

        setForm((prev) => ({
          ...prev,
          address: fullAddress,
        }));

        // UX: 주소 선택 후 바로 상세주소 입력
        setTimeout(() => {
          detailAddressRef.current?.focus();
        }, 0);
      },
    }).open();
  };

  // [ADD] 컴포넌트 unmount 시 타이머 정리
  useEffect(() => {
    return () => {
      if (emailTimer) clearTimeout(emailTimer);
    };
  }, [emailTimer]);

  // [ADD] SMS 재전송 카운트다운
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  const isPasswordMatch =
    form.password !== "" && form.passwordcheck !== "" && form.password === form.passwordcheck;

  const isFormValid =
    !clientErrors.email &&
    !clientErrors.name &&
    !clientErrors.password &&
    isEmailValid &&
    isPasswordMatch &&
    isPhoneVerified &&
    !isSubmitting;

  function getFieldStatusClass(
    field: "email" | "name" | "birthDate" | "password" | "passwordcheck"
  ) {
    const hasClientError = !!clientErrors[field];
    const hasServerError = !!fieldErrors[field];

    if (hasClientError || hasServerError) return "input-error";

    if (field === "email") {
      if (isEmailValid) return "input-success";
      return "";
    }

    const value = form[field];
    if (value && !hasClientError && !hasServerError) return "input-success";

    return "";
  }

  function validateField(name: string, value: string) {
    switch (name) {
      case "email":
        if (!value) return "이메일은 필수입니다.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "이메일 형식이 올바르지 않습니다.";
        return undefined;

      case "name":
        if (!value) return "이름은 필수입니다.";
        if (value.length < 2 || value.length > 20) return "이름은 2~20자여야 합니다.";
        return undefined;

      case "birthDate": {
        if (!value) return "생년월일은 필수입니다.";

        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "생년월일 형식은 YYYY-MM-DD 여야 합니다.";

        const date = new Date(value);
        if (isNaN(date.getTime())) return "유효하지 않은 생년월일입니다.";

        const min = new Date("1920-01-01");
        const max = new Date("2030-12-31");

        if (date < min || date > max) return "생년월일은 1920-01-01 ~ 2030-12-31 사이여야 합니다.";

        return undefined;
      }
    }
  }

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBirthDate(e.target.value);

    setForm((prev) => ({
      ...prev,
      birthDate: formatted,
    }));

    const error = validateField("birthDate", formatted);
    setClientErrors((prev) => ({
      ...prev,
      birthDate: error, // ✅ [ADD]
    }));
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    // 휴대폰 자동 하이픈
    if (name === "phone") {
      const formatted = formatPhoneNumber(value);
      setForm((prev) => ({ ...prev, phone: formatted }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 프론트 즉시 Validation
    const error = validateField(name, value);
    setClientErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    // [FIX] email 변경 시 중복체크 상태 초기화 + 디바운스 체크
    if (name === "email") {
      latestEmailRef.current = value;
      setEmailMessage(null);
      setIsEmailValid(false);

      if (emailTimer) clearTimeout(emailTimer);

      const timer = setTimeout(() => {
        if (!error) checkEmail(value); // 형식 맞을 때만 호출
      }, 500);

      setEmailTimer(timer);
    }
  }

  // 이메일 중복 체크
  async function checkEmail(email: string) {
    // [FIX] 기존 코드: API를 try 밖에서 1번, try 안에서 또 1번 호출(=총 2번 호출 버그)
    // [FIX] 호출 전에 기본 가드
    if (!email) return;

    setIsCheckingEmail(true);

    try {
      const res = await checkEmailDuplicate(email);

      // 응답이 현재 입력값과 다르면 무시(레이스 방지)
      if (latestEmailRef.current !== email) return;

      const isDuplicated = res.data === true;

      if (isDuplicated) {
        setEmailMessage("이미 사용 중인 이메일입니다.");
        setIsEmailValid(false);
      } else {
        setEmailMessage("사용 가능한 이메일입니다.");
        setIsEmailValid(true);
      }
    } catch {
      setEmailMessage("이메일 확인 중 오류가 발생했습니다.");
      setIsEmailValid(false);
    } finally {
      setIsCheckingEmail(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isEmailValid) {
      setEmailMessage("이메일 중복 확인을 완료해주세요.");
      return;
    }

    if (!isPasswordMatch) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isPhoneVerified) {
      alert("휴대폰 인증을 완료해주세요");
      return;
    }

    // [FIX] 주소 + 상세주소 합쳐서 전송(백엔드가 address 1필드 기준이므로)
    const fullAddress = form.detailAddress
      ? `${form.address} ${form.detailAddress}`.trim()
      : form.address;

    try {
      setIsSubmitting(true);

      await register({
        email: form.email,
        name: form.name,
        birthDate: form.birthDate, // ✅ 추가
        password: form.password,
        phoneNumber: form.phone,
        address: fullAddress,
      });

      alert("회원가입이 완료되었습니다.");
      navigate("/login");
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.code === "BUSINESS_ERROR") {
        setFieldErrors((prev) => ({
          ...prev,
          birthDate: data.message, // ✅ 서버 범위 에러 연결
        }));
        return;
      }

      if (data?.errors) {
        setFieldErrors(data.errors);
        return;
      }
      alert("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-box" onSubmit={handleSubmit}>
      <h1>회원가입</h1>
      <p className="auth-desc">Create your account to start streaming.</p>

      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="이메일"
          value={form.email}
          onChange={handleChange}
          className={getFieldStatusClass("email")}
        />
        {clientErrors.email && <p className="auth-message error">{clientErrors.email}</p>}

        {/* [ADD] 확인중 표시 */}
        {!clientErrors.email && isCheckingEmail && (
          <p className="auth-message">이메일 확인 중...</p>
        )}

        {!clientErrors.email && !isCheckingEmail && emailMessage && (
          <p className={`auth-message ${isEmailValid ? "success" : "error"}`}>{emailMessage}</p>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="이름"
          value={form.name}
          onChange={handleChange}
          className={getFieldStatusClass("name")}
        />
        {clientErrors.name && <p className="auth-message error">{clientErrors.name}</p>}
        {fieldErrors.name && <p className="auth-message error">{fieldErrors.name}</p>}
      </div>

      <div className="auth-field">
        <label htmlFor="birthDate">생년월일</label>
        <input
          id="birthDate"
          name="birthDate"
          type="text"
          value={form.birthDate}
          placeholder="YYYYMMDD"
          onChange={handleBirthDateChange}
          className={getFieldStatusClass("birthDate")} // ✅ [FIX]
          maxLength={10}
        />
        {clientErrors.birthDate && <p className="auth-message error">{clientErrors.birthDate}</p>}

        {fieldErrors.birthDate && <p className="auth-message error">{fieldErrors.birthDate}</p>}
      </div>

      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
          className={getFieldStatusClass("password")}
        />
        {clientErrors.password && <p className="auth-message error">{clientErrors.password}</p>}
        {fieldErrors.password && <p className="auth-message error">{fieldErrors.password}</p>}
      </div>

      <div className="auth-field">
        <label>Password Check</label>
        <input
          name="passwordcheck"
          type="password"
          placeholder="비밀번호 확인"
          value={form.passwordcheck}
          onChange={handleChange}
          className={form.passwordcheck ? (isPasswordMatch ? "input-success" : "input-error") : ""}
        />
        {form.passwordcheck && !isPasswordMatch && (
          <p className="auth-message error">비밀번호가 일치하지 않습니다.</p>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="phone">Phone</label>

        <div className="phone-row">
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="010-1234-5678 "
            value={form.phone}
            onChange={handleChange}
            disabled={isPhoneVerified}
            className={isPhoneVerified ? "input-success" : form.phone ? "input-error" : ""}
          />

          <button
            type="button"
            className={`sub-button ${isPhoneVerified ? "success" : isCodeSent ? "disabled" : ""}`}
            disabled={isPhoneVerified || (isCodeSent && !canResend)}
            onClick={async () => {
              if (!form.phone) {
                setSmsError("휴대폰 번호를 입력하세요.");
                return;
              }

              try {
                const res = await sendSmsCode(form.phone);

                setIsCodeSent(true);
                setSmsError(null);

                // [ADD] 30초 재전송 쿨다운
                setResendSeconds(30);

                if (res.mockCode) console.log("MOCK CODE:", res.mockCode);
              } catch {
                setSmsError("인증번호 전송에 실패했습니다.");
              }
            }}
          >
            {isPhoneVerified
              ? "인증완료"
              : isCodeSent
                ? canResend
                  ? "재전송"
                  : `전송됨(${resendSeconds}s)`
                : "인증번호 요청"}
          </button>
        </div>

        {isCodeSent && !isPhoneVerified && (
          <div className="phone-auth-row">
            <input
              placeholder="인증번호"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className={smsError ? "input-error" : ""}
            />
            <button
              type="button"
              className="sub-button"
              onClick={async () => {
                const res = await verifySmsCode(form.phone, verificationCode);
                if (res.success) setIsPhoneVerified(true);
                else setSmsError("인증 실패");
              }}
            >
              확인
            </button>
          </div>
        )}

        {isPhoneVerified && <p className="auth-message success">휴대폰 인증이 완료되었습니다.</p>}
        {smsError && <p className="auth-message error">{smsError}</p>}
      </div>

      <div className="auth-field">
        <label htmlFor="address">Address</label>

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
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          className={form.detailAddress ? "input-success" : ""}
        />
      </div>

      <button type="submit" className="auth-button" disabled={!isFormValid}>
        회원가입
      </button>
    </form>
  );
}

export default RegisterForm;
