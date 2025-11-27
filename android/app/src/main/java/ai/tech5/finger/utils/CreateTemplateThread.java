package ai.tech5.finger.utils;

import ai.tech5.sdk.abis.T5AirSnap.MinexTemplateType;
import ai.tech5.sdk.abis.T5AirSnap.RawImage;
import ai.tech5.sdk.abis.T5AirSnap.T5AirSnap;

public class CreateTemplateThread implements Runnable {
    private final int m_fingersNumber = 1;
    private RawImage[] m_rawImages = null;
    private byte[] m_templateBuffer = null;
    private byte[] template = null;
    private byte m_nistQuality = 0;

    private byte m_quality = 0;
    private int m_minutiaesNumber = 0;

    private T5AirSnap m_cellSdk;

    public CreateTemplateThread(T5AirSnap airSnap, RawImage rawImage) {
        try {
            this.m_rawImages = new RawImage[this.m_fingersNumber];

            this.m_rawImages[0] = rawImage;
            this.m_cellSdk = airSnap;

            this.m_templateBuffer = m_cellSdk.allocateTemplate(this.m_fingersNumber);

        } catch (Exception exception) {
        }
    }

    byte[] getTemplate() {
        return this.template;
    }

    byte getNistQuality() {
        return this.m_nistQuality;
    }

    byte getQuality() {
        return this.m_quality;
    }

    int getMinutiaesNumber() {
        return this.m_minutiaesNumber;
    }

    int getFingerPos() {
        return (this.m_rawImages != null) ? (this.m_rawImages[0]).m_finger : 0;
    }

    public void run() {
        try {
            if (this.m_rawImages != null) {
                Byte[] nistQuality = new Byte[this.m_fingersNumber];
                Byte[] quality = new Byte[this.m_fingersNumber];
                Integer[] minutiaesNumber = new Integer[this.m_fingersNumber];

                for (int i = 0; i < this.m_fingersNumber; i++) {
                    nistQuality[i] = new Byte((byte) 0);
                    quality[i] = new Byte((byte) 0);
                    minutiaesNumber[i] = new Integer(0);
                }

                Integer templateSize = new Integer(0);

                int createTemplateResultCode = m_cellSdk.createTemplate(this.m_rawImages, MinexTemplateType.NIST_TEMPLATE, this.m_templateBuffer, nistQuality, nistQuality, minutiaesNumber, templateSize);

                Byte propQuality = new Byte((byte) 0);
                int getPropQualityResult = m_cellSdk.getFingerprintQuality(this.m_rawImages[0].m_image, this.m_rawImages[0].m_width, this.m_rawImages[0].m_height, propQuality);


                if (createTemplateResultCode == 0 && getPropQualityResult == 0) {

                    this.m_nistQuality = nistQuality[0].byteValue();
                    this.m_quality = propQuality;
                    this.m_minutiaesNumber = minutiaesNumber[0].intValue();
                    byte[] tmpl = new byte[templateSize];
                    System.arraycopy(m_templateBuffer, 0, tmpl, 0, templateSize);
                    this.template = tmpl;
                } else {
                    this.m_templateBuffer = null;
                }

            }
        } catch (Exception exception) {
        }
    }
}