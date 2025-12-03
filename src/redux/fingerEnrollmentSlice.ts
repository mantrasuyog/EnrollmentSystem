import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {FingerData, CaptureResult, FingerPosition} from '../modules/Tech5Finger';

export type CaptureMode = 'left_slap' | 'left_thumb' | 'right_slap' | 'right_thumb';

export interface FingerCaptureData {
  fingers: FingerData[];
  capturedAt: string;
  livenessScores?: Array<{positionCode: number; score: number}>;
}

export interface FingerTemplate {
  title: string;
  base64Image: string;
}

export interface FingerTemplates {
  left_thumb: FingerTemplate | null;
  left_index: FingerTemplate | null;
  left_middle: FingerTemplate | null;
  left_ring: FingerTemplate | null;
  left_little: FingerTemplate | null;
  right_thumb: FingerTemplate | null;
  right_index: FingerTemplate | null;
  right_middle: FingerTemplate | null;
  right_ring: FingerTemplate | null;
  right_little: FingerTemplate | null;
}

export type FingerKey = keyof FingerTemplates;

export const positionToFingerKey: Record<number, FingerKey> = {
  [FingerPosition.LEFT_THUMB]: 'left_thumb',
  [FingerPosition.LEFT_INDEX]: 'left_index',
  [FingerPosition.LEFT_MIDDLE]: 'left_middle',
  [FingerPosition.LEFT_RING]: 'left_ring',
  [FingerPosition.LEFT_LITTLE]: 'left_little',
  [FingerPosition.RIGHT_THUMB]: 'right_thumb',
  [FingerPosition.RIGHT_INDEX]: 'right_index',
  [FingerPosition.RIGHT_MIDDLE]: 'right_middle',
  [FingerPosition.RIGHT_RING]: 'right_ring',
  [FingerPosition.RIGHT_LITTLE]: 'right_little',
};

export const fingerKeyToTitle: Record<FingerKey, string> = {
  left_thumb: 'Left Thumb',
  left_index: 'Left Index',
  left_middle: 'Left Middle',
  left_ring: 'Left Ring',
  left_little: 'Left Little',
  right_thumb: 'Right Thumb',
  right_index: 'Right Index',
  right_middle: 'Right Middle',
  right_ring: 'Right Ring',
  right_little: 'Right Little',
};

interface FingerEnrollmentState {
  leftSlap: FingerCaptureData | null;
  leftThumb: FingerCaptureData | null;
  rightSlap: FingerCaptureData | null;
  rightThumb: FingerCaptureData | null;
  fingerTemplates: FingerTemplates;
}

const initialFingerTemplates: FingerTemplates = {
  left_thumb: null,
  left_index: null,
  left_middle: null,
  left_ring: null,
  left_little: null,
  right_thumb: null,
  right_index: null,
  right_middle: null,
  right_ring: null,
  right_little: null,
};

const initialState: FingerEnrollmentState = {
  leftSlap: null,
  leftThumb: null,
  rightSlap: null,
  rightThumb: null,
  fingerTemplates: initialFingerTemplates,
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
      state.fingerTemplates = initialFingerTemplates;
    },
    clearSingleCapture: (state, action: PayloadAction<CaptureMode>) => {
      switch (action.payload) {
        case 'left_slap':
          state.leftSlap = null;
          state.fingerTemplates.left_index = null;
          state.fingerTemplates.left_middle = null;
          state.fingerTemplates.left_ring = null;
          state.fingerTemplates.left_little = null;
          break;
        case 'left_thumb':
          state.leftThumb = null;
          state.fingerTemplates.left_thumb = null;
          break;
        case 'right_slap':
          state.rightSlap = null;
          state.fingerTemplates.right_index = null;
          state.fingerTemplates.right_middle = null;
          state.fingerTemplates.right_ring = null;
          state.fingerTemplates.right_little = null;
          break;
        case 'right_thumb':
          state.rightThumb = null;
          state.fingerTemplates.right_thumb = null;
          break;
      }
    },
    setFingerTemplate: (
      state,
      action: PayloadAction<{key: FingerKey; template: FingerTemplate}>,
    ) => {
      const {key, template} = action.payload;
      state.fingerTemplates[key] = template;
    },
    setFingerTemplatesFromCapture: (
      state,
      action: PayloadAction<FingerData[]>,
    ) => {
      const fingers = action.payload;
      fingers.forEach(finger => {
        const fingerKey = positionToFingerKey[finger.position];
        if (fingerKey) {
          state.fingerTemplates[fingerKey] = {
            title: fingerKeyToTitle[fingerKey],
            base64Image: finger.primaryImageBase64,
          };
        }
      });
    },
    clearFingerTemplates: state => {
      state.fingerTemplates = initialFingerTemplates;
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
  setFingerTemplate,
  setFingerTemplatesFromCapture,
  clearFingerTemplates,
} = fingerEnrollmentSlice.actions;

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

export const selectFingerTemplates = (state: {
  fingerEnrollment: FingerEnrollmentState;
}): FingerTemplates => {
  return state.fingerEnrollment.fingerTemplates;
};


export const selectFingerTemplatesForApi = (state: {
  fingerEnrollment: FingerEnrollmentState;
}): Record<string, string> => {
  const templates = state.fingerEnrollment.fingerTemplates;
  const result: Record<string, string> = {};

  (Object.keys(templates) as FingerKey[]).forEach(key => {
    const template = templates[key];
    if (template) {
      result[key] = template.base64Image;
    }
  });

  return result;
};

export const selectAllFingerTemplatesEnrolled = (state: {
  fingerEnrollment: FingerEnrollmentState;
}): boolean => {
  const templates = state.fingerEnrollment.fingerTemplates;
  return (Object.keys(templates) as FingerKey[]).every(key => templates[key] !== null);
};

export const selectFingerTemplatesCount = (state: {
  fingerEnrollment: FingerEnrollmentState;
}): number => {
  const templates = state.fingerEnrollment.fingerTemplates;
  return (Object.keys(templates) as FingerKey[]).filter(key => templates[key] !== null).length;
};

export default fingerEnrollmentSlice.reducer;
