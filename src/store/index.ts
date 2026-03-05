import { configureStore, combineReducers } from "@reduxjs/toolkit"; // combineReducers 추가
import authReducer from "./authSlice";
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
import storage from "redux-persist/lib/storage";

// 1. 리듀서 통합
const rootReducer = combineReducers({
  auth: authReducer,
});

// 2. Persist 설정
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // auth 상태만 로컬스토리지에 저장
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
