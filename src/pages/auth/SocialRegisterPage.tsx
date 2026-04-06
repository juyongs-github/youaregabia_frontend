import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/authSlice";
import { sendSmsCode, verifySmsCode } from "../../api/sms";
import { verifyCiMock } from "../../api/auth";
import "../../styles/auth-kfandom-core.css";
import "../../styles/ci-auth-kfandom.css";

// 신규 소셜 유저가 본인인증 후 회원가입을 완료하는 페이지
function SocialRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = searchParams.get("token") ?? "";
  const initialName = searchParams.get("name") ?? "";

  const [name, setName] = useState(initialName);
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
    setTimer(180);
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

  const isNameValid = name.trim().length >= 2;
  const isNameError = name.length > 0 && !isNameValid;

  const birthError = useMemo(() => {
    if (!birth || birth.length < 10) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return "생년월일 형식이 올바르지 않습니다.";
    const [y, m, d] = birth.split("-").map(Number);
    if (y < 1920 || y > 2030) return "1920년 ~ 2030년 사이의 년도만 입력 가능합니다.";
    if (m < 1 || m > 12 || d < 1 || d > 31) return "올바른 날짜를 입력해주세요.";
    return null;
  }, [birth]);

  const isBirthValid = birth.length === 10 && !birthError;
  const isBirthError = birth.length === 10 && !!birthError;
  const phoneDigits = useMemo(() => phone.replace(/\D/g, ""), [phone]);
  const isPhoneValid = /^01[016789]\d{7,8}$/.test(phoneDigits);
  const isPhoneError = phone.length > 3 && !isPhoneValid;
  const isSmsCodeFormatValid = /^\d{6}$/.test(smsCode);

  const canRequestSms = isNameValid && isBirthValid && isPhoneValid && !smsVerified && !loadingSms;
  const canVerifySms = smsSent && !smsVerified && isSmsCodeFormatValid && !loadingSms;
  const canComplete = smsVerified && isNameValid && isBirthValid && !loadingCi;

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

  async function onComplete() {
    if (birthError || !token) return;
    setLoadingCi(true);
    setCiError(null);

    try {
      const ciRes = await verifyCiMock({ name, birthDate: birth, phoneNumber: phone });

      if (ciRes.exists) {
        // 기존 회원 → 사용자에게 연동 여부 확인
        const confirmed = window.confirm(
          "이미 가입된 회원입니다.\n소셜 계정을 기존 계정에 연동하시겠습니까?\n\n확인: 연동 후 로그인 페이지로 이동\n취소: 연동 안 함"
        );

        if (!confirmed) {
          navigate("/login", { replace: true });
          return;
        }

        const linkRes = await fetch("/api/auth/social/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, name, birthDate: birth, phoneNumber: phone, ci: ciRes.ci }),
        });

        if (!linkRes.ok) {
          setCiError("소셜 계정 연동에 실패했습니다.");
          return;
        }

        alert("소셜 계정이 기존 계정에 연동되었습니다.\n로그인 페이지에서 직접 로그인해 주세요.");
        navigate("/login", { replace: true });
        return;
      }

      if (!ciRes.success || !ciRes.ci) {
        setCiError(ciRes.message || "CI 인증 실패");
        return;
      }

      // 소셜 회원가입 완료 요청
      const res = await fetch("/api/auth/social/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, birthDate: birth, phoneNumber: phone, ci: ciRes.ci }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCiError(err.message || "회원가입에 실패했습니다.");
        return;
      }

      const data = await res.json();
      dispatch(
        loginSuccess({
          email: data.email,
          name: data.name,
          createDate: data.createdAt,
          imgUrl: data.imgUrl || undefined,
          token: data.token,
          role: data.role,
        })
      );
      navigate("/home", { replace: true });
    } catch {
      setCiError("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoadingCi(false);
    }
  }

  const getInputClass = (isValid: boolean, isError: boolean) => {
    if (isValid) return "input-success";
    if (isError) return "input-error";
    return "";
  };

  return (
    <div className="ci-page">
      <div className="ci-card">
        <h1 className="ci-title">본인인증</h1>
        <p className="ci-desc">소셜 계정 연동을 위해 본인 정보를 입력해 주세요.</p>

        <div className="ci-field">
          <label>이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={smsVerified}
            placeholder="성함을 입력하세요"
            className={getInputClass(isNameValid, isNameError)}
          />
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

          {smsMsg && <p className="ci-msg success">{smsMsg}</p>}
          {smsError && <p className="ci-msg error">{smsError}</p>}
        </div>

        <div className="ci-actions">
          <button type="button" className="ci-main-btn" disabled={!canComplete} onClick={onComplete}>
            {loadingCi ? "처리 중..." : "가입 완료"}
          </button>
          <button className="ci-cancel-btn" onClick={() => navigate("/login")}>
            취소
          </button>
        </div>
        {ciError && <p className="ci-msg error">{ciError}</p>}
      </div>
    </div>
  );
}

export default SocialRegisterPage;
