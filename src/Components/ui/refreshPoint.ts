// utils/refreshPoint.ts

import { pointApi } from "../../api/pointApi";
import { store } from "../../store";
import { updatePoint } from "../../store/authSlice";

export const refreshPoint = () => {
  const user = store.getState().auth.user;
  if (!user?.email) return;
  pointApi
    .getMyPoint()
    .then((data) => {
      store.dispatch(updatePoint(data));
    })
    .catch(console.error);
};
