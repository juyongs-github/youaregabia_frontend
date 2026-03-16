import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { pointApi } from "../api/pointApi";
import { updatePoint } from "../store/authSlice";

export const usePoint = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!user?.email) return;
    pointApi
      .getMyPoint()
      .then((data) => {
        dispatch(updatePoint(data));
      })
      .catch(console.error);
  }, [user?.email]);

  return {
    totalPoint: user?.totalPoint ?? 0,
    grade: user?.grade ?? "ENSEMBLE",
  };
};
