package com.enrollmentsystem.tech5face;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import ai.tech5.pheonix.capture.controller.AirsnapFaceThresholds;
import ai.tech5.pheonix.capture.controller.CompressBy;
import ai.tech5.pheonix.capture.controller.CompressionConfig;
import ai.tech5.pheonix.capture.controller.FaceCaptureController;
import ai.tech5.pheonix.capture.controller.FaceCaptureListener;
import ai.tech5.pheonix.capture.controller.FullFrontalCropConfig;
import ai.tech5.pheonix.capture.controller.GlassDetection;
import ai.tech5.pheonix.capture.controller.ImageType;
import com.phoenixcapture.camerakit.FaceBox;

import android.graphics.Bitmap;
import java.io.ByteArrayOutputStream;

public class Tech5FaceModule extends ReactContextBaseJavaModule implements FaceCaptureListener {

    private static final String TAG = "Tech5FaceModule";
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1002;

    private final ReactApplicationContext reactContext;
    private Promise capturePromise;
    private ReadableMap captureConfig;

    public Tech5FaceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "Tech5FaceModule";
    }

    @ReactMethod
    public void captureFace(ReadableMap config, Promise promise) {
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

        startFaceCapture(activity);
    }

    private void startFaceCapture(Activity activity) {
        try {
            FaceCaptureController controller = FaceCaptureController.getInstance();

            // Set license
            String license = captureConfig.hasKey("license") ? captureConfig.getString("license") : "";

            // Set camera settings
            boolean useBackCamera = captureConfig.hasKey("useBackCamera") && captureConfig.getBoolean("useBackCamera");
            controller.setUseBackCamera(useBackCamera);

            // Set auto capture
            boolean autoCapture = !captureConfig.hasKey("autoCapture") || captureConfig.getBoolean("autoCapture");
            controller.setAutoCapture(autoCapture);

            // Set occlusion detection
            boolean occlusionEnabled = !captureConfig.hasKey("occlusionEnabled") || captureConfig.getBoolean("occlusionEnabled");
            controller.setOcclusionEnabled(occlusionEnabled);

            // Set eye closed detection
            boolean eyeClosedEnabled = !captureConfig.hasKey("eyeClosedEnabled") || captureConfig.getBoolean("eyeClosedEnabled");
            controller.setEyeClosedEnabled(eyeClosedEnabled);

            // Set glass detection
            String glassDetectionStr = captureConfig.hasKey("glassDetection")
                    ? captureConfig.getString("glassDetection") : "SUN_GLASSES";
            GlassDetection glassDetection = "ANY_GLASSES".equalsIgnoreCase(glassDetectionStr)
                    ? GlassDetection.ANY_GLASSES : GlassDetection.SUN_GLASSES;
            controller.setGlassDetection(glassDetection);

            // Set timeout
            int timeout = captureConfig.hasKey("timeoutInSecs")
                    ? captureConfig.getInt("timeoutInSecs") : 60;
            controller.setCaptureTimeoutInSecs(timeout);

            // Set compression
            boolean compression = captureConfig.hasKey("compression") && captureConfig.getBoolean("compression");
            controller.setCompression(compression);

            // Set ISO/ICAO checks
            boolean isISOEnabled = captureConfig.hasKey("isISOEnabled") && captureConfig.getBoolean("isISOEnabled");
            controller.setIsISOEnabled(isISOEnabled);

            // Set camera switching
            boolean enableCameraSwitching = captureConfig.hasKey("enableCameraSwitching") && captureConfig.getBoolean("enableCameraSwitching");
            controller.setEnableCameraSwitching(enableCameraSwitching);

            // Set frame capture (fast capture mode)
            boolean frameCapture = captureConfig.hasKey("fastCapture") && captureConfig.getBoolean("fastCapture");
            controller.setFrameCapture(frameCapture);

            // Set message frequency
            int messagesFrequency = captureConfig.hasKey("messagesFrequency")
                    ? captureConfig.getInt("messagesFrequency") : 3;
            controller.setMessagesFrequency(messagesFrequency);

            // Set font size
            int fontSize = captureConfig.hasKey("fontSize")
                    ? captureConfig.getInt("fontSize") : 16;
            controller.setFontSize(fontSize);

            // Set thresholds
            if (captureConfig.hasKey("thresholds")) {
                ReadableMap thresholdsMap = captureConfig.getMap("thresholds");
                if (thresholdsMap != null) {
                    AirsnapFaceThresholds thresholds = new AirsnapFaceThresholds();

                    if (thresholdsMap.hasKey("pitchThreshold")) {
                        thresholds.setPITCH_THRESHOLD(thresholdsMap.getInt("pitchThreshold"));
                    }
                    if (thresholdsMap.hasKey("yawThreshold")) {
                        thresholds.setYAW_THRESHOLD(thresholdsMap.getInt("yawThreshold"));
                    }
                    if (thresholdsMap.hasKey("rollThreshold")) {
                        thresholds.setRollThreshold(thresholdsMap.getInt("rollThreshold"));
                    }
                    if (thresholdsMap.hasKey("maskThreshold")) {
                        thresholds.setMASK_THRESHOLD((float) thresholdsMap.getDouble("maskThreshold"));
                    }
                    if (thresholdsMap.hasKey("anyGlassThreshold")) {
                        thresholds.setANYGLASS_THRESHOLD((float) thresholdsMap.getDouble("anyGlassThreshold"));
                    }
                    if (thresholdsMap.hasKey("sunGlassThreshold")) {
                        thresholds.setSUNGLASS_THRESHOLD((float) thresholdsMap.getDouble("sunGlassThreshold"));
                    }
                    if (thresholdsMap.hasKey("brisqueThreshold")) {
                        thresholds.setBRISQUE_THRESHOLD((int) thresholdsMap.getDouble("brisqueThreshold"));
                    }
                    if (thresholdsMap.hasKey("livenessThreshold")) {
                        thresholds.setLIVENESS_THRESHOLD((float) thresholdsMap.getDouble("livenessThreshold"));
                    }
                    if (thresholdsMap.hasKey("eyeCloseThreshold")) {
                        thresholds.setEYE_CLOSE_THRESHOLD((float) thresholdsMap.getDouble("eyeCloseThreshold"));
                    }

                    controller.setAirsnapFaceThresholds(thresholds);
                }
            }

            // Set compression config
            if (captureConfig.hasKey("compressionConfig")) {
                ReadableMap compConfigMap = captureConfig.getMap("compressionConfig");
                if (compConfigMap != null) {
                    CompressionConfig compressionConfig = new CompressionConfig();

                    String compressBy = compConfigMap.hasKey("compressBy")
                            ? compConfigMap.getString("compressBy") : "COMPRESSION_RATE";
                    compressionConfig.setCompressBy("TARGET_SIZE".equalsIgnoreCase(compressBy)
                            ? CompressBy.COMPRESS_BY_TARGET_SIZE : CompressBy.COMPRESS_BY_COMPRESSION_RATE);

                    if (compConfigMap.hasKey("compressionRate")) {
                        compressionConfig.setCompressionRate(compConfigMap.getInt("compressionRate"));
                    }
                    if (compConfigMap.hasKey("targetSizeInKbs")) {
                        compressionConfig.setTargetSizeInKbs(compConfigMap.getInt("targetSizeInKbs"));
                    }

                    controller.setCompressionConfig(compressionConfig);
                }
            }

            // Set full frontal crop config (portal image)
            if (captureConfig.hasKey("fullFrontalCropConfig")) {
                ReadableMap cropConfigMap = captureConfig.getMap("fullFrontalCropConfig");
                if (cropConfigMap != null) {
                    FullFrontalCropConfig cropConfig = new FullFrontalCropConfig();

                    if (cropConfigMap.hasKey("portalWidth")) {
                        cropConfig.setPortalWidth(cropConfigMap.getDouble("portalWidth"));
                    }
                    if (cropConfigMap.hasKey("imageType")) {
                        String imageTypeStr = cropConfigMap.getString("imageType");
                        cropConfig.setImageType("BMP".equalsIgnoreCase(imageTypeStr)
                                ? ImageType.IMAGE_TYPE_BMP : ImageType.IMAGE_TYPE_JPG);
                    }
                    if (cropConfigMap.hasKey("compression")) {
                        cropConfig.setCompression(cropConfigMap.getDouble("compression"));
                    }
                    if (cropConfigMap.hasKey("getSegmentedImage")) {
                        cropConfig.getSegmentedImage(cropConfigMap.getBoolean("getSegmentedImage"));
                    }
                    if (cropConfigMap.hasKey("segmentedImageBackgroundColor")) {
                        ReadableArray colorArray = cropConfigMap.getArray("segmentedImageBackgroundColor");
                        if (colorArray != null && colorArray.size() >= 3) {
                            cropConfig.setSegmentedImageBackgroundColor(
                                    colorArray.getInt(0),
                                    colorArray.getInt(1),
                                    colorArray.getInt(2)
                            );
                        }
                    }

                    controller.setFullFrontalCropConfig(cropConfig);
                }
            }

            // Start face capture
            controller.startFaceCapture(license, activity, this);

        } catch (Exception e) {
            Log.e(TAG, "Error starting face capture: " + e.getMessage(), e);
            if (capturePromise != null) {
                capturePromise.reject("CAPTURE_ERROR", "Error starting face capture: " + e.getMessage());
                capturePromise = null;
            }
        }
    }

    @Override
    public void onFaceCaptured(byte[] image, byte[] originalImage, FaceBox faceBox) {
        if (capturePromise == null) return;

        try {
            WritableMap response = Arguments.createMap();
            response.putBoolean("success", true);

            // Add captured image (compressed)
            if (image != null) {
                response.putString("imageBase64", Base64.encodeToString(image, Base64.NO_WRAP));
            }

            // Add original image (uncompressed)
            if (originalImage != null) {
                response.putString("originalImageBase64", Base64.encodeToString(originalImage, Base64.NO_WRAP));
            }

            // Add face box data (quality metrics)
            if (faceBox != null) {
                WritableMap faceData = Arguments.createMap();

                // Pose angles
                faceData.putDouble("pan", faceBox.mPan);
                faceData.putDouble("pitch", faceBox.mPitch);
                faceData.putDouble("roll", faceBox.mRoll);

                // Eye distance
                faceData.putDouble("eyeDistance", faceBox.mEyeDist);

                // Gaze
                faceData.putDouble("horizontalGaze", faceBox.mHorizontalGaze);
                faceData.putDouble("verticalGaze", faceBox.mVerticalGaze);

                // Quality scores
                faceData.putDouble("blurScore", faceBox.mBlurScore);
                faceData.putDouble("exposureScore", faceBox.mExposureScore);
                faceData.putDouble("brightnessScore", faceBox.mBrightnessScore);
                faceData.putDouble("skinToneScore", faceBox.mSkinToneScore);
                faceData.putDouble("hotspotScore", faceBox.mHotspotScore);
                faceData.putDouble("redEyesScore", faceBox.mRedEyesScore);

                // Expression scores
                faceData.putDouble("mouthOpenScore", faceBox.mMouthOpenScore);
                faceData.putDouble("laughScore", faceBox.mLaughScore);

                // Background scores
                faceData.putDouble("uniformBackgroundScore", faceBox.mUniformBackgroundScore);
                faceData.putDouble("uniformBackgroundColorScore", faceBox.mUniformBackgroundColorScore);
                faceData.putDouble("uniformIlluminationScore", faceBox.mUniformIlluminationScore);
                faceData.putDouble("faceBackDiffScore", faceBox.mFaceBackDiffScore);

                // Occlusion scores
                faceData.putDouble("maskScore", faceBox.mMask);
                faceData.putDouble("anyGlassScore", faceBox.mAnyGlass);
                faceData.putDouble("sunGlassScore", faceBox.mSunGlass);
                faceData.putDouble("headphonesScore", faceBox.mHeadphonesScore);
                faceData.putDouble("hatScore", faceBox.mHatScore);
                faceData.putDouble("handOcclusion", faceBox.mHandOcclusion);

                // Eye closure
                faceData.putDouble("leftEyeCloseScore", faceBox.mLeftEyeClose);
                faceData.putDouble("rightEyeCloseScore", faceBox.mRightEyeClose);

                // Portal/segmented image
                faceData.putBoolean("hasPortalImage", faceBox.mHasPortalImageSegmented == 1);
                if (faceBox.mPortalImageSegmented != null) {
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    faceBox.mPortalImageSegmented.compress(Bitmap.CompressFormat.JPEG, 90, baos);
                    byte[] portalBytes = baos.toByteArray();
                    faceData.putString("portalImageBase64",
                            Base64.encodeToString(portalBytes, Base64.NO_WRAP));
                }

                response.putMap("faceData", faceData);
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
    public void OnFaceCaptureFailed(String errorMessage) {
        if (capturePromise != null) {
            capturePromise.reject("CAPTURE_FAILED", errorMessage);
            capturePromise = null;
        }
    }

    @Override
    public void onCancelled() {
        if (capturePromise != null) {
            capturePromise.reject("CANCELLED", "Face capture was cancelled by user");
            capturePromise = null;
        }
    }

    @Override
    public void onTimedout(byte[] faceImage) {
        if (capturePromise != null) {
            if (faceImage != null) {
                // Return the best captured frame on timeout
                WritableMap response = Arguments.createMap();
                response.putBoolean("success", false);
                response.putBoolean("timedOut", true);
                response.putString("imageBase64", Base64.encodeToString(faceImage, Base64.NO_WRAP));
                capturePromise.resolve(response);
            } else {
                capturePromise.reject("TIMEOUT", "Face capture timed out");
            }
            capturePromise = null;
        }
    }

    @ReactMethod
    public void initSDK(String license, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null");
            return;
        }

        try {
            FaceCaptureController.getInstance().initSDK(activity, license);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", "Failed to initialize SDK: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getDeviceIdentifier(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null");
            return;
        }

        try {
            String deviceId = FaceCaptureController.getInstance().getDeviceIdentifier(activity);
            promise.resolve(deviceId);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to get device identifier: " + e.getMessage());
        }
    }

    @ReactMethod
    public void deregisterDevice(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null");
            return;
        }

        FaceCaptureController.getInstance().deregisterDevice(activity, isDeregistered -> {
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
