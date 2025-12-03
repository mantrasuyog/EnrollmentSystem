import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

interface UserEnrollmentState {
  userEnrolled: boolean;
}

const initialState: UserEnrollmentState = {
  userEnrolled: false,
};

const userEnrollmentSlice = createSlice({
  name: 'userEnrollment',
  initialState,
  reducers: {
    setUserEnrolled: (state, action: PayloadAction<boolean>) => {
      state.userEnrolled = action.payload;
    },
    resetUserEnrollment: (state) => {
      state.userEnrolled = false;
    },
  },
});

export const { setUserEnrolled, resetUserEnrollment } = userEnrollmentSlice.actions;

// Selector
export const selectUserEnrolled = (state: RootState) => state.userEnrollment.userEnrolled;

export default userEnrollmentSlice.reducer;
