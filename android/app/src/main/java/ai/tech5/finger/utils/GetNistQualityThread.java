package ai.tech5.finger.utils;

import ai.tech5.sdk.abis.T5AirSnap.SgmRectImage;
import ai.tech5.sdk.abis.T5AirSnap.T5AirSnap;

public class GetNistQualityThread implements Runnable {
    private SgmRectImage m_rect = null;
    private byte m_nistQuality = 0;
    private T5AirSnap m_cellSdk = null;

    public GetNistQualityThread(T5AirSnap airSnap, SgmRectImage rect) {
        m_cellSdk = airSnap;
        m_rect = rect;
    }

   public byte getNistQuality() {
        return m_nistQuality;
    }

   public int getFingerPos() {
        return (m_rect != null) ? m_rect.pos : 0;
    }

    @Override
    public void run() {
        try {
            if (m_rect != null) {


                Byte nistQuality = new Byte((byte) 0);

                m_cellSdk.getNistFingerImageQuality(m_rect.image, m_rect.width, m_rect.height, nistQuality);


                m_nistQuality = nistQuality;
            }
        } catch (Exception ex) {
            //Log.e(APP_TAG," From thread error is " + ex.getMessage());
        }
    }
}