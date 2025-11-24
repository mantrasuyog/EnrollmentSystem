

import { createSlice } from '@reduxjs/toolkit';

const faceEnrollmentSlice = createSlice({
  name: 'faceEnrollment',
  initialState: {    
    enrolledImageBase64: null, 
  },
  reducers: {
    setEnrolledImage: (state, action) => {
      state.enrolledImageBase64 = action.payload;
    },
    clearEnrolledImage: (state) => {
      state.enrolledImageBase64 = null;
    },
  },
});

export const { setEnrolledImage, clearEnrolledImage } = faceEnrollmentSlice.actions;

export default faceEnrollmentSlice.reducer;