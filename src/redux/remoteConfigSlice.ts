import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RemoteConfigState {
  apiBaseUrl: string;
  isLoaded: boolean;
  lastFetchedAt: number | null;
}

const initialState: RemoteConfigState = {
  apiBaseUrl: 'http://10.65.21.106:8000/api/v1', // Default fallback
  isLoaded: false,
  lastFetchedAt: null,
};

const remoteConfigSlice = createSlice({
  name: 'remoteConfig',
  initialState,
  reducers: {
    setApiBaseUrl: (state, action: PayloadAction<string>) => {
      state.apiBaseUrl = action.payload;
      state.isLoaded = true;
      state.lastFetchedAt = Date.now();
    },
    resetRemoteConfig: (state) => {
      state.apiBaseUrl = initialState.apiBaseUrl;
      state.isLoaded = false;
      state.lastFetchedAt = null;
    },
  },
});

export const { setApiBaseUrl, resetRemoteConfig } = remoteConfigSlice.actions;

export const selectApiBaseUrl = (state: { remoteConfig: RemoteConfigState }) => state.remoteConfig.apiBaseUrl;
export const selectIsRemoteConfigLoaded = (state: { remoteConfig: RemoteConfigState }) => state.remoteConfig.isLoaded;

export default remoteConfigSlice.reducer;
