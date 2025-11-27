import { configureStore } from "@reduxjs/toolkit";
import scanReducer from "./scanSlice";
import faceEnrollmentReducer from "./faceEnrollmentSlice";
import fingerEnrollmentReducer from "./fingerEnrollmentSlice";

export const store = configureStore({
  reducer: {
    scan: scanReducer,
    faceEnrollment: faceEnrollmentReducer,
    fingerEnrollment: fingerEnrollmentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
