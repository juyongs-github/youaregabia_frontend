import { configureStore, combineReducers } from "@reduxjs/toolkit"; // combineReducers 추가
import authReducer from "./authSlice";
import attendanceReducer from "../components/ui/AttendanceSlice";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";

// 1. 리듀서 통합
const rootReducer = combineReducers({
  auth: authReducer,
  attendance: attendanceReducer,
});

// 2. Persist 설정
const persistConfig = {
  key: "root",
  storage: storageSession,
  whitelist: ["auth"], // auth 상태를 sessionStorage에 저장 (브라우저 종료 시 로그아웃)
};

// 3. Persisted Reducer 생성
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. Store 설정 (persistedReducer 적용)
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// 5. Persistor 내보내기
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
