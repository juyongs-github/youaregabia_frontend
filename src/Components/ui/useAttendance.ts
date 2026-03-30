import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAttendance, fetchAttendanceStatus } from "./attendanceSlice";
import type { AppDispatch, RootState } from "../../store";

export const useAttendance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.user);
  const checked = useSelector((state: RootState) => state.attendance.checked);

  useEffect(() => {
    if (!isLoggedIn) return;

    // 상태 먼저 조회
    dispatch(fetchAttendanceStatus()).then((result) => {
      const status = result.payload as { checked: boolean; streak: number };
      // 오늘 아직 출석 안 했으면 자동 체크
      if (!status.checked) {
        dispatch(checkAttendance());
      }
    });
  }, [isLoggedIn]);
};
