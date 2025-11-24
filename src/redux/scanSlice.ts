import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ScanItem {
  Registration_Number: string;
  Name: string;
  Portrait_Image: string;  
  Document_Image: string;  
  scanned_json: string;    
  Centre_Code: string;     
}

interface ScanState {
  scans: ScanItem[];
}

const initialState: ScanState = {
  scans: [],
};

const scanSlice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    addScanData: (state, action: PayloadAction<ScanItem>) => {
      const newItem = action.payload;

      const exists = state.scans.some(
        (item: ScanItem) =>
          item.Registration_Number === newItem.Registration_Number
      );

      if (!exists) {
        state.scans.push(newItem);
      } else {
        console.warn(
          "Duplicate Registration Number:",
          newItem.Registration_Number
        );
      }
    },

     clearScanData: (state) => {
      state.scans = [];
    },
  },
});

export const { addScanData,clearScanData} = scanSlice.actions;
export default scanSlice.reducer;
