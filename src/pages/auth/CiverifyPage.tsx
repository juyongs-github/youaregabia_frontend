import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth-kfandom-core.css";
import "../../styles/ci-auth-kfandom.css";

import { sendSmsCode, verifySmsCode } from "../../api/sms";
import { verifyCiMock } from "../../api/auth";

const SMS_TIMEOUT = 180; // 3분

export default function CiVerifyPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [phone, setPhone] = useState("");

  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [smsVerified, setSmsVerified] = useState(false);
  const [smsMsg, setSmsMsg] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const [ciError, setCiError] = useState<string | null>(null);
  const [loadingSms, setLoadingSms] = useState(false);
  const [loadingCi, setLoadingCi] = useState(false);

  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const smsCodeInputRef = useRef<HTMLInputElement>(null);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(SMS_TIMEOUT);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function formatTimer(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const isNameValid = /^[가-힣]{2,10}$/.test(name.trim());
  const isNameError = name.length > 0 && !isNameValid;
  const nameErrorMsg = isNameError ? "이름은 한글 2~10자로 입력해주세요." : null;

  const birthError = useMemo(() => {
    if (!birth) return null;
    if (birth.length < 10) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return "생년월일 형식이 올바르지 않습니다.";

    const parts = birth.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (year < 1920 || year > 2030) return "1920년 ~ 2030년 사이의 년도만 입력 가능합니다.";
    if (month < 1 || month > 12 || day < 1 || day > 31) return "올바른 날짜를 입력해주세요.";

    return null;
  }, [birth]);

  const isBirthValid = birth.length === 10 && !birthError;
  const isBirthError = birth.length === 10 && !!birthError;

  const phoneDigits = useMemo(() => phone.replace(/\D/g, ""), [phone]);
  const isPhoneValid = /^01[016789]\d{7,8}$/.test(phoneDigits);
  const isPhoneError = phone.length > 3 && !isPhoneValid;
  const phoneErrorMsg = isPhoneError ? "올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)" : null;

  const isSmsCodeFormatValid = /^\d{6}$/.test(smsCode);

  function formatPhone(value: string) {
    const d = value.replace(/\D/g, "");
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }

  function formatBirth(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 4) return d;
    if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
  }

  const canRequestSms = isNameValid && isBirthValid && isPhoneValid && !smsVerified && !loadingSms;
  const canVerifySms = smsSent && !smsVerified && isSmsCodeFormatValid && !loadingSms;
  const canVerifyCi = smsVerified && isNameValid && isBirthValid && !loadingCi;

  async function onSendSms() {
    setSmsError(null);
    setSmsMsg(null);
    setSmsCode("");
    try {
      setLoadingSms(true);
      const res = await sendSmsCode(phone);
      setSmsSent(true);
      setSmsMsg(res.message || "인증번호가 발송되었습니다.");
      startTimer();
      setTimeout(() => smsCodeInputRef.current?.focus(), 100);
    } catch (e: any) {
      setSmsError(e.message || "인증번호 요청 실패");
    } finally {
      setLoadingSms(false);
    }
  }

  async function onVerifySms() {
    setSmsError(null);
    try {
      setLoadingSms(true);
      const res = await verifySmsCode(phone, smsCode);
      if (!res.success) {
        setSmsError(res.message || "인증 실패");
        return;
      }
      setSmsVerified(true);
      setSmsMsg("휴대폰 인증이 완료되었습니다.");
    } catch (e: any) {
      setSmsError(e.message || "인증 실패");
    } finally {
      setLoadingSms(false);
    }
  }

  const onVerifyCi = async () => {
    if (birthError) return;

    setLoadingCi(true);
    setCiError(null);
    try {
      const res = await verifyCiMock({ name, birthDate: birth, phoneNumber: phone });

      if (res.exists) {
        alert("이미 가입된 사용자입니다.\n로그인 페이지로 이동합니다.");
        navigate("/login");
        return;
      }

      if (res.success && res.ci) {
        navigate("/auth", {
          state: { ci: res.ci, phone, name, birth },
        });
      } else {
        setCiError(res.message || "CI 인증 실패");
      }
    } catch (err) {
      setCiError("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoadingCi(false);
    }
  };

  const getInputClass = (isValid: boolean, isError: boolean) => {
    if (isValid) return "input-success";
    if (isError) return "input-error";
    return "";
  };

  return (
    <div className="ci-page">
      <div className="ci-card">
        <div className="ci-badge-wrap">
          <span className="ci-badge">가입 전 마지막 확인 단계</span>
        </div>

        <h1 className="ci-title">본인인증</h1>
        <p className="ci-desc">회원가입을 위해 본인 정보를 입력해 주세요.</p>

        <div className="ci-field">
          <label>이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={smsVerified}
            placeholder="성함을 입력하세요"
            className={getInputClass(isNameValid, isNameError)}
          />
          {nameErrorMsg && <p className="ci-msg error">{nameErrorMsg}</p>}
        </div>

        <div className="ci-field">
          <label>생년월일</label>
          <input
            value={birth}
            onChange={(e) => setBirth(formatBirth(e.target.value))}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            disabled={smsVerified}
            className={getInputClass(isBirthValid, isBirthError)}
          />
          {birthError && <p className="ci-msg error">{birthError}</p>}
        </div>

        <div className="ci-field">
          <label>휴대폰 번호</label>
          <div className="ci-phone-row">
            <input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              disabled={smsVerified}
              placeholder="010-0000-0000"
              className={smsVerified ? "input-success" : getInputClass(isPhoneValid, isPhoneError)}
            />
            <button
              type="button"
              className={`ci-sub-btn ${smsVerified ? "success" : ""}`}
              disabled={!canRequestSms}
              onClick={!smsVerified ? onSendSms : undefined}
            >
              {smsVerified ? "인증완료" : loadingSms && !smsSent ? "전송 중..." : smsSent ? "재요청" : "인증번호 요청"}
            </button>
          </div>

          {smsSent && !smsVerified && (
            <div className="ci-sms-row" style={{ marginTop: "15px" }}>
              <input
                ref={smsCodeInputRef}
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.slice(0, 6))}
                placeholder="6자리 인증번호"
                className={getInputClass(isSmsCodeFormatValid, false)}
              />
              <button
                type="button"
                className="ci-sub-btn"
                disabled={!canVerifySms}
                onClick={onVerifySms}
              >
                {loadingSms ? "확인 중..." : timer > 0 ? `인증하기 (${formatTimer(timer)})` : "인증하기"}
              </button>
            </div>
          )}

          {phoneErrorMsg && <p className="ci-msg error">{phoneErrorMsg}</p>}
          {smsMsg && <p className="ci-msg success">{smsMsg}</p>}
          {smsError && <p className="ci-msg error">{smsError}</p>}
        </div>

        <div className="ci-actions">
          <button type="button" className="ci-main-btn" disabled={!canVerifyCi} onClick={onVerifyCi}>
            {loadingCi ? "처리 중..." : "인증완료"}
          </button>
          <button type="button" className="ci-cancel-btn" onClick={() => navigate(-1)}>
            이전
          </button>
        </div>

        {ciError && <p className="ci-msg error">{ciError}</p>}
      </div>
    </div>
  );
}
