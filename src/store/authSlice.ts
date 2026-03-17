import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UserInfo {
  email: string;
  name?: string;
  createDate?: string;
  imgUrl?: string;
  token?: string;
  role?: string; // "USER" | "CRITIC" | "ADMIN"
  totalPoint?: number; // 유저 포인트
  grade?: string; // 유저 등급
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserInfo | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<UserInfo>) => {
      console.log("LOGIN USER:", action.payload);
      state.isLoggedIn = true;
      state.user = action.payload;
      if (action.payload.token) {
        localStorage.setItem("token", action.payload.token);
      }
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      localStorage.removeItem("token");
    },
    updateUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.user = { ...state.user, ...action.payload };
    },
    updateProfile: (state, action: PayloadAction<{ name?: string; imgUrl?: string }>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updatePoint: (state, action: PayloadAction<{ totalPoint: number; grade: string }>) => {
      if (state.user) {
        state.user.totalPoint = action.payload.totalPoint;
        state.user.grade = action.payload.grade;
      }
    },
  },
});

export const { loginSuccess, logout, updateProfile, updatePoint } = authSlice.actions;
export default authSlice.reducer;
