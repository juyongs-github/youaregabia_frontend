interface Props {
  type: "service" | "privacy" | "marketing";
  onClose: () => void;
}

const TERMS_CONTENT = {
  service: {
    title: "서비스 이용약관",
    content: `
제1조 (목적)

본 약관은 music(이하 “회사”)가 제공하는 음악 스트리밍 및 커뮤니티 서비스(이하 “서비스”)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.


제2조 (정의)

“회원”이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.

“서비스”란 회사가 제공하는 음악 스트리밍, 플레이리스트, 커뮤니티 등 일체의 서비스를 의미합니다.

제3조 (약관의 효력 및 변경)

본 약관은 회원이 동의함으로써 효력이 발생합니다.

회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있습니다.

제4조 (서비스 이용)

서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.

시스템 점검 등 불가피한 사유가 있는 경우 서비스 제공이 일시 중단될 수 있습니다.`,
  },
  privacy: {
    title: "개인정보 수집 및 이용",
    content: `
1. 수집 항목

이름

생년월일

휴대폰 번호

이메일 주소

CI(연계정보, 본인확인용)

2. 수집 목적

본인확인 및 중복 가입 방지

회원 식별 및 서비스 제공

고객 문의 대응

3. 보유 및 이용 기간

회원 탈퇴 시까지

단, 관련 법령에 따라 보존이 필요한 경우 해당 기간까지 보관

4. 동의 거부 권리 안내
이용자는 개인정보 수집·이용에 대한 동의를 거부할 수 있으나,
동의하지 않을 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.
`,
  },
  marketing: {
    title: "마케팅 정보 수신 동의",
    content: `
1. 수집 목적

이벤트, 혜택, 프로모션 정보 제공

2. 전송 수단

이메일, 문자메시지(SMS), 앱 알림

3. 보유 및 이용 기간

회원 탈퇴 또는 동의 철회 시까지

※ 본 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.
`,
  },
};

export default function TermsDetailModal({ type, onClose }: Props) {
  const term = TERMS_CONTENT[type];

  return (
    <div className="term-modal-overlay" onClick={onClose}>
      <div className="term-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{term.title}</h2>

        <div className="term-content">
          {term.content.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <button className="term-close-button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
