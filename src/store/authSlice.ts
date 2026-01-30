import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// 1. 유저 정보의 타입을 정의합니다.
interface UserInfo {
  email: string;
  name?: string;
  createDate?: string;
  // 필요한 필드를 더 추가할 수 있습니다.
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserInfo | null; // 로그인한 유저 정보를 담을 객체
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // 로그인 성공 시 유저 정보까지 한 번에 저장
    loginSuccess: (state, action: PayloadAction<UserInfo>) => {
      state.isLoggedIn = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = null; // 로그아웃 시 유저 정보도 삭제
    },
    // (선택) 회원 정보만 나중에 업데이트할 때 사용
    updateUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.user = { ...state.user, ...action.payload };
    }
  },
});

export const { loginSuccess, logout, updateUserInfo } = authSlice.actions;
export default authSlice.reducer;
