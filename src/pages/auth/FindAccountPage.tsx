import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendSmsCode, verifySmsCode } from "../../api/sms";
import "../../styles/auth.css";
import "../../styles/find-account.css";

type Tab = "id" | "password";
type Step = "input" | "verify" | "result";

// 전화번호 자동 하이픈 포맷
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function FindAccountPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("id");

  // 아이디 찾기 상태
  const [idName, setIdName] = useState("");
  const [idPhone, setIdPhone] = useState("");
  const [idCode, setIdCode] = useState("");
  const [idStep, setIdStep] = useState<Step>("input");
  const [idResult, setIdResult] = useState("");
  const [idError, setIdError] = useState("");
  const [idSendMsg, setIdSendMsg] = useState("");
  const [idVerifyMsg, setIdVerifyMsg] = useState("");
  const [idCodeVerified, setIdCodeVerified] = useState(false);

  // 비밀번호 찾기 상태
  const [pwEmail, setPwEmail] = useState("");
  const [pwPhone, setPwPhone] = useState("");
  const [pwCode, setPwCode] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwStep, setPwStep] = useState<Step>("input");
  const [pwError, setPwError] = useState("");
  const [pwSendMsg, setPwSendMsg] = useState("");
  const [pwVerifyMsg, setPwVerifyMsg] = useState("");
  const [pwCodeVerified, setPwCodeVerified] = useState(false);

  const [sending, setSending] = useState(false);

  // 인증번호 전송
  async function handleSendCode(phone: string, type: Tab) {
    if (type === "id") { setIdError(""); setIdSendMsg(""); setIdCodeVerified(false); }
    else { setPwError(""); setPwSendMsg(""); setPwCodeVerified(false); }
    try {
      setSending(true);
      await sendSmsCode(phone);
      if (type === "id") { setIdStep("verify"); setIdSendMsg("인증번호가 발송됐습니다."); }
      else { setPwStep("verify"); setPwSendMsg("인증번호가 발송됐습니다."); }
    } catch (e: any) {
      if (type === "id") setIdError(e.message || "인증번호 발송에 실패했습니다.");
      else setPwError(e.message || "인증번호 발송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  // 인증번호 확인 (아이디 찾기)
  async function handleVerifyIdCode() {
    setIdError("");
    try {
      const res = await verifySmsCode(idPhone, idCode);
      if (!res.success) { setIdError("인증번호가 올바르지 않습니다."); return; }
      setIdCodeVerified(true);
      setIdVerifyMsg("인증이 완료됐습니다.");
    } catch (e: any) {
      setIdError(e.message || "인증 실패");
    }
  }

  // 인증번호 확인 (비밀번호 찾기)
  async function handleVerifyPwCode() {
    setPwError("");
    try {
      const res = await verifySmsCode(pwPhone, pwCode);
      if (!res.success) { setPwError("인증번호가 올바르지 않습니다."); return; }
      setPwCodeVerified(true);
      setPwVerifyMsg("인증이 완료됐습니다.");
    } catch (e: any) {
      setPwError(e.message || "인증 실패");
    }
  }

  // 아이디 찾기 최종 조회
  async function handleFindId() {
    setIdError("");
    try {
      const res = await fetch("/api/auth/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: idName, phoneNumber: idPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setIdError(data.message || "일치하는 회원 정보가 없습니다."); return; }
      setIdResult(data.email);
      setIdStep("result");
    } catch (e: any) {
      setIdError(e.message);
    }
  }

  // 비밀번호 변경
  async function handleResetPassword() {
    setPwError("");
    if (pwNew !== pwConfirm) { setPwError("새 비밀번호가 일치하지 않습니다."); return; }
    if (pwNew.length < 8) { setPwError("비밀번호는 8자 이상이어야 합니다."); return; }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pwEmail, phoneNumber: pwPhone, newPassword: pwNew }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPwError(data.message || "일치하는 회원 정보가 없습니다.");
        return;
      }
      setPwStep("result");
    } catch (e: any) {
      setPwError(e.message);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box find-account-box">
        <h2 className="find-title">아이디 · 비밀번호 찾기</h2>

        {/* 탭 */}
        <div className="find-tabs">
          <button
            className={`find-tab${tab === "id" ? " active" : ""}`}
            onClick={() => setTab("id")}
          >
            아이디 찾기
          </button>
          <button
            className={`find-tab${tab === "password" ? " active" : ""}`}
            onClick={() => setTab("password")}
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 아이디 찾기 */}
        {tab === "id" && (
          <div className="find-content">
            {idStep === "result" ? (
              <div className="find-result">
                <p className="find-result-label">회원님의 아이디(이메일)는</p>
                <p className="find-result-email">{idResult}</p>
                <p className="find-result-sub">입니다.</p>
                <div className="find-result-buttons">
                  <button className="find-btn secondary" onClick={() => navigate("/login")}>
                    로그인
                  </button>
                  <button className="find-btn secondary" onClick={() => { setTab("password"); setIdStep("input"); }}>
                    비밀번호 찾기
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="auth-field">
                  <label>이름</label>
                  <input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={idName}
                    onChange={(e) => setIdName(e.target.value)}
                    disabled={idStep === "verify"}
                  />
                </div>
                <div className="auth-field">
                  <label>휴대폰 번호</label>
                  <div className="phone-row">
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={idPhone}
                      onChange={(e) => setIdPhone(formatPhone(e.target.value))}
                      disabled={idStep === "verify"}
                    />
                    <button
                      className="sub-button"
                      onClick={() => handleSendCode(idPhone, "id")}
                      disabled={sending || !idName || !idPhone}
                    >
                      {idStep === "verify" ? "재전송" : "인증번호 전송"}
                    </button>
                  </div>
                  {idSendMsg && (
                    <p className={`auth-message ${idCodeVerified ? "success" : "success"}`}>{idSendMsg}</p>
                  )}
                </div>
                {idStep === "verify" && (
                  <div className="auth-field">
                    <label>인증번호</label>
                    <div className="phone-row">
                      <input
                        type="text"
                        placeholder="인증번호 6자리"
                        value={idCode}
                        onChange={(e) => setIdCode(e.target.value)}
                        disabled={idCodeVerified}
                      />
                      <button
                        className="sub-button"
                        onClick={handleVerifyIdCode}
                        disabled={!idCode || idCodeVerified}
                      >
                        {idCodeVerified ? "인증완료" : "인증하기"}
                      </button>
                    </div>
                    {idVerifyMsg && <p className="auth-message success">{idVerifyMsg}</p>}
                  </div>
                )}
                {idError && <p className="auth-message error">{idError}</p>}
                {idCodeVerified && (
                  <button className="find-btn primary" onClick={handleFindId}>
                    아이디 찾기
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* 비밀번호 찾기 */}
        {tab === "password" && (
          <div className="find-content">
            {pwStep === "result" ? (
              <div className="find-result">
                <p className="find-result-label">비밀번호가 성공적으로 변경되었습니다.</p>
                <div className="find-result-buttons">
                  <button className="find-btn secondary" onClick={() => navigate("/login")}>
                    로그인하러 가기
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="auth-field">
                  <label>이메일</label>
                  <input
                    type="email"
                    placeholder="가입한 이메일을 입력하세요"
                    value={pwEmail}
                    onChange={(e) => setPwEmail(e.target.value)}
                    disabled={pwStep === "verify"}
                  />
                </div>
                <div className="auth-field">
                  <label>휴대폰 번호</label>
                  <div className="phone-row">
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={pwPhone}
                      onChange={(e) => setPwPhone(formatPhone(e.target.value))}
                      disabled={pwStep === "verify"}
                    />
                    <button
                      className="sub-button"
                      onClick={() => handleSendCode(pwPhone, "password")}
                      disabled={sending || !pwEmail || !pwPhone}
                    >
                      {pwStep === "verify" ? "재전송" : "인증번호 전송"}
                    </button>
                  </div>
                  {pwSendMsg && (
                    <p className={`auth-message ${pwCodeVerified ? "success" : "success"}`}>{pwSendMsg}</p>
                  )}
                </div>
                {pwStep === "verify" && (
                  <>
                    <div className="auth-field">
                      <label>인증번호</label>
                      <div className="phone-row">
                        <input
                          type="text"
                          placeholder="인증번호 6자리"
                          value={pwCode}
                          onChange={(e) => setPwCode(e.target.value)}
                          disabled={pwCodeVerified}
                        />
                        <button
                          className="sub-button"
                          onClick={handleVerifyPwCode}
                          disabled={!pwCode || pwCodeVerified}
                        >
                          {pwCodeVerified ? "인증완료" : "인증하기"}
                        </button>
                      </div>
                      {pwVerifyMsg && <p className="auth-message success">{pwVerifyMsg}</p>}
                    </div>
                    {pwCodeVerified && (
                      <>
                        <div className="auth-field">
                          <label>새 비밀번호</label>
                          <input
                            type="password"
                            placeholder="8자 이상 입력하세요"
                            value={pwNew}
                            onChange={(e) => setPwNew(e.target.value)}
                          />
                        </div>
                        <div className="auth-field">
                          <label>새 비밀번호 확인</label>
                          <input
                            type="password"
                            placeholder="비밀번호를 한번 더 입력하세요"
                            value={pwConfirm}
                            onChange={(e) => setPwConfirm(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
                {pwError && <p className="auth-message error">{pwError}</p>}
                {pwCodeVerified && (
                  <button
                    className="find-btn primary"
                    onClick={handleResetPassword}
                    disabled={!pwNew || !pwConfirm}
                  >
                    비밀번호 변경
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button className="find-back-link" onClick={() => navigate("/login")}>
            ← 로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default FindAccountPage;
