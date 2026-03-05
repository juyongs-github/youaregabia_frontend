import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/terms.css";
import TermsDetailModal from "./TermsDetailModal";

function TermsAgreement() {
  const navigate = useNavigate();

  // 보기 내용 모달관련된 부분
  type TermType = "service" | "privacy" | "marketing";
  const [openTerm, setOpenTerm] = useState<TermType | null>(null);

  const [agreeAll, setAgreeAll] = useState(false);

  const [terms, setTerms] = useState({
    service: false,   // 필수
    privacy: false,   // 필수
    marketing: false, // 선택
  });


  // 필수 동의 체크 여부
  const isRequiredAgreed = terms.service && terms.privacy;

  // 전체 동의 클릭
  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setTerms({
      service: checked,
      privacy: checked,
      marketing: checked,
    });
  };

  // 개별 동의 변경
  const handleChange = (key: keyof typeof terms) => {
    setTerms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 개별 동의 변경 시 전체 동의 자동 동기화
  useEffect(() => {
    if (terms.service && terms.privacy && terms.marketing) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [terms]);

  return (
    <div className="terms-container">
      <div className="terms-box">
        <h1 className="terms-title">약관 동의</h1>
        <p className="terms-desc">
          서비스 이용을 위해 아래 약관에 동의해주세요.
        </p>

        {/* 전체 동의 */}
        <div className="terms-item all">
          <label>
            <input
              type="checkbox"
              checked={agreeAll}
              onChange={(e) => handleAgreeAll(e.target.checked)}
            />
            <span>전체 동의하기</span>
          </label>
          <p className="terms-sub-desc">
            필수 및 선택 항목을 모두 포함합니다.
          </p>
        </div>

        <div className="terms-divider" />

        {/* 필수 이용약관 */}
        <div className="terms-item">
          <label>
            <input
              type="checkbox"
              checked={terms.service}
              onChange={() => handleChange("service")}
            />
            <span className="required">필수</span>
            서비스 이용약관
          </label>
          <button
            type="button"
            className="term-view-button"
            onClick={() => setOpenTerm("service")}
          >
            보기
          </button>
          {openTerm && (
            <TermsDetailModal
              type={openTerm}
              onClose={() => setOpenTerm(null)}
            />
          )}
        </div>

        {/* 필수 개인정보 */}
        <div className="terms-item">
          <label>
            <input
              type="checkbox"
              checked={terms.privacy}
              onChange={() => handleChange("privacy")}
            />
            <span className="required">필수</span>
            개인정보 수집 및 이용
          </label>
          <button
            type="button"
            className="term-view-button"
            onClick={() => setOpenTerm("privacy")}
          >
            보기
          </button>
        </div>

        {/* 선택 마케팅 */}
        <div className="terms-item">
          <label>
            <input
              type="checkbox"
              checked={terms.marketing}
              onChange={() => handleChange("marketing")}
            />
            <span className="optional">선택</span>
            마케팅 정보 수신 동의
          </label>
          <button
            type="button"
            className="term-view-button"
            onClick={() => setOpenTerm("marketing")}
          >
            보기
          </button>
        </div>

        {/* 다음 버튼 */}
        <button
          className="terms-next"
          disabled={!isRequiredAgreed}
          onClick={() => navigate("/auth/ci")}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default TermsAgreement;
