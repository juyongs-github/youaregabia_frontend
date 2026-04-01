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

  // 달력 로드
  useEffect(() => {
    attendanceApi.getCalendar(year, month).then(setCalendarDates);
  }, [checked]); // 출석 체크 후 달력 갱신

  // 출석 체크 버튼
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

  // 이번 달 날짜 배열 생성
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=일요일

  return (
    <div className="mx-auto max-w-xl p-6">
      <h2 className="mb-2 text-2xl font-bold text-white">출석 체크</h2>
      <p className="mb-6 text-sm text-gray-400">매일 출석하고 포인트를 받아보세요!</p>

      {/* streak + 출석 버튼 */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 px-6 py-4">
        <div>
          <p className="text-sm text-gray-400">연속 출석</p>
          <p className="text-3xl font-bold text-indigo-400">{streak}일</p>
          {streak > 0 && streak % 7 !== 0 && (
            <p className="mt-1 text-xs text-gray-500">
              7일 보너스까지 {7 - (streak % 7)}일 남았어요
            </p>
          )}
        </div>
        <button
          onClick={handleCheck}
          disabled={checked}
          className={`rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
            checked
              ? "cursor-not-allowed bg-neutral-700 text-gray-500"
              : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95"
          }`}
        >
          {checked ? "✅ 출석 완료" : "출석 체크"}
        </button>
      </div>

      {/* 결과 메시지 */}
      {resultMsg && (
        <div className="mb-6 rounded-lg border border-indigo-500 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300">
          {resultMsg}
        </div>
      )}

      {/* 달력 */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <p className="mb-4 text-center text-sm font-semibold text-gray-300">
          {year}년 {month}월
        </p>

        {/* 요일 헤더 */}
        <div className="mb-2 grid grid-cols-7 text-center text-xs text-gray-500">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {/* 첫째 날 빈 칸 */}
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
                className={`flex h-8 w-8 mx-auto items-center justify-center rounded-full text-xs font-medium ${
                  isAttended
                    ? "bg-indigo-600 text-white"
                    : isToday
                      ? "border border-indigo-500 text-indigo-400"
                      : "text-gray-500"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* 포인트 안내 */}
      <div className="mt-4 rounded-lg border border-neutral-700 px-4 py-3 text-xs text-gray-400">
        <p>
          · 매일 출석 체크 시 <span className="text-indigo-400 font-semibold">50포인트</span> 지급
        </p>
        <p>
          · 7일 연속 출석 시 <span className="text-yellow-400 font-semibold">보너스 300포인트</span>{" "}
          추가 지급
        </p>
      </div>
    </div>
  );
};

export default AttendancePage;
