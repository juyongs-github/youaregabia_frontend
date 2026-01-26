import { useEffect, useRef, useState } from "react";
import "../../styles/auth.css";
import { register, checkEmailDuplicate } from "../../api/auth";
// [CI-TEMP-OFF] SMS 인증(Mock) -> CI 인증으로 교체하므로 일단 주석/삭제 대상
// import { sendSmsCode, verifySmsCode } from "../../api/sms";
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

  // [CI-ADD] CI 값 (본인인증 완료 시 생성)
  ci?: string;
}

function RegisterForm() {
  // [CI-TEMP-OFF] SMS 인증(Mock) 관련 state -> CI 인증으로 교체하므로 삭제/주석 대상
  // const [isCodeSent, setIsCodeSent] = useState(false);
  // const [verificationCode, setVerificationCode] = useState("");
  // const [smsError, setSmsError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const canResend = resendSeconds === 0;



  // [CI-ADD] CI 본인인증 완료 여부 (기존 isPhoneVerified 역할)
  const [isCiVerified, setIsCiVerified] = useState(false);

  // [CI-ADD] 생성된 CI 값 저장
  const [ciValue, setCiValue] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);

  // [ADD] 이메일 중복체크 중 표시(UX)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const latestEmailRef = useRef("");
  const [emailTimer, setEmailTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

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
    phone?: string; // [CI-ADD] phone 즉시검증 표시용
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
    ci: undefined, // [CI-ADD]
  });

  const navigate = useNavigate();

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;

    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

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

  // [CI-ADD] 숫자만 뽑은 phone (모달로 전달/검증용)
  const phoneDigits = form.phone.replace(/\D/g, "");

  // [CI-ADD] phone 간단 검증(010 계열 + 10~11자리)
  const isPhoneValid = /^01[016789]\d{7,8}$/.test(phoneDigits);

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

  const isPasswordMatch =
    form.password !== "" && form.passwordcheck !== "" && form.password === form.passwordcheck;

  const isFormValid =
    !clientErrors.email &&
    !clientErrors.name &&
    !clientErrors.password &&
    !clientErrors.phone &&
    isEmailValid &&
    isPasswordMatch &&
    isCiVerified &&
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

      // [ADD] phone 즉시검증(숫자만 기준)
      case "phone": {
        if (!value) return "휴대폰 번호를 입력하세요.";
        const digits = value.replace(/\D/g, "");
        if (!/^01[016789]\d{7,8}$/.test(digits))
          return "휴대폰 번호 형식이 올바르지 않습니다. (예: 010-1234-5678)";
        return undefined;
      }

      default:
        return undefined;
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
      birthDate: error,
    }));
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    // 휴대폰 자동 하이픈
    if (name === "phone") {
      const formatted = formatPhoneNumber(value);

      // [CI-ADD] 폰 바꾸면 인증 무효 처리
      setIsCiVerified(false);
      setCiValue(null);

      setForm((prev) => ({ ...prev, phone: formatted, ci: undefined }));
      setClientErrors((prev) => ({ ...prev, phone: validateField("phone", formatted) }));
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

  // =========================================================
  // [CI-ADD] CI 본인인증 모달 상태/로직
  // =========================================================
  const [isCiModalOpen, setIsCiModalOpen] = useState(false);

  const [ciName, setCiName] = useState("");
  const [ciBirth, setCiBirth] = useState(""); // YYYYMMDD 입력 -> 내부에서 정리
  const [ciPhone, setCiPhone] = useState(""); // 모달에서 보여줄 전화번호(하이픈 포함)
  const [ciModalError, setCiModalError] = useState<string | null>(null);

  // [CI-ADD] 모달 열기 (회원가입 폼의 phone 값을 가져와서 이어받음)
  const openCiModal = () => {
    // 폰 유효성 먼저 체크
    const phoneErr = validateField("phone", form.phone);
    setClientErrors((prev) => ({ ...prev, phone: phoneErr }));

    if (phoneErr) return;

    setCiModalError(null);
    setCiName(form.name || ""); // 이름이 이미 입력돼있으면 편의로 채움
    setCiBirth(form.birthDate ? form.birthDate.replace(/\D/g, "") : ""); // YYYYMMDD로 정리
    setCiPhone(form.phone); // 화면에 보이는 값 그대로
    setIsCiModalOpen(true);
  };

  // [CI-ADD] CI 생성(재현 가능 Mock)
  const makeMockCi = (name: string, birthYYYYMMDD: string, phoneDigitsOnly: string) => {
    const raw = `${name}|${birthYYYYMMDD}|${phoneDigitsOnly}`;
    // btoa는 한글에 약하므로 encodeURIComponent로 감싸서 안전하게 처리
    const encoded = btoa(unescape(encodeURIComponent(raw)));
    return `MOCK-CI-${encoded}`;
  };

  const validateCiModal = () => {
    if (!ciName || ciName.trim().length < 2) return "이름은 2자 이상 입력하세요.";
    const birthDigits = ciBirth.replace(/\D/g, "");
    if (!/^\d{8}$/.test(birthDigits)) return "생년월일은 YYYYMMDD 8자리로 입력하세요.";
    const phoneDigitsOnly = ciPhone.replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(phoneDigitsOnly)) return "휴대폰 번호 형식이 올바르지 않습니다.";
    return null;
  };

  const completeCiAuth = () => {
    const err = validateCiModal();
    if (err) {
      setCiModalError(err);
      return;
    }

    const birthDigits = ciBirth.replace(/\D/g, "");
    const phoneDigitsOnly = ciPhone.replace(/\D/g, "");

    const newCi = makeMockCi(ciName.trim(), birthDigits, phoneDigitsOnly);

    // 부모 폼에 CI 주입 + 인증 완료 처리
    setCiValue(newCi);
    setIsCiVerified(true);

    setForm((prev) => ({
      ...prev,
      // CI 인증에서 사용한 이름/생년월일/폰을 "실제 본인정보"로 확정시키고 싶으면 여기서 동기화
      name: prev.name || ciName.trim(),
      birthDate: prev.birthDate || `${birthDigits.slice(0, 4)}-${birthDigits.slice(4, 6)}-${birthDigits.slice(6, 8)}`,
      phone: prev.phone || ciPhone,
      ci: newCi,
    }));

    setIsCiModalOpen(false);
  };

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

    if (!isCiVerified || !ciValue) {
      alert("본인인증을 완료해주세요");
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
        birthDate: form.birthDate,
        password: form.password,
        phoneNumber: form.phone,
        address: fullAddress,

        // [CI-ADD] DB NOT NULL(ci) 때문에 반드시 전송
        ci: ciValue,
      });

      alert("회원가입이 완료되었습니다.");
      navigate("/login");
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.code === "BUSINESS_ERROR") {
        setFieldErrors((prev) => ({
          ...prev,
          birthDate: data.message,
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
    <>
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
          {!clientErrors.email && isCheckingEmail && <p className="auth-message">이메일 확인 중...</p>}

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
            disabled={isCiVerified} // [CI-ADD] 본인인증 완료 후 잠금(원하면 제거)
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
            className={getFieldStatusClass("birthDate")}
            maxLength={10}
            disabled={isCiVerified} // [CI-ADD] 본인인증 완료 후 잠금(원하면 제거)
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
              disabled={isCiVerified}
              className={
                isCiVerified ? "input-success" : clientErrors.phone ? "input-error" : form.phone ? "" : ""
              }
            />

            <button
              type="button"
              className={`sub-button ${isCiVerified ? "success" : !isPhoneValid ? "disabled" : ""}`}
              disabled={isCiVerified || !isPhoneValid}
              onClick={openCiModal}
            >
              {isCiVerified ? "인증완료" : "본인인증하기"}
            </button>
          </div>

          {clientErrors.phone && <p className="auth-message error">{clientErrors.phone}</p>}

          {/* [CI-ADD] 인증 완료 시, 인증번호 입력란 없애고 문구만 노출 */}
          {isCiVerified && <p className="auth-message success">본인인증이 완료되었습니다.</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="address">Address</label>

          <div className="address-row">
            <input value={form.address} readOnly placeholder="주소" className={form.address ? "input-success" : ""} />
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

      {/* =========================================================
          [CI-ADD] CI 본인인증 모달 (오버레이)
          - 실제 본인인증 API처럼 "별도 인증창" 느낌
          ========================================================= */}
      {isCiModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setIsCiModalOpen(false)}
        >
          <div
            style={{
              width: "min(520px, 92vw)",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>본인인증</h2>
              <button
                type="button"
                className="sub-button"
                onClick={() => setIsCiModalOpen(false)}
              >
                닫기
              </button>
            </div>

            <p style={{ marginTop: 10, marginBottom: 16, opacity: 0.8, fontSize: 13 }}>
              (Mock) 실제 CI 본인인증 화면처럼 이름/생년월일/휴대폰을 확인합니다.
            </p>

            <div className="auth-field">
              <label>이름</label>
              <input
                type="text"
                placeholder="이름"
                value={ciName}
                onChange={(e) => setCiName(e.target.value)}
                className={ciName.trim().length >= 2 ? "input-success" : ""}
              />
            </div>

            <div className="auth-field">
              <label>생년월일</label>
              <input
                type="text"
                placeholder="YYYYMMDD"
                value={ciBirth}
                onChange={(e) => {
                  // 숫자만, 8자리 제한
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setCiBirth(digits);
                }}
                className={/^\d{8}$/.test(ciBirth.replace(/\D/g, "")) ? "input-success" : ""}
              />
            </div>

            <div className="auth-field">
              <label>휴대폰 번호</label>
              <input
                type="tel"
                placeholder="010-1234-5678"
                value={ciPhone}
                onChange={(e) => setCiPhone(formatPhoneNumber(e.target.value))}
                className={/^01[016789]\d{7,8}$/.test(ciPhone.replace(/\D/g, "")) ? "input-success" : ""}
              />
            </div>

            {ciModalError && <p className="auth-message error">{ciModalError}</p>}

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button type="button" className="auth-button" onClick={completeCiAuth}>
                인증완료
              </button>
              <button
                type="button"
                className="sub-button"
                onClick={() => setIsCiModalOpen(false)}
              >
                취소
              </button>
            </div>

            {/* 개발 확인용 (필요하면 지워) */}
            {ciValue && (
              <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7, wordBreak: "break-all" }}>
                생성된 CI: {ciValue}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default RegisterForm;
