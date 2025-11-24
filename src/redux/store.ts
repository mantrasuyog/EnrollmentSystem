import { configureStore } from "@reduxjs/toolkit";
import scanReducer from "./scanSlice";
import faceEnrollmentReducer from "./faceEnrollmentSlice";

export const store = configureStore({
  reducer: {
    scan: scanReducer,
    faceEnrollment: faceEnrollmentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
