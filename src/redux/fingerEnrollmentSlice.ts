import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {FingerData, CaptureResult} from '../modules/Tech5Finger';

export type CaptureMode = 'left_slap' | 'left_thumb' | 'right_slap' | 'right_thumb';

export interface FingerCaptureData {
  fingers: FingerData[];
  capturedAt: string;
  livenessScores?: Array<{positionCode: number; score: number}>;
}

interface FingerEnrollmentState {
  leftSlap: FingerCaptureData | null;
  leftThumb: FingerCaptureData | null;
  rightSlap: FingerCaptureData | null;
  rightThumb: FingerCaptureData | null;
}

const initialState: FingerEnrollmentState = {
  leftSlap: null,
  leftThumb: null,
  rightSlap: null,
  rightThumb: null,
};

const fingerEnrollmentSlice = createSlice({
  name: 'fingerEnrollment',
  initialState,
  reducers: {
    setLeftSlap: (state, action: PayloadAction<FingerCaptureData>) => {
      state.leftSlap = action.payload;
    },
    setLeftThumb: (state, action: PayloadAction<FingerCaptureData>) => {
      state.leftThumb = action.payload;
    },
    setRightSlap: (state, action: PayloadAction<FingerCaptureData>) => {
      state.rightSlap = action.payload;
    },
    setRightThumb: (state, action: PayloadAction<FingerCaptureData>) => {
      state.rightThumb = action.payload;
    },
    setFingerCapture: (
      state,
      action: PayloadAction<{mode: CaptureMode; data: FingerCaptureData}>,
    ) => {
      const {mode, data} = action.payload;
      switch (mode) {
        case 'left_slap':
          state.leftSlap = data;
          break;
        case 'left_thumb':
          state.leftThumb = data;
          break;
        case 'right_slap':
          state.rightSlap = data;
          break;
        case 'right_thumb':
          state.rightThumb = data;
          break;
      }
    },
    clearFingerEnrollment: state => {
      state.leftSlap = null;
      state.leftThumb = null;
      state.rightSlap = null;
      state.rightThumb = null;
    },
    clearSingleCapture: (state, action: PayloadAction<CaptureMode>) => {
      switch (action.payload) {
        case 'left_slap':
          state.leftSlap = null;
          break;
        case 'left_thumb':
          state.leftThumb = null;
          break;
        case 'right_slap':
          state.rightSlap = null;
          break;
        case 'right_thumb':
          state.rightThumb = null;
          break;
      }
    },
  },
});

export const {
  setLeftSlap,
  setLeftThumb,
  setRightSlap,
  setRightThumb,
  setFingerCapture,
  clearFingerEnrollment,
  clearSingleCapture,
} = fingerEnrollmentSlice.actions;

// Selectors
export const selectAllFingersEnrolled = (state: {
  fingerEnrollment: FingerEnrollmentState;
}): boolean => {
  const {leftSlap, leftThumb, rightSlap, rightThumb} = state.fingerEnrollment;
  return !!(leftSlap && leftThumb && rightSlap && rightThumb);
};

export const selectEnrolledCount = (state: {
  fingerEnrollment: FingerEnrollmentState;
}): number => {
  const {leftSlap, leftThumb, rightSlap, rightThumb} = state.fingerEnrollment;
  return [leftSlap, leftThumb, rightSlap, rightThumb].filter(Boolean).length;
};

export const selectMissingCaptures = (state: {
  fingerEnrollment: FingerEnrollmentState;
}): CaptureMode[] => {
  const {leftSlap, leftThumb, rightSlap, rightThumb} = state.fingerEnrollment;
  const missing: CaptureMode[] = [];
  if (!leftSlap) missing.push('left_slap');
  if (!leftThumb) missing.push('left_thumb');
  if (!rightSlap) missing.push('right_slap');
  if (!rightThumb) missing.push('right_thumb');
  return missing;
};

export default fingerEnrollmentSlice.reducer;
