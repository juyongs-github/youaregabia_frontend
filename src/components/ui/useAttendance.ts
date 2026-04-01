import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAttendance, fetchAttendanceStatus } from "./AttendanceSlice";
import type { AppDispatch, RootState } from "../../store";

export const useAttendance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.user);


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
