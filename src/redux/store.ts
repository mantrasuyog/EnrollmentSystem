import { configureStore, combineReducers, Middleware } from "@reduxjs/toolkit";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import scanReducer from "./scanSlice";
import faceEnrollmentReducer from "./faceEnrollmentSlice";
import fingerEnrollmentReducer from "./fingerEnrollmentSlice";
import userEnrollmentReducer from "./userEnrollmentSlice";
import remoteConfigReducer from "./remoteConfigSlice";
import {
  clearAndSaveScanData,
  clearScanDataFromDb,
  clearAndSaveFaceEnrollment,
  clearFaceEnrollmentFromDb,
  saveFingerTemplate,
  clearFingerEnrollmentFromDb,
  saveUserEnrollmentStatus,
  clearUserEnrollmentFromDb,
  FingerTemplateRecord,
} from "../services/database.service";

const persistConfig = {
  key: "root",
  version: 1,
  storage: AsyncStorage,
  whitelist: ["scan", "faceEnrollment", "fingerEnrollment", "userEnrollment", "remoteConfig"],
  timeout: 10000, // Increase timeout to 10 seconds for large data
  debug: __DEV__, // Enable debug logs in development
  writeFailSafe: true, // Ensures writes complete even on app kill
};

// List of actions that should trigger immediate flush
const criticalActions = [
  'scan/addScanData',
  'scan/clearScanData',
  'fingerEnrollment/setLeftSlap',
  'fingerEnrollment/setLeftThumb',
  'fingerEnrollment/setRightSlap',
  'fingerEnrollment/setRightThumb',
  'fingerEnrollment/setFingerCapture',
  'fingerEnrollment/setFingerTemplate',
  'fingerEnrollment/setFingerTemplatesFromCapture',
  'fingerEnrollment/clearFingerEnrollment',
  'faceEnrollment/setEnrolledImage',
  'faceEnrollment/clearEnrolledImage',
  'userEnrollment/setUserEnrolled',
  'userEnrollment/resetUserEnrollment',
];

// Middleware to flush persistor immediately after critical actions
let persistorRef: ReturnType<typeof persistStore> | null = null;

export const setPersistorRef = (p: ReturnType<typeof persistStore>) => {
  persistorRef = p;
};

const immediateFlushMiddleware: Middleware = () => (next) => (action: any) => {
  const result = next(action);

  // Flush immediately after critical actions
  if (criticalActions.includes(action.type) && persistorRef) {
    persistorRef.flush();
    if (__DEV__) {
      console.log(`Flushed persistor after action: ${action.type}`);
    }
  }

  return result;
};

// Middleware to save data to SQLite when Redux actions are dispatched
const sqliteSyncMiddleware: Middleware = () => (next) => (action: any) => {
  const result = next(action);

  try {
    switch (action.type) {
      case 'scan/addScanData':
        // Save scan data to SQLite
        const scanPayload = action.payload;
        clearAndSaveScanData({
          registration_number: scanPayload.Registration_Number,
          name: scanPayload.Name,
          portrait_image: scanPayload.Portrait_Image,
          document_image: scanPayload.Document_Image,
          scanned_json: scanPayload.scanned_json,
          centre_code: scanPayload.Centre_Code,
        });
        if (__DEV__) {
          console.log('Saved scan data to SQLite');
        }
        break;

      case 'scan/clearScanData':
        clearScanDataFromDb();
        if (__DEV__) {
          console.log('Cleared scan data from SQLite');
        }
        break;

      case 'faceEnrollment/setEnrolledImage':
        // Save face enrollment to SQLite
        clearAndSaveFaceEnrollment(action.payload);
        if (__DEV__) {
          console.log('Saved face enrollment to SQLite');
        }
        break;

      case 'faceEnrollment/clearEnrolledImage':
        clearFaceEnrollmentFromDb();
        if (__DEV__) {
          console.log('Cleared face enrollment from SQLite');
        }
        break;

      case 'fingerEnrollment/setFingerTemplate':
        // Save individual finger template to SQLite
        const fingerPayload = action.payload;
        const template: FingerTemplateRecord = {
          finger_key: fingerPayload.key,
          title: fingerPayload.template.title,
          base64_image: fingerPayload.template.base64Image,
        };
        saveFingerTemplate(template);
        if (__DEV__) {
          console.log(`Saved finger template ${fingerPayload.key} to SQLite`);
        }
        break;

      case 'fingerEnrollment/setFingerTemplatesFromCapture':
        // Save all finger templates from capture to SQLite
        const fingers = action.payload;
        const positionToFingerKey: Record<number, string> = {
          1: 'right_thumb',
          2: 'right_index',
          3: 'right_middle',
          4: 'right_ring',
          5: 'right_little',
          6: 'left_thumb',
          7: 'left_index',
          8: 'left_middle',
          9: 'left_ring',
          10: 'left_little',
        };
        const fingerKeyToTitle: Record<string, string> = {
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
        fingers.forEach((finger: any) => {
          const fingerKey = positionToFingerKey[finger.position];
          if (fingerKey) {
            saveFingerTemplate({
              finger_key: fingerKey,
              title: fingerKeyToTitle[fingerKey],
              base64_image: finger.primaryImageBase64,
            });
          }
        });
        if (__DEV__) {
          console.log('Saved finger templates from capture to SQLite');
        }
        break;

      case 'fingerEnrollment/clearFingerEnrollment':
        clearFingerEnrollmentFromDb();
        if (__DEV__) {
          console.log('Cleared finger enrollment from SQLite');
        }
        break;

      case 'userEnrollment/setUserEnrolled':
        saveUserEnrollmentStatus(action.payload);
        if (__DEV__) {
          console.log(`User enrollment status saved to SQLite: ${action.payload}`);
        }
        break;

      case 'userEnrollment/resetUserEnrollment':
        clearUserEnrollmentFromDb();
        if (__DEV__) {
          console.log('User enrollment status cleared from SQLite');
        }
        break;
    }
  } catch (error) {
    console.error('Error syncing to SQLite:', error);
  }

  return result;
};

const rootReducer = combineReducers({
  scan: scanReducer,
  faceEnrollment: faceEnrollmentReducer,
  fingerEnrollment: fingerEnrollmentReducer,
  userEnrollment: userEnrollmentReducer,
  remoteConfig: remoteConfigReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: false,
    }).concat(immediateFlushMiddleware).concat(sqliteSyncMiddleware),
});

export const persistor = persistStore(store, null, () => {
  if (__DEV__) {
    console.log('Redux rehydration complete');
    console.log('Current state:', JSON.stringify(store.getState(), null, 2).substring(0, 500));
  }
});

// Set persistor reference for the middleware
setPersistorRef(persistor);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
