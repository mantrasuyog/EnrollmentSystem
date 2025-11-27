package ai.tech5.finger.utils;

import android.os.Build;

public class DeviceChecker {


//    Looking through the firmware listings on sammobile (and Kimovi for S911E) here are approximate geographic regions for models:
//    SM-S911B -- Europe / Africa / Middle East / Oceania
//    SM-S911B/DS -- (assumed same as above, Dual SIM)
//    SM-S911U -- USA
//    SM-S911U1 -- USA ( factory unlocked )
//    SM-S911W -- Canada
//    SM-S911N -- Korea
//    SM-S9110 -- China / Taiwan / Hong Kong
//    SM-S911E -- Latin America
//    SM-S911E/DS -- (assumed same as above, Dual SIM)


    public static boolean isS23Device() {

        String buildModel = Build.MODEL;

        if (buildModel.equalsIgnoreCase("SM-S911B") ||
                buildModel.equalsIgnoreCase("SM-S911B/DS") ||
                buildModel.equalsIgnoreCase("SM-S911U") ||
                buildModel.equalsIgnoreCase("SM-S911U1") ||
                buildModel.equalsIgnoreCase("SM-S911W") ||
                buildModel.equalsIgnoreCase("SM-S911N") ||
                buildModel.equalsIgnoreCase("SM-S9110") ||
                buildModel.equalsIgnoreCase("SM-S911E") ||
                buildModel.equalsIgnoreCase("SM-S911E/DS")) {
            return true;
        }


        return false;
    }
}
