// AttendancePage.tsx 수정본
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { attendanceApi } from "../../api/attendanceApi";
import { checkAttendance } from "../../components/ui/AttendanceSlice";

const AttendancePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { checked, streak } = useSelector((state: RootState) => state.attendance);
  const [calendarDates, setCalendarDates] = useState<string[]>([]);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  useEffect(() => {
    attendanceApi.getCalendar(year, month).then(setCalendarDates);
  }, [checked, year, month]);

  const handleCheck = async () => {
    const result = await dispatch(checkAttendance()).unwrap();
    if (result.isAlreadyChecked) {
      setResultMsg("오늘은 이미 출석했어요!");
    } else if (result.bonusPoint > 0) {
      setResultMsg(
        `출석 완료! +${result.point}포인트 🎉 7일 연속 보너스 +${result.bonusPoint}포인트!`
      );
    } else {
      setResultMsg(`출석 완료! +${result.point}포인트 (${result.streak}일 연속)`);
    }
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  return (
    <div className="kf-community-page kf-attendance-page">
      <div className="kf-community-page__shell">
        {/* 게시판 리스트와 폭을 맞춤 (max-w-4xl) */}
        <div className="mx-auto max-w-4xl p-4">
          {/* 헤더 부분: 리스트 페이지와 유사한 여백 구성 */}
          <div className="mt-8 mb-8 pb-6" style={{ borderBottom: "1px solid var(--kf-border)" }}>
            <h2 className="text-3xl font-bold text-gray-900">출석 체크</h2>
            <p className="mt-2 text-sm text-gray-500">매일 출석하고 포인트 혜택을 받아보세요!</p>
          </div>

          {/* 내부 콘텐츠: 너무 퍼져 보이지 않게 안쪽에서 max-w-xl로 제한 */}
          <div className="mx-auto max-w-xl space-y-6">
            {/* 연속 출석 + 버튼 카드 */}
            <div
              className="flex items-center justify-between rounded-2xl p-8"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                border: "1px solid var(--kf-border)",
                boxShadow: "var(--kf-shadow-md)",
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--kf-text-sub)" }}>
                  연속 출석
                </p>
                <p className="text-4xl font-black mt-1" style={{ color: "var(--kf-brand)" }}>
                  {streak}일
                </p>
                {streak > 0 && streak % 7 !== 0 && (
                  <p className="mt-2 text-xs" style={{ color: "var(--kf-brand-pink)" }}>
                    7일 보너스까지 {7 - (streak % 7)}일 남았어요
                  </p>
                )}
              </div>
              <button
                onClick={handleCheck}
                disabled={checked}
                className={`rounded-xl px-8 py-4 text-sm font-bold transition-all active:scale-95 ${
                  checked ? "" : "hover:shadow-lg hover:shadow-indigo-500/20"
                }`}
                style={
                  checked
                    ? {
                        background: "var(--kf-border)",
                        color: "var(--kf-text-muted)",
                        cursor: "not-allowed",
                      }
                    : {
                        background:
                          "linear-gradient(135deg, var(--kf-brand), var(--kf-brand-pink))",
                        color: "#fff",
                      }
                }
              >
                {checked ? "✅ 출석 완료" : "출석 체크하기"}
              </button>
            </div>

            {/* 결과 메시지 */}
            {resultMsg && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-semibold text-center animate-bounce"
                style={{
                  background: "rgba(109, 94, 252, 0.1)",
                  color: "var(--kf-brand)",
                  border: "1px solid var(--kf-brand)",
                }}
              >
                {resultMsg}
              </div>
            )}

            {/* 달력 카드 */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                border: "1px solid var(--kf-border)",
                boxShadow: "var(--kf-shadow-sm)",
              }}
            >
              <p
                className="mb-6 text-center text-lg font-bold"
                style={{ color: "var(--kf-text-main)" }}
              >
                {year}년 {month}월
              </p>

              <div
                className="mb-4 grid grid-cols-7 text-center text-xs font-bold"
                style={{ color: "var(--kf-text-sub)" }}
              >
                {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-3 text-center">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <span key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isAttended = calendarDates.includes(dateStr);
                  const isToday = day === today.getDate();

                  return (
                    <div
                      key={day}
                      className="flex h-10 w-10 mx-auto items-center justify-center rounded-full text-sm font-bold transition-all"
                      style={
                        isAttended
                          ? { background: "var(--kf-brand)", color: "#fff" }
                          : isToday
                            ? { border: "2px solid var(--kf-brand)", color: "var(--kf-brand)" }
                            : { color: "var(--kf-text-muted)" }
                      }
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 하단 안내 가이드 */}
            <div
              className="rounded-xl p-4 text-xs space-y-1"
              style={{ background: "rgba(0,0,0,0.03)", color: "var(--kf-text-sub)" }}
            >
              <p>
                · 매일 출석 체크 시 <strong style={{ color: "var(--kf-brand)" }}>50포인트</strong>{" "}
                지급
              </p>
              <p>
                · 7일 연속 출석 시{" "}
                <strong style={{ color: "var(--kf-warning)" }}>보너스 300포인트</strong> 추가 지급
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
