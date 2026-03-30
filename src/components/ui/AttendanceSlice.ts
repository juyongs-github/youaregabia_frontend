import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { attendanceApi } from "../../api/attendanceApi";

interface AttendanceState {
  checked: boolean;
  streak: number;
}

const initialState: AttendanceState = {
  checked: false,
  streak: 0,
};

// 로그인 직후 상태 조회
export const fetchAttendanceStatus = createAsyncThunk("attendance/fetchStatus", async () => {
  return await attendanceApi.getStatus();
});

// 출석 체크
export const checkAttendance = createAsyncThunk("attendance/check", async () => {
  return await attendanceApi.check();
});

const AttendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceStatus.fulfilled, (state, action) => {
        state.checked = action.payload.checked;
        state.streak = action.payload.streak;
      })
      .addCase(checkAttendance.fulfilled, (state, action) => {
        if (!action.payload.isAlreadyChecked) {
          state.checked = true;
          state.streak = action.payload.streak;
        }
      });
  },
});

export default AttendanceSlice.reducer;
