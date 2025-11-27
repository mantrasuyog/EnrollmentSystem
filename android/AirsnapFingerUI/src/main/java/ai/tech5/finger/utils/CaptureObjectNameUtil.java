package ai.tech5.finger.utils;

import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_AND_R_THUMBS;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_INDEX_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_INDEX_MIDDLE;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_LITTLE_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_MIDDLE_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_RING_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_RING_LITTLE;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_THUMB;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_PL_L_4F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_PL_R_4F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_INDEX_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_INDEX_MIDDLE;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_LITTLE_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_MIDDLE_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_RING_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_RING_LITTLE;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_THUMB;

import android.content.res.Resources;

import ai.tech5.finger.R;

public class CaptureObjectNameUtil {

    public static String getCaptureObjectName(int m_positionCode, int numRects, Resources resources) {

        if (m_positionCode == POS_CODE_PL_R_4F) {
            return resources.getString(R.string.label_right_slap_num_fingers, numRects);
        }

        if (m_positionCode == POS_CODE_PL_L_4F) {
            return resources.getString(R.string.label_left_slap_num_fingers, numRects);
        }


        if (m_positionCode == POS_CODE_L_AND_R_THUMBS) {
            return resources.getString(R.string.label_thumbs);
        }


        if (m_positionCode == POS_CODE_R_THUMB) {
            return resources.getString(R.string.label_right_thumb);
        }

        if (m_positionCode == POS_CODE_L_THUMB) {
            return resources.getString(R.string.label_left_thumb);
        }


        if (m_positionCode == POS_CODE_R_INDEX_MIDDLE) {
            return resources.getString(R.string.label_right_index_n_middle_fingers);
        }

        if (m_positionCode == POS_CODE_L_INDEX_MIDDLE) {
            return resources.getString(R.string.label_left_index_n_middle_fingers);
        }


        if (m_positionCode == POS_CODE_R_RING_LITTLE) {

            return resources.getString(R.string.label_right_ring_n_little_fingers);
        }

        if (m_positionCode == POS_CODE_L_RING_LITTLE) {

            return resources.getString(R.string.label_left_ring_n_little_fingers);
        }

        return getFingerLabel(m_positionCode, resources);
    }

    private static String getFingerLabel(int positionCode, Resources resources) {
        int stringResId;
        switch (positionCode) {
            case POS_CODE_R_INDEX_F:
                stringResId = R.string.label_right_index_finger;
                break;
            case POS_CODE_R_MIDDLE_F:
                stringResId = R.string.label_right_middle_finger;
                break;
            case POS_CODE_R_RING_F:
                stringResId = R.string.label_right_ring_finger;
                break;
            case POS_CODE_R_LITTLE_F:
                stringResId = R.string.label_right_little_finger;
                break;
            case POS_CODE_L_INDEX_F:
                stringResId = R.string.label_left_index_finger;
                break;
            case POS_CODE_L_MIDDLE_F:
                stringResId = R.string.label_left_middle_finger;
                break;
            case POS_CODE_L_RING_F:
                stringResId = R.string.label_left_ring_finger;
                break;
            case POS_CODE_L_LITTLE_F:
                stringResId = R.string.label_left_little_finger;
                break;
            default:
                stringResId = R.string.label_finger;
                break;
        }
        return resources.getString(stringResId);
    }
}
