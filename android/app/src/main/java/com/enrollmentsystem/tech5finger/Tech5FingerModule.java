package com.enrollmentsystem.tech5finger;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.util.ArrayList;
import java.util.LinkedHashSet;

import ai.tech5.finger.utils.CaptureMode;
import ai.tech5.finger.utils.CaptureSpeed;
import ai.tech5.finger.utils.Finger;
import ai.tech5.finger.utils.FingerCaptureResult;
import ai.tech5.finger.utils.ImageConfiguration;
import ai.tech5.finger.utils.ImageType;
import ai.tech5.finger.utils.LivenessScore;
import ai.tech5.finger.utils.SegmentationMode;
import ai.tech5.finger.utils.Slap;
import ai.tech5.finger.utils.T5FingerCaptureController;
import ai.tech5.finger.utils.T5FingerCapturedListener;

public class Tech5FingerModule extends ReactContextBaseJavaModule implements T5FingerCapturedListener {

    private static final String TAG = "Tech5FingerModule";
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;

    private final ReactApplicationContext reactContext;
    private Promise capturePromise;
    private ReadableMap captureConfig;

    public Tech5FingerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "Tech5FingerModule";
    }

    @ReactMethod
    public void captureFingers(ReadableMap config, Promise promise) {
        this.capturePromise = promise;
        this.captureConfig = config;

        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null");
            return;
        }

        // Check camera permission
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(activity,
                    new String[]{Manifest.permission.CAMERA},
                    CAMERA_PERMISSION_REQUEST_CODE);
            return;
        }

        startFingerCapture(activity);
    }

    private void startFingerCapture(Activity activity) {
        try {
            T5FingerCaptureController controller = T5FingerCaptureController.getInstance();

            // Set license
            String license = captureConfig.hasKey("license") ? captureConfig.getString("license") : "";
            controller.setLicense(license);

            // Set liveness check
            boolean livenessCheck = captureConfig.hasKey("livenessCheck") && captureConfig.getBoolean("livenessCheck");
            controller.setLivenessCheck(livenessCheck);

            // Set quality checks
            boolean getQuality = captureConfig.hasKey("getQuality") && captureConfig.getBoolean("getQuality");
            controller.setIsGetQuality(getQuality);

            boolean getNfiq2Quality = captureConfig.hasKey("getNfiq2Quality") && captureConfig.getBoolean("getNfiq2Quality");
            controller.setIsGetNist2Quality(getNfiq2Quality);

            // Set detector threshold
            float detectorThreshold = captureConfig.hasKey("detectorThreshold")
                    ? (float) captureConfig.getDouble("detectorThreshold") : 0.9f;
            controller.setDetectorThreshold(detectorThreshold);

            // Set segmentation modes
            LinkedHashSet<SegmentationMode> segmentationModes = new LinkedHashSet<>();
            if (captureConfig.hasKey("segmentationModes")) {
                ReadableArray modes = captureConfig.getArray("segmentationModes");
                if (modes != null) {
                    for (int i = 0; i < modes.size(); i++) {
                        String mode = modes.getString(i);
                        segmentationModes.add(parseSegmentationMode(mode));
                    }
                }
            }
            if (segmentationModes.isEmpty()) {
                segmentationModes.add(SegmentationMode.SEGMENTATION_MODE_LEFT_SLAP);
            }
            controller.setSegmentationModes(segmentationModes);

            // Set capture mode
            String captureModeStr = captureConfig.hasKey("captureMode")
                    ? captureConfig.getString("captureMode") : "self";
            CaptureMode captureMode = "operator".equalsIgnoreCase(captureModeStr)
                    ? CaptureMode.CAPTURE_MODE_OPERATOR : CaptureMode.CAPTURE_MODE_SELF;
            controller.setCaptureMode(captureMode);

            // Set title
            String title = captureConfig.hasKey("title")
                    ? captureConfig.getString("title") : "Finger Capture";
            controller.setTitle(title);

            // Set show back button
            boolean showBackButton = captureConfig.hasKey("showBackButton") && captureConfig.getBoolean("showBackButton");
            controller.setShowBackButton(showBackButton);

            // Set missing fingers
            ArrayList<Integer> missingFingers = new ArrayList<>();
            if (captureConfig.hasKey("missingFingers")) {
                ReadableArray missing = captureConfig.getArray("missingFingers");
                if (missing != null) {
                    for (int i = 0; i < missing.size(); i++) {
                        missingFingers.add(missing.getInt(i));
                    }
                }
            }
            controller.setMissingFingers(missingFingers);

            // Set capture speed
            String speedStr = captureConfig.hasKey("captureSpeed")
                    ? captureConfig.getString("captureSpeed") : "normal";
            CaptureSpeed captureSpeed = parseCaptureSpeed(speedStr);
            controller.setCaptureSpeed(captureSpeed);

            // Set prop denoise
            boolean propDenoise = captureConfig.hasKey("propDenoise") && captureConfig.getBoolean("propDenoise");
            controller.setPropDenoise(propDenoise);

            // Set clean fingerprints
            boolean cleanFingerPrints = captureConfig.hasKey("cleanFingerPrints") && captureConfig.getBoolean("cleanFingerPrints");
            controller.setCleanFingerPrints(cleanFingerPrints);

            // Set outside capture flag
            boolean outsideCapture = captureConfig.hasKey("outsideCapture") && captureConfig.getBoolean("outsideCapture");
            controller.setOutsideCaptureFlag(outsideCapture);

            // Set image configuration for segmented fingers
            ImageConfiguration segmentedConfig = new ImageConfiguration();
            if (captureConfig.hasKey("segmentedImageConfig")) {
                ReadableMap imgConfig = captureConfig.getMap("segmentedImageConfig");
                if (imgConfig != null) {
                    if (imgConfig.hasKey("imageType")) {
                        segmentedConfig.setPrimaryImageType(parseImageType(imgConfig.getString("imageType")));
                    }
                    if (imgConfig.hasKey("cropImage")) {
                        segmentedConfig.setIsCropImage(imgConfig.getBoolean("cropImage"));
                    }
                    if (imgConfig.hasKey("croppedImageWidth")) {
                        segmentedConfig.setCroppedImageWidth(imgConfig.getInt("croppedImageWidth"));
                    }
                    if (imgConfig.hasKey("croppedImageHeight")) {
                        segmentedConfig.setCroppedImageHeight(imgConfig.getInt("croppedImageHeight"));
                    }
                    if (imgConfig.hasKey("compressionRatio")) {
                        segmentedConfig.setCompressionRatio((float) imgConfig.getDouble("compressionRatio"));
                    }
                    if (imgConfig.hasKey("paddingColor")) {
                        segmentedConfig.setPaddingColor(imgConfig.getInt("paddingColor"));
                    }
                }
            } else {
                segmentedConfig.setPrimaryImageType(ImageType.IMAGE_TYPE_PNG);
                segmentedConfig.setIsCropImage(false);
            }
            controller.setSegmentedFingerImagesConfig(segmentedConfig);

            // Set image configuration for slap images
            ImageConfiguration slapConfig = new ImageConfiguration();
            if (captureConfig.hasKey("slapImageConfig")) {
                ReadableMap imgConfig = captureConfig.getMap("slapImageConfig");
                if (imgConfig != null) {
                    if (imgConfig.hasKey("imageType")) {
                        slapConfig.setPrimaryImageType(parseImageType(imgConfig.getString("imageType")));
                    }
                    if (imgConfig.hasKey("cropImage")) {
                        slapConfig.setIsCropImage(imgConfig.getBoolean("cropImage"));
                    }
                }
            } else {
                slapConfig.setPrimaryImageType(ImageType.IMAGE_TYPE_BMP);
                slapConfig.setIsCropImage(false);
            }
            controller.setSlapImagesConfig(slapConfig);

            // Set timeout
            int timeout = captureConfig.hasKey("timeoutInSecs")
                    ? captureConfig.getInt("timeoutInSecs") : 60;
            controller.setTimeoutInSecs(timeout);

            // Set show ellipses
            boolean showEllipses = !captureConfig.hasKey("showEllipses") || captureConfig.getBoolean("showEllipses");
            controller.showElipses(showEllipses);

            // Start capture
            controller.captureFingers(activity, this);

        } catch (Exception e) {
            Log.e(TAG, "Error starting finger capture: " + e.getMessage(), e);
            if (capturePromise != null) {
                capturePromise.reject("CAPTURE_ERROR", "Error starting finger capture: " + e.getMessage());
                capturePromise = null;
            }
        }
    }

    private SegmentationMode parseSegmentationMode(String mode) {
        if (mode == null) return SegmentationMode.SEGMENTATION_MODE_LEFT_SLAP;

        switch (mode.toUpperCase()) {
            case "LEFT_SLAP":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_SLAP;
            case "RIGHT_SLAP":
                return SegmentationMode.SEGMENTATION_MODE_RIGHT_SLAP;
            case "LEFT_THUMB":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_THUMB;
            case "RIGHT_THUMB":
                return SegmentationMode.SEGMENTATION_MODE_RIGHT_THUMB;
            case "LEFT_AND_RIGHT_THUMBS":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_AND_RIGHT_THUMBS;
            case "LEFT_INDEX":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_INDEX;
            case "LEFT_MIDDLE":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_MIDDLE;
            case "LEFT_RING":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_RING;
            case "LEFT_LITTLE":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_LITTLE;
            case "RIGHT_INDEX":
                return SegmentationMode.SEGMENTATION_MODE_RIGHT_INDEX;
            case "RIGHT_MIDDLE":
                return SegmentationMode.SEGMENTATION_MODE_RIGHT_MIDDLE;
            case "RIGHT_RING":
                return SegmentationMode.SEGMENTATION_MODE_RIGHT_RING;
            case "RIGHT_LITTLE":
                return SegmentationMode.SEGMENTATION_MODE_RIGHT_LITTLE;
            case "RIGHT_INDEX_MIDDLE":
                return SegmentationMode.SEGMENTATION_MODE_RIGHT_INDEX_MIDDLE;
            case "LEFT_INDEX_MIDDLE":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_INDEX_MIDDLE;
            case "RIGHT_RING_LITTLE":
                return SegmentationMode.SEGMENTATION_MODE_RIGHT_RING_LITTLE;
            case "LEFT_RING_LITTLE":
                return SegmentationMode.SEGMENTATION_MODE_LEFT_RING_LITTLE;
            default:
                return SegmentationMode.SEGMENTATION_MODE_LEFT_SLAP;
        }
    }

    private CaptureSpeed parseCaptureSpeed(String speed) {
        if (speed == null) return CaptureSpeed.CAPTURE_SPEED_NORMAL;

        switch (speed.toLowerCase()) {
            case "low":
                return CaptureSpeed.CAPTURE_SPEED_LOW;
            case "high":
                return CaptureSpeed.CAPTURE_SPEED_HIGH;
            case "normal":
            default:
                return CaptureSpeed.CAPTURE_SPEED_NORMAL;
        }
    }

    private ImageType parseImageType(String type) {
        if (type == null) return ImageType.IMAGE_TYPE_PNG;

        switch (type.toUpperCase()) {
            case "WSQ":
                return ImageType.IMAGE_TYPE_WSQ;
            case "BMP":
                return ImageType.IMAGE_TYPE_BMP;
            case "PNG":
            default:
                return ImageType.IMAGE_TYPE_PNG;
        }
    }

    private String imageTypeToString(ImageType type) {
        if (type == null) return "PNG";
        switch (type) {
            case IMAGE_TYPE_WSQ:
                return "WSQ";
            case IMAGE_TYPE_BMP:
                return "BMP";
            case IMAGE_TYPE_PNG:
            default:
                return "PNG";
        }
    }

    @Override
    public void onSuccess(FingerCaptureResult result) {
        if (capturePromise == null) return;

        try {
            WritableMap response = Arguments.createMap();
            response.putBoolean("success", true);

            // Add fingers data
            if (result.fingers != null && !result.fingers.isEmpty()) {
                WritableArray fingersArray = Arguments.createArray();
                for (Finger finger : result.fingers) {
                    WritableMap fingerMap = Arguments.createMap();
                    fingerMap.putInt("position", finger.pos);
                    fingerMap.putInt("nistQuality", finger.nistQuality);
                    fingerMap.putInt("nist2Quality", finger.nist2Quality);
                    fingerMap.putInt("quality", finger.quality);
                    fingerMap.putInt("minutiaesNumber", finger.minutiaesNumber);
                    fingerMap.putString("primaryImageType", imageTypeToString(finger.primaryImageType));

                    if (finger.primaryImage != null) {
                        fingerMap.putString("primaryImageBase64", Base64.encodeToString(finger.primaryImage, Base64.NO_WRAP));
                    }
                    if (finger.displayImage != null) {
                        fingerMap.putString("displayImageBase64", Base64.encodeToString(finger.displayImage, Base64.NO_WRAP));
                        fingerMap.putString("displayImageType", imageTypeToString(finger.displayImageType));
                    }

                    fingersArray.pushMap(fingerMap);
                }
                response.putArray("fingers", fingersArray);
            }

            // Add slap images
            if (result.slapImages != null && !result.slapImages.isEmpty()) {
                WritableArray slapsArray = Arguments.createArray();
                for (Slap slap : result.slapImages) {
                    WritableMap slapMap = Arguments.createMap();
                    slapMap.putInt("position", slap.pos);
                    slapMap.putString("imageType", imageTypeToString(slap.imageType));
                    if (slap.image != null) {
                        slapMap.putString("imageBase64", Base64.encodeToString(slap.image, Base64.NO_WRAP));
                    }
                    slapsArray.pushMap(slapMap);
                }
                response.putArray("slapImages", slapsArray);
            }

            // Add liveness scores
            if (result.livenessScores != null && !result.livenessScores.isEmpty()) {
                WritableArray livenessArray = Arguments.createArray();
                for (LivenessScore score : result.livenessScores) {
                    WritableMap scoreMap = Arguments.createMap();
                    scoreMap.putInt("positionCode", score.pos);
                    scoreMap.putDouble("score", score.score);
                    livenessArray.pushMap(scoreMap);
                }
                response.putArray("livenessScores", livenessArray);
            }

            capturePromise.resolve(response);
        } catch (Exception e) {
            Log.e(TAG, "Error processing capture result: " + e.getMessage(), e);
            capturePromise.reject("RESULT_ERROR", "Error processing capture result: " + e.getMessage());
        } finally {
            capturePromise = null;
        }
    }

    @Override
    public void onTimedout() {
        if (capturePromise != null) {
            capturePromise.reject("TIMEOUT", "Finger capture timed out");
            capturePromise = null;
        }
    }

    @Override
    public void onFailure(String errorMessage) {
        if (capturePromise != null) {
            capturePromise.reject("CAPTURE_FAILED", errorMessage);
            capturePromise = null;
        }
    }

    @Override
    public void onCancelled() {
        if (capturePromise != null) {
            capturePromise.reject("CANCELLED", "Finger capture was cancelled by user");
            capturePromise = null;
        }
    }

    @ReactMethod
    public void deregisterDevice(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null");
            return;
        }

        T5FingerCaptureController.getInstance().deregisterDevice(activity, isDeregistered -> {
            if (isDeregistered) {
                promise.resolve(true);
            } else {
                promise.reject("DEREGISTER_FAILED", "Device deregistration failed");
            }
        });
    }

    @ReactMethod
    public void checkCameraPermission(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null");
            return;
        }

        boolean hasPermission = ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED;
        promise.resolve(hasPermission);
    }

    @ReactMethod
    public void requestCameraPermission(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null");
            return;
        }

        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(true);
            return;
        }

        ActivityCompat.requestPermissions(activity,
                new String[]{Manifest.permission.CAMERA},
                CAMERA_PERMISSION_REQUEST_CODE);

        // Note: The actual result will come through onRequestPermissionsResult
        // For simplicity, we resolve immediately - the actual capture will check again
        promise.resolve(false);
    }
}
