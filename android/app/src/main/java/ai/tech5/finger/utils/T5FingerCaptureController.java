package ai.tech5.finger.utils;


import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import ai.tech5.finger.FingerCaptureActivity;
import ai.tech5.sdk.abis.T5AirSnap.NistPosCode;
import ai.tech5.sdk.abis.T5AirSnap.T5AirSnap;


public class T5FingerCaptureController {

    private static T5FingerCaptureController fingerCaptureController = null;
    private static T5FingerCapturedListener fingerCapturedListener = null;

    private boolean livenessCheck = true;
    private boolean showElipses = true;
    private boolean getNistQuality = false;

    private boolean getNist2Quality = false;
    private boolean outsideCapture = false;

    public void setIsGetNist2Quality(boolean getNist2Quality) {
        this.getNist2Quality = getNist2Quality;
    }


    private String projectToken = "";

    public void setMissingFingers(ArrayList<Integer> missingFingers) {
        if (missingFingers != null) {
            this.missingFingers = missingFingers;
        }
    }

    private ArrayList<Integer> missingFingers = new ArrayList<>();


    private LinkedHashSet<SegmentationMode> segmentationModes = getDefaultSegmentationModes();

    private CaptureMode captureMode = CaptureMode.CAPTURE_MODE_SELF;

    public void setCaptureSpeed(CaptureSpeed captureSpeed) {
        this.captureSpeed = captureSpeed;
    }

    private CaptureSpeed captureSpeed = CaptureSpeed.CAPTURE_SPEED_NORMAL;

    public void setPropDenoise(boolean propDenoise) {
        this.propDenoise = propDenoise;
    }

    public void setCleanFingerPrints(boolean cleanFingerPrints) {
        this.cleanFingerPrints = cleanFingerPrints;
    }

    private boolean propDenoise = false;

    private boolean cleanFingerPrints = false;
    private float detectorThreshold = 0.9F;

    private String title;
    private boolean showBackButton = false;

    private int timeoutInSecs = 60;
    private ImageConfiguration segmentedFingerImagesConfig = getDefaultSegmentedImageConfig();
    private ImageConfiguration slapImagesConfig = getDefaultSlapImageConfig();

//    public static T5FingerCaptureController getFingerCaptureController() {
//        return fingerCaptureController;
//    }


    private final Handler handler;
    private final ExecutorService executorService;


    private ImageConfiguration getDefaultSegmentedImageConfig() {

        return new ImageConfiguration();
    }


    private ImageConfiguration getDefaultSlapImageConfig() {

        ImageConfiguration configuration = new ImageConfiguration();
        configuration.setPrimaryImageType(ImageType.IMAGE_TYPE_PNG);
        configuration.setIsCropImage(false);

        return configuration;

    }


    private LinkedHashSet<SegmentationMode> getDefaultSegmentationModes() {
        LinkedHashSet<SegmentationMode> modes = new LinkedHashSet<>();
        modes.add(SegmentationMode.SEGMENTATION_MODE_LEFT_SLAP);
        return modes;
    }


    public static T5FingerCaptureController getInstance() {
        if (fingerCaptureController == null) {
            fingerCaptureController = new T5FingerCaptureController();
        }
        return fingerCaptureController;
    }


    private T5FingerCaptureController() {

        handler = new Handler(Looper.getMainLooper());
        executorService = Executors.newFixedThreadPool(1);
    }


    public void setIsGetQuality(boolean getQuality) {
        this.getNistQuality = getQuality;
    }


    public void showElipses(boolean showElipses) {
        this.showElipses = showElipses;
    }

    public void setLivenessCheck(boolean livenessCheck) {
        this.livenessCheck = livenessCheck;
    }


    public void setLicense(String projectToken) {
        if (this.projectToken != null) {
            this.projectToken = projectToken;
        }
    }

    public void setCaptureMode(CaptureMode captureMode) {
        this.captureMode = captureMode;
    }

    public void setTitle(String pageTitle) {
        this.title = pageTitle;
    }

    public void setShowBackButton(boolean showBackButton) {
        this.showBackButton = showBackButton;
    }

    public void setSegmentationModes(LinkedHashSet<SegmentationMode> segmentationModes) {
        this.segmentationModes = segmentationModes;
    }

    public void setDetectorThreshold(float detectorThreshold) {
        this.detectorThreshold = detectorThreshold;
    }

    public void setTimeoutInSecs(int timeoutInSecs) {
        this.timeoutInSecs = timeoutInSecs;
    }


    public void setOutsideCaptureFlag(boolean outsideCaptureFlag) {
        outsideCapture = outsideCaptureFlag;

    }


    public T5FingerCapturedListener getFingerCapturedListener() {
        return fingerCapturedListener;
    }


    public void captureFingers(Context context, T5FingerCapturedListener t5FingerCapturedListener) {
        fingerCapturedListener = t5FingerCapturedListener;


        if (segmentationModes == null || segmentationModes.isEmpty()) {
            fingerCapturedListener.onFailure("SDK initialization failed: segmentation modes is empty");
            return;
        }

        float captureSpeedVal = 0.0f;

        if (captureSpeed == CaptureSpeed.CAPTURE_SPEED_LOW) {
            captureSpeedVal = 0.0f;
        } else if (captureSpeed == CaptureSpeed.CAPTURE_SPEED_NORMAL) {
            captureSpeedVal = 0.5f;
        } else if (captureSpeed == CaptureSpeed.CAPTURE_SPEED_HIGH) {
            captureSpeedVal = 1.0f;
        }


        if (Build.VERSION.SDK_INT < 23 || ContextCompat.checkSelfPermission(context, "android.permission.CAMERA") == 0) {


            ArrayList<Integer> nistPosCodes = new ArrayList<>();

            for (SegmentationMode mode : segmentationModes) {
                nistPosCodes.add(getNistPoscode(mode));

            }

            FingerCaptureActivity.start(context, this.projectToken, nistPosCodes,
                    (this.captureMode == CaptureMode.CAPTURE_MODE_SELF), this.showElipses,
                    this.segmentedFingerImagesConfig, this.slapImagesConfig, livenessCheck,
                    getNist2Quality, getNistQuality,
                    captureSpeedVal,
                    propDenoise,
                    cleanFingerPrints,
                    missingFingers,
                    this.title,
                    this.showBackButton,
                    this.timeoutInSecs,
                    this.detectorThreshold,
                    outsideCapture);

        } else {

            fingerCapturedListener.onFailure("SDK initialization failed: Camera permission required");
        }


    }


//    public String getVersion(){
//        BuildConfig.
//    }


    public int getNistPoscode(SegmentationMode segmentationMode) {
        int posCode = NistPosCode.POS_CODE_PL_L_4F;

        switch (segmentationMode) {
            case SEGMENTATION_MODE_LEFT_SLAP:
                posCode = NistPosCode.POS_CODE_PL_L_4F;
                break;
            case SEGMENTATION_MODE_RIGHT_SLAP:
                posCode = NistPosCode.POS_CODE_PL_R_4F;
                break;
            case SEGMENTATION_MODE_LEFT_THUMB:
                posCode = NistPosCode.POS_CODE_L_THUMB;
                break;
            case SEGMENTATION_MODE_RIGHT_THUMB:
                posCode = NistPosCode.POS_CODE_R_THUMB;
                break;
            case SEGMENTATION_MODE_LEFT_AND_RIGHT_THUMBS:
                posCode = NistPosCode.POS_CODE_L_AND_R_THUMBS;
                break;
            case SEGMENTATION_MODE_LEFT_INDEX:
                posCode = NistPosCode.POS_CODE_L_INDEX_F;
                break;
            case SEGMENTATION_MODE_LEFT_MIDDLE:
                posCode = NistPosCode.POS_CODE_L_MIDDLE_F;
                break;
            case SEGMENTATION_MODE_LEFT_RING:
                posCode = NistPosCode.POS_CODE_L_RING_F;
                break;
            case SEGMENTATION_MODE_LEFT_LITTLE:
                posCode = NistPosCode.POS_CODE_L_LITTLE_F;
                break;
            case SEGMENTATION_MODE_RIGHT_INDEX:
                posCode = NistPosCode.POS_CODE_R_INDEX_F;
                break;
            case SEGMENTATION_MODE_RIGHT_MIDDLE:
                posCode = NistPosCode.POS_CODE_R_MIDDLE_F;
                break;
            case SEGMENTATION_MODE_RIGHT_RING:
                posCode = NistPosCode.POS_CODE_R_RING_F;
                break;
            case SEGMENTATION_MODE_RIGHT_LITTLE:
                posCode = NistPosCode.POS_CODE_R_LITTLE_F;
                break;

            case SEGMENTATION_MODE_RIGHT_INDEX_MIDDLE:
                posCode = NistPosCode.POS_CODE_R_INDEX_MIDDLE;
                break;

            case SEGMENTATION_MODE_RIGHT_RING_LITTLE:
                posCode = NistPosCode.POS_CODE_R_RING_LITTLE;
                break;

            case SEGMENTATION_MODE_LEFT_INDEX_MIDDLE:
                posCode = NistPosCode.POS_CODE_L_INDEX_MIDDLE;
                break;

            case SEGMENTATION_MODE_LEFT_RING_LITTLE:
                posCode = NistPosCode.POS_CODE_L_RING_LITTLE;
                break;

            default:
                break;
        }

        return posCode;
    }


    public void setSegmentedFingerImagesConfig(ImageConfiguration segmentedFingerImagesConfig) {
        this.segmentedFingerImagesConfig = segmentedFingerImagesConfig;

        if (this.segmentedFingerImagesConfig == null) {
            this.segmentedFingerImagesConfig = new ImageConfiguration();
        }
    }


//    public ImageConfiguration getSlapImagesConfig() {
//        return this.slapImagesConfig;
//    }

    public void setSlapImagesConfig(ImageConfiguration slapImagesConfig) {
        this.slapImagesConfig = slapImagesConfig;

        if (this.slapImagesConfig == null) {

            this.slapImagesConfig = new ImageConfiguration();
            this.slapImagesConfig.setIsCropImage(false);

        }
    }


    public boolean initSDK(Context context) {
        T5AirSnap m_cellSdk = new T5AirSnap(context);

        Log.d("TAG", "SDK Version " + T5AirSnap.getVersion());

        int resultCode = m_cellSdk.initSdk(this.projectToken);

        return (resultCode == 0);
    }


    public void deregisterDevice(Context context, DeviceRegistrationListener listener) {


        executorService.execute(() -> {

            T5AirSnap airSnap = null;
            try {

                airSnap = new T5AirSnap(context);
                boolean isDeregistered = airSnap.deregisterDevice();

                notifyInitCompletion(isDeregistered, listener);

            } catch (Exception e) {

                notifyInitCompletion(false, listener);
            } finally {
                if (airSnap != null) {
                    airSnap.closeSdk();
                }
            }

        });

    }


    private void notifyInitCompletion(boolean isDeregistered, DeviceRegistrationListener completion) {
        handler.post(() -> completion.onDeregisterCompletion(isDeregistered));
    }


//    public void closeSDK() {
//        if (this.m_cellSdk != null)
//            this.m_cellSdk.closeSdk();
//    }
}


