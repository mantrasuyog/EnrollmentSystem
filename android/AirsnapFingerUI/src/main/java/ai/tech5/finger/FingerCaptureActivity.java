package ai.tech5.finger;

import static androidx.camera.core.ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST;
import static java.lang.Math.round;
import static ai.tech5.finger.utils.Constants.CAPTURE_SPEED;
import static ai.tech5.finger.utils.Constants.CLEAN_FINGERPRINTS;
import static ai.tech5.finger.utils.Constants.DETECTOR_THRESHOLD;
import static ai.tech5.finger.utils.Constants.EXTRA_SHOW_BACK_BUTTON;
import static ai.tech5.finger.utils.Constants.IS_GET_NIST2_QUALITY;
import static ai.tech5.finger.utils.Constants.IS_GET_NIST_QUALITY;
import static ai.tech5.finger.utils.Constants.LIVENESS_CHECK;
import static ai.tech5.finger.utils.Constants.MISSING_FINGERS;
import static ai.tech5.finger.utils.Constants.ORIENTATION_CHECK;
import static ai.tech5.finger.utils.Constants.OUTSIDE_CAPTURE_FLAG;
import static ai.tech5.finger.utils.Constants.PAGE_TITLE;
import static ai.tech5.finger.utils.Constants.PROJECT_TOKEN;
import static ai.tech5.finger.utils.Constants.PROP_DENOISE;
import static ai.tech5.finger.utils.Constants.SEGMENTATION_MODES;
import static ai.tech5.finger.utils.Constants.SEGMENTED_IMAGE_CONFIG;
import static ai.tech5.finger.utils.Constants.SHOW_BOUNDING_BOXES;
import static ai.tech5.finger.utils.Constants.SLAP_IMAGE_CONFIG;
import static ai.tech5.finger.utils.Constants.TIME_OUT;
import static ai.tech5.finger.utils.ModelsUtil.extractModels;
import static ai.tech5.sdk.abis.T5AirSnap.CaptureStatus.bestFrameChosen;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_AND_R_THUMBS;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_INDEX_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_LITTLE_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_MIDDLE_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_RING_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_L_THUMB;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_INDEX_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_LITTLE_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_MIDDLE_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_RING_F;
import static ai.tech5.sdk.abis.T5AirSnap.NistPosCode.POS_CODE_R_THUMB;

import android.annotation.SuppressLint;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.TotalCaptureResult;
import android.media.Image;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.util.Log;
import android.util.Range;
import android.util.Size;
import android.util.SizeF;
import android.view.MenuItem;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.camera2.interop.Camera2Interop;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraControl;
import androidx.camera.core.CameraInfo;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ExposureState;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.MeteringPoint;
import androidx.camera.core.Preview;
import androidx.camera.core.SurfaceOrientedMeteringPointFactory;
import androidx.camera.core.ZoomState;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import ai.tech5.finger.utils.AirsnapUtils;
import ai.tech5.finger.utils.CaptureObjectNameUtil;
import ai.tech5.finger.utils.DeviceChecker;
import ai.tech5.finger.utils.Finger;
import ai.tech5.finger.utils.FingerCaptureResult;
import ai.tech5.finger.utils.ImageConfiguration;
import ai.tech5.finger.utils.LivenessScore;
import ai.tech5.finger.utils.Logger;
import ai.tech5.finger.utils.MyExceptionHandler;
import ai.tech5.finger.utils.Quality;
import ai.tech5.finger.utils.RawSlap;
import ai.tech5.finger.utils.Slap;
import ai.tech5.finger.utils.T5FingerCaptureController;
import ai.tech5.sdk.abis.T5AirSnap.CaptureStatus;
import ai.tech5.sdk.abis.T5AirSnap.NistPosCode;
import ai.tech5.sdk.abis.T5AirSnap.SgmRectImage;
import ai.tech5.sdk.abis.T5AirSnap.T5AirSnap;


public class FingerCaptureActivity extends AppCompatActivity {


    private static final String TAG = FingerCaptureActivity.class.getSimpleName();

    private T5AirSnap m_cellSdk = null;


    private static ExecutorService m_service = null;
    CameraSelector m_cameraSelector = null;
    File m_logFile = null;
    String m_rootDirectory = "";
    HashMap<Integer, Quality> nistQualitiesMap = new HashMap<>();
    HashMap<Integer, Byte> nist2QualitiesMap = new HashMap<>();

    HashMap<Integer, SgmRectImage> segmentedRects = new HashMap<>();

    ArrayList<LivenessScore> livenessScoresList = new ArrayList<>();

    ArrayList<RawSlap> slaps = new ArrayList<>();

    private ImageView m_transparentImageView;


    private FingerCaptureResult captureResult = null;
    private ExecutorService m_cameraExecutorService;
    private PreviewView m_viewFinder;
    private Preview m_preview = null;
    private ImageAnalysis m_imageAnalyzer = null;
    private Camera m_camera = null;
    private ProcessCameraProvider m_cameraProvider = null;
    private boolean m_livenessCheck = false;
    private boolean m_showBoundingBoxes = false;
    private boolean m_getNistQuality = false;

    private boolean m_getNist2Quality = true;

    private boolean m_propDenoise = false;

    private boolean m_cleanFingerPrints = false;
    private boolean m_outsideCapture = false;

    private List<Integer> missingFingers = new ArrayList<>();

    private ImageConfiguration segmentedFingerImageConfiguration = null;
    private ImageConfiguration slapImageConfiguration = null;

    ArrayList<Integer> segmentationModes = null;
    private int m_positionCode = 0;

    int posIndex = 0;

    private GraphicOverlay m_graphicOverlay;
    private ProgressDialog m_progressDialog;
    private TextView txtStatus;
    private CountDownTimer countDownTimer = null;
    private int timeout = 60;

    private float m_current_distance = 0.0f;
    private AirsnapUtils airsnapUtils;


    private final AtomicBoolean m_zoomApplied = new AtomicBoolean(false);
    private long  m_setZoomTime = 0;


    public static void start(Context context, String projectToken, ArrayList<Integer> segmentationModes,
                             boolean orientationCheck,
                             boolean m_showBoundingBoxes, ImageConfiguration segmentedFingerConfiguration,
                             ImageConfiguration slapConfiguration, boolean m_livenessCheck, boolean isGetNist2Quality,
                             boolean isGetNistQuality, float captureSpeed, boolean propDenoise, boolean cleanFingerPrints,
                             ArrayList<Integer> missingFingers, String title,
                             boolean showBackButton,
                             int timeout, float detectorThreshold,
                             boolean outsideCapture) {
        Intent intent = new Intent(context, FingerCaptureActivity.class);
        intent.putExtra(PROJECT_TOKEN, projectToken);
        intent.putExtra(SHOW_BOUNDING_BOXES, m_showBoundingBoxes);
        intent.putExtra(SEGMENTED_IMAGE_CONFIG, segmentedFingerConfiguration);
        intent.putExtra(SLAP_IMAGE_CONFIG, slapConfiguration);
        intent.putExtra(LIVENESS_CHECK, m_livenessCheck);
        intent.putExtra(IS_GET_NIST2_QUALITY, isGetNist2Quality);
        intent.putExtra(IS_GET_NIST_QUALITY, isGetNistQuality);
        intent.putExtra(SEGMENTATION_MODES, segmentationModes);
        intent.putExtra(ORIENTATION_CHECK, orientationCheck);
        intent.putExtra(PAGE_TITLE, title);
        intent.putExtra(EXTRA_SHOW_BACK_BUTTON, showBackButton);
        intent.putExtra(TIME_OUT, timeout);
        intent.putExtra(DETECTOR_THRESHOLD, detectorThreshold);
        intent.putExtra(CAPTURE_SPEED, captureSpeed);
        intent.putExtra(PROP_DENOISE, propDenoise);
        intent.putExtra(CLEAN_FINGERPRINTS, cleanFingerPrints);
        intent.putIntegerArrayListExtra(MISSING_FINGERS, missingFingers);
        intent.putExtra(OUTSIDE_CAPTURE_FLAG, outsideCapture);

        context.startActivity(intent);
    }


    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.d(TAG, "FingerCaptureActivity onCreate()");

       // Thread.setDefaultUncaughtExceptionHandler(new MyExceptionHandler(this));

        Intent intent = getIntent();

        //[] m_nistQuality     = new byte[4];
        String projectToken = intent.getStringExtra(PROJECT_TOKEN);
        this.m_showBoundingBoxes = intent.getBooleanExtra(SHOW_BOUNDING_BOXES, false);
        this.segmentedFingerImageConfiguration = intent.getParcelableExtra(SEGMENTED_IMAGE_CONFIG);
        this.slapImageConfiguration = intent.getParcelableExtra(SLAP_IMAGE_CONFIG);
        this.m_livenessCheck = intent.getBooleanExtra(LIVENESS_CHECK, false);
        this.m_getNistQuality = intent.getBooleanExtra(IS_GET_NIST_QUALITY, false);
        this.m_getNist2Quality = intent.getBooleanExtra(IS_GET_NIST2_QUALITY, false);
        float detectorThreshold = intent.getFloatExtra(DETECTOR_THRESHOLD, 0.9F);
        segmentationModes = intent.getIntegerArrayListExtra(SEGMENTATION_MODES);
        m_positionCode = segmentationModes.get(posIndex);

        boolean m_orientationCheck = intent.getBooleanExtra(ORIENTATION_CHECK, true);
        this.timeout = intent.getIntExtra(TIME_OUT, 60);

        float m_captureSpeed = intent.getFloatExtra(CAPTURE_SPEED, 0.0f);
        this.m_propDenoise = intent.getBooleanExtra(PROP_DENOISE, false);
        this.m_cleanFingerPrints = intent.getBooleanExtra(CLEAN_FINGERPRINTS, false);
        this.missingFingers = intent.getIntegerArrayListExtra(MISSING_FINGERS);
        this.m_outsideCapture = intent.getBooleanExtra(OUTSIDE_CAPTURE_FLAG, false);
        if (this.missingFingers == null) {
            this.missingFingers = new ArrayList<>();
        }


        setContentView(R.layout.activity_finger_capture);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);


        int m_poolSize = 10;
        m_service = Executors.newFixedThreadPool(m_poolSize);
        this.m_transparentImageView = findViewById(R.id.iv_transparent_view);
        this.m_viewFinder = findViewById(R.id.view_finder);
        this.m_graphicOverlay = findViewById(R.id.graphic_overlay);
        this.txtStatus = findViewById(R.id.txt_status);


        this.m_logFile = createLogFile();

        ActionBar actionBar = getSupportActionBar();

        if (actionBar != null) {
            actionBar.setTitle(getResources().getString(R.string.title));

            if (getIntent().getStringExtra("PAGE_TITLE") != null) {
                actionBar.setTitle(getIntent().getStringExtra("PAGE_TITLE"));
            }

            boolean showBackButton = getIntent().getBooleanExtra(EXTRA_SHOW_BACK_BUTTON, false);

            if (showBackButton) {
                getSupportActionBar().setDisplayHomeAsUpEnabled(true);
                getSupportActionBar().setDisplayShowHomeEnabled(true);
            }
        }


        m_cellSdk = new T5AirSnap(this);


        Logger.addToLog(TAG, "Project token: " + projectToken, this.m_logFile);
        Logger.addToLog(TAG, "T5AirSnap SDK version: " + T5AirSnap.getVersion(), this.m_logFile);
        Logger.addToLog(TAG, "ID: " + T5AirSnap.getDeviceIdentifier(), this.m_logFile);

        String modelsPath = Objects.requireNonNull(getExternalFilesDir(null)).toString();
        extractModels(this, "models", modelsPath);
        String modelsDir = modelsPath + File.separator + "models";
        m_cellSdk.setModelsDir(modelsDir);


        m_cellSdk.setCacheDir(Objects.requireNonNull(getExternalCacheDir()).getAbsolutePath());
        m_cellSdk.setDeviceInfo(Build.MANUFACTURER, Build.MODEL, Build.VERSION.RELEASE);
        m_cellSdk.setSaveSdkLogFlag(false);

        int resultCode = m_cellSdk.initSdk(projectToken);
        String errorMessage = m_cellSdk.getErrorMessage();


        if (resultCode == 0 && m_getNist2Quality) {
            resultCode = m_cellSdk.initNfiq2();
            errorMessage = "init NFIQ2 failed";
        }

        if (resultCode == 0 && m_livenessCheck) {

            resultCode = m_cellSdk.initLivenessDetector();

            errorMessage = "init Liveness detector failed";

        }


        if (resultCode != 0) {

            Logger.addToLog(TAG, "SDK init failed (code: " + resultCode + "), error message: " + errorMessage, this.m_logFile);
            m_cellSdk = null;

            Logger.addToLog(TAG, "" + errorMessage, this.m_logFile);

            T5FingerCaptureController.getInstance().getFingerCapturedListener().onFailure(getResources().getString(R.string.label_init_sdk_failed, resultCode) + ": " + errorMessage);
            finish();

            return;
        }
        Logger.addToLog(TAG, "init SDK success: detectr threshold " + detectorThreshold, this.m_logFile);

        m_cellSdk.setPositionCode(this.m_positionCode);
        m_cellSdk.setLivenessCheck(this.m_livenessCheck);
        m_cellSdk.setOrientationCheck(m_orientationCheck);
        m_cellSdk.setDetectorThreshold(detectorThreshold);

        Logger.addToLog(TAG, "clean " + m_cleanFingerPrints + ", denoise " + m_propDenoise + ", capSpeed :" + m_captureSpeed, this.m_logFile);

        m_cellSdk.setSaveFramesFlag(false);
        m_cellSdk.setPropDenoiseFlag(m_propDenoise);
        m_cellSdk.setCaptureSpeed(m_captureSpeed);
        m_cellSdk.setOutsideCaptureFlag(m_outsideCapture);

        this.m_rootDirectory = getExternalFilesDir(null).getAbsolutePath() + File.separator + "T5FingerCapture";


        File dir = new File(this.m_rootDirectory);
        if (!dir.exists()) {
            dir.mkdirs();
        }


        this.m_cameraExecutorService = Executors.newFixedThreadPool(1);

        Logger.addToLog(TAG, "m_viewFinder: " + this.m_viewFinder, this.m_logFile);

        this.m_viewFinder.post(() -> {
            Logger.addToLog(TAG, "setting up camera: ", this.m_logFile);


            setUpCamera();
        });

        this.m_progressDialog = new ProgressDialog((Context) this);
        this.m_progressDialog.setMessage(getResources().getString(R.string.label_progress));


        this.captureResult = new FingerCaptureResult();
        this.airsnapUtils = new AirsnapUtils(m_cellSdk, m_service);


        initCountDownTimer();
    }


    private void initCountDownTimer() {
        this.countDownTimer = new CountDownTimer((this.timeout * 1000L), 1000L) {
            public void onTick(long millisUntilFinished) {
                Log.d("TAG", "millisUntilFinished " + millisUntilFinished);
            }


            public void onFinish() {
                try {
                    m_cameraProvider.unbindAll();
                } catch (Exception exception) {
                }

                FingerCaptureActivity.this.hideProgress();
                T5FingerCaptureController.getInstance().getFingerCapturedListener().onTimedout();
                FingerCaptureActivity.this.finish();

            }
        };


        this.countDownTimer.start();
    }


    /**
     * Initialize CameraX, and prepare to bind the camera use cases
     */
    private void setUpCamera() {
        Logger.addToLog(TAG, "setting up camera", m_logFile);
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(FingerCaptureActivity.this);
        cameraProviderFuture.addListener(() -> {

            // CameraProvider
            try {
                m_cameraProvider = cameraProviderFuture.get();
            } catch (ExecutionException | InterruptedException e) {
                Logger.addToLog(TAG, "get camera provider failed " + e.getLocalizedMessage(), m_logFile);
                Logger.logException(TAG, e, m_logFile);
            }


            // Build and bind the camera use cases
            bindCameraUseCases();

            @SuppressLint("RestrictedApi") Size size = m_imageAnalyzer.getAttachedSurfaceResolution();
            @SuppressLint("RestrictedApi") Size previewSize = m_preview.getAttachedSurfaceResolution();

            Logger.addToLog(TAG, "preview size " + previewSize, m_logFile);
            Logger.addToLog(TAG, "analyze size " + size, m_logFile);

            initBorder(size.getHeight(), size.getWidth());

        }, ContextCompat.getMainExecutor(FingerCaptureActivity.this));


    }

    /**
     * Declare and bind preview, capture and analysis use cases
     */
    @SuppressLint({"RestrictedApi", "UnsafeExperimentalUsageError", "UnsafeOptInUsageError"})
    private void bindCameraUseCases() {
        int rotation = m_viewFinder.getDisplay().getRotation();


        int m_lensFacing = CameraSelector.LENS_FACING_BACK;
        m_cameraSelector = new CameraSelector.Builder().requireLensFacing(m_lensFacing).build();
        m_preview = new Preview.Builder().setTargetResolution(new Size(1080, 1920)).setTargetRotation(rotation).build();


        ImageAnalysis.Builder imageAnalysisBuilder = new ImageAnalysis.Builder().setBackpressureStrategy(STRATEGY_KEEP_ONLY_LATEST)
                .setTargetResolution(new Size(1080, 1920)).setTargetRotation(rotation);

        Camera2Interop.Extender extender = new Camera2Interop.Extender(imageAnalysisBuilder);
        if (m_propDenoise) {

            extender.setCaptureRequestOption(CaptureRequest.NOISE_REDUCTION_MODE,
                    CaptureRequest.NOISE_REDUCTION_MODE_OFF);
        }


        extender.setSessionCaptureCallback(new CameraCaptureSession.CaptureCallback() {
            @Override
            public void onCaptureCompleted(@NonNull CameraCaptureSession session, @NonNull CaptureRequest request, @NonNull TotalCaptureResult partialResult) {
                super.onCaptureProgressed(session, request, partialResult);
                try {
                    if (DeviceChecker.isS23Device()) {
                        m_current_distance = partialResult.get(TotalCaptureResult.LENS_FOCUS_DISTANCE).floatValue();
                    }
                } catch (Exception e) {
                    m_current_distance = 0.0f;
                }
            }
        });


        m_imageAnalyzer = imageAnalysisBuilder.build();
        m_imageAnalyzer.setAnalyzer(m_cameraExecutorService, new FingerAnalyzer());

        // Must unbind the use-cases before rebinding them
        m_cameraProvider.unbindAll();

        try {
            // A variable number of use-cases can be passed here -
            // camera provides access to CameraControl & CameraInfo
            m_camera = m_cameraProvider.bindToLifecycle(this, m_cameraSelector, m_preview, m_imageAnalyzer);

            CameraManager manager = (CameraManager) getSystemService(Context.CAMERA_SERVICE);
            for (String cameraId : manager.getCameraIdList()) {
                //CameraCharacteristics characteristics
                CameraCharacteristics mCameraInfo = manager.getCameraCharacteristics(cameraId);

                // We don't use a front facing camera in this sample.
                Integer facing = mCameraInfo.get(CameraCharacteristics.LENS_FACING);
                if ((facing != null) && (facing == CameraCharacteristics.LENS_FACING_FRONT)) {
                    continue;
                }

                CameraControl cameraControl = m_camera.getCameraControl();
                CameraInfo cameraInfo = m_camera.getCameraInfo();

//                Range<Integer> exposureCompensationRange = mCameraInfo.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_RANGE);
//                int exposureCompensation = exposureCompensationRange.getLower() / 2;
//                cameraControl.setExposureCompensationIndex(exposureCompensation);

                ExposureState exposureState = cameraInfo.getExposureState();
                float exposureCompensationStep = exposureState.getExposureCompensationStep().floatValue();
                Range<Integer> exposureCompensationRange = exposureState.getExposureCompensationRange();
                int exposureCompensation = round(-1.0f / exposureCompensationStep);

                Logger.addToLog(TAG, "Exposure compensation step: " + exposureCompensationStep, m_logFile);
                Logger.addToLog(TAG, "Lower exposure compensation: " + exposureCompensationRange.getLower(), m_logFile);
                Logger.addToLog(TAG, "Target exposure compensation: " + exposureCompensation, m_logFile);

                if (exposureCompensation < exposureCompensationRange.getLower())
                    exposureCompensation = exposureCompensationRange.getLower();

                Logger.addToLog(TAG, "Final exposure compensation: " + exposureCompensation, m_logFile);

                cameraControl.setExposureCompensationIndex(exposureCompensation);


                float zoomRatio = 1.0f;


                ZoomState zoomState = cameraInfo.getZoomState().getValue();

                if (zoomState != null) {
                    zoomRatio = zoomState.getMaxZoomRatio();

                    Logger.addToLog(TAG, "maxZoomRatio " + zoomRatio, m_logFile);
                    // ph2
                    float targetZoomRatio = 2.0f;

                    if (zoomRatio > targetZoomRatio) zoomRatio = targetZoomRatio;
                    else if (zoomRatio < 1.0f) zoomRatio = 1.0f;
                }

                Logger.addToLog(TAG, "setZoomRatio " + zoomRatio, m_logFile);

                setZoom(zoomRatio);

                SizeF sensorSize = mCameraInfo.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE);  //SENSOR_INFO_PHYSICAL_SIZE
                Size sensor = mCameraInfo.get(CameraCharacteristics.SENSOR_INFO_PIXEL_ARRAY_SIZE);

                Logger.addToLog(TAG, "Sensor size: " + sensorSize + " for camera " + cameraId + ", Pixel size " + sensor, m_logFile);

                // Since sensor size doesn't actually match capture size and because it is
                // reporting an extremely wide aspect ratio, this FoV is bogus
                float[] focalLengths = mCameraInfo.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS);

                if (sensorSize != null && focalLengths != null && focalLengths.length > 0) {
                    float focalLength = focalLengths[0];
                    double fov = 2 * Math.atan(sensorSize.getWidth() / (2 * focalLength));
                    Logger.addToLog(TAG, "Calculated FoV: " + fov + " focalLength " + focalLength, m_logFile);
                }

                if (sensorSize != null && focalLengths != null && focalLengths.length > 0) {
                    m_cellSdk.initCameraParameters(sensorSize.getWidth(), sensorSize.getHeight(), focalLengths[0], zoomRatio);
                }
                break;
            }

            // Attach the viewfinder's surface provider to preview use case
            m_preview.setSurfaceProvider(m_viewFinder.getSurfaceProvider());

            autoFocus();
            toggleFlash(true);

        } catch (Exception exc) {
            Logger.addToLog(TAG, "Use case binding failed" + exc.getLocalizedMessage(), m_logFile);
            Logger.logException(TAG, exc, m_logFile);
        }
    }


    private String getCaptureObjectName(int numRects) {
        return CaptureObjectNameUtil.getCaptureObjectName(m_positionCode, numRects, getResources());
    }


    private void updateStatus(int captureStatus, int numRects, ArrayList<SgmRectImage> rects) {
        int color;
        //statusTextBackgroundColor;
        //  Drawable statusStripIcon;
        Logger.addToLog(TAG, getCaptureObjectName(rects.size()) + ": captureStatus: " + captureStatus, this.m_logFile);


        if (captureStatus == CaptureStatus.frameSkipped) {
            return;
        }


        if (captureStatus == CaptureStatus.tooFewFingers) {

            Logger.addToLog(TAG, "Too few fingers detected", this.m_logFile);
            Log.d(TAG, "analyze captureStatus :Too few fingers detected " + rects.size());

            setStatus(getResources().getString(R.string.label_frame_hand, getCaptureObjectName(numRects)));

        } else if (captureStatus == CaptureStatus.tooManyFingers) {
            Logger.addToLog(TAG, "Too many fingers detected", this.m_logFile);

            Log.d(TAG, "analyze captureStatus :Too many fingers detected " + rects.size());


            int expectedFingerCount =
                    ((m_positionCode == NistPosCode.POS_CODE_PL_R_4F) ||
                            (m_positionCode == NistPosCode.POS_CODE_PL_L_4F)) ? rects.size() :
                            ((m_positionCode == NistPosCode.POS_CODE_L_AND_R_THUMBS) ||
                                    (m_positionCode == NistPosCode.POS_CODE_R_RING_LITTLE) ||
                                    (m_positionCode == NistPosCode.POS_CODE_L_RING_LITTLE) ||
                                    (m_positionCode == NistPosCode.POS_CODE_R_INDEX_MIDDLE) ||
                                    (m_positionCode == NistPosCode.POS_CODE_L_INDEX_MIDDLE)) ? 2 : 1;


            if (expectedFingerCount == 1) {
                setStatus(getResources().getString(R.string.label_more_than_one_finger_detected));
            } else {
                setStatus(getResources().getString(R.string.label_more_than_n_fingers_detected, expectedFingerCount));
            }

        } else if (captureStatus == CaptureStatus.wrongAngle) {

            String wrongAngleStatus = ((m_positionCode == POS_CODE_L_AND_R_THUMBS)
                    || (m_positionCode == POS_CODE_R_THUMB)
                    || (m_positionCode == POS_CODE_L_THUMB)
                    || (m_positionCode == POS_CODE_R_INDEX_F)
                    || (m_positionCode == POS_CODE_L_INDEX_F)
                    || (m_positionCode == POS_CODE_R_MIDDLE_F)
                    || (m_positionCode == POS_CODE_L_MIDDLE_F)
                    || (m_positionCode == POS_CODE_R_RING_F)
                    || (m_positionCode == POS_CODE_L_RING_F)
                    || (m_positionCode == POS_CODE_R_LITTLE_F)
                    || (m_positionCode == POS_CODE_L_LITTLE_F)) ? (getResources().getString(R.string.hold_vertically, getCaptureObjectName(numRects))) : (getResources().getString(R.string.hold_horizontally, getCaptureObjectName(numRects)));

            setStatus(wrongAngleStatus);

        } else if (captureStatus == CaptureStatus.tooFar) {
            setStatus(getResources().getString(R.string.label_too_far));
        } else if (captureStatus == CaptureStatus.tooClose) {
            setStatus(getResources().getString(R.string.label_too_close));
        } else if (captureStatus == CaptureStatus.lowFocus) {

            setStatus(getResources().getString(R.string.label_low_focus));
        } else if (captureStatus == CaptureStatus.goodFocus) {

            setStatus(getResources().getString(R.string.label_good_focus));
        } else if (captureStatus == bestFrameChosen) {
            setStatus("");
        }

        color = ((captureStatus == CaptureStatus.tooFewFingers) || (captureStatus == CaptureStatus.tooManyFingers) || (captureStatus == CaptureStatus.wrongHand)) ? getResources().getColor(R.color.border_color_error) : ((captureStatus == CaptureStatus.wrongAngle) || (captureStatus == CaptureStatus.tooFar) || (captureStatus == CaptureStatus.tooClose) || (captureStatus == CaptureStatus.lowFocus)) ? getResources().getColor(R.color.border_color_info) : getResources().getColor(R.color.border_color_pass);

        int finalColor = color;

        if (!this.m_showBoundingBoxes) {
            rects.clear();
        }

        runOnUiThread(() -> {

            this.m_graphicOverlay.drawBorderAndBoundBoxes(finalColor, rects);
            Logger.addToLog(TAG, "setting status end", this.m_logFile);
        });
    }

    private void saveFingerprints(List<SgmRectImage> rects) {
        if (rects == null || rects.isEmpty()) {
            return;
        }


        ArrayList<Finger> capturedFingers = new ArrayList<>();

        Log.d(TAG, "is get nist quality " + this.m_getNistQuality);

        if (this.m_getNistQuality) {
            nistQualitiesMap = airsnapUtils.createTemplates(rects);
        }


        if (this.m_getNist2Quality) {
            nist2QualitiesMap = airsnapUtils.getNist2QualityValues(rects);
        }


        long startTime = System.currentTimeMillis();

        for (int i = 0; i < rects.size(); i++) {

            SgmRectImage rect = rects.get(i);


            Finger finger = new Finger();
            finger.pos = rect.pos;

            finger.primaryImageType = this.segmentedFingerImageConfiguration.getPrimaryImageType();

            if (segmentedFingerImageConfiguration.isCropImage()) {
                finger.primaryImage = airsnapUtils.convertImage(rect.image, rect.width, rect.height, this.segmentedFingerImageConfiguration.getPrimaryImageType(), true, this.segmentedFingerImageConfiguration.getCroppedImageWidth(), this.segmentedFingerImageConfiguration.getCroppedImageHeight(), this.segmentedFingerImageConfiguration.getCompressionRatio(), this.segmentedFingerImageConfiguration.getPaddingColor());

            } else {
                finger.primaryImage = airsnapUtils.convertImage(rect.image, rect.width, rect.height, this.segmentedFingerImageConfiguration.getPrimaryImageType(), false, 0, 0, this.segmentedFingerImageConfiguration.getCompressionRatio(), this.segmentedFingerImageConfiguration.getPaddingColor());
            }


            if (segmentedFingerImageConfiguration.isRequireDisplayImage()) {

                finger.displayImageType = segmentedFingerImageConfiguration.getDisplayImageType();

                if (segmentedFingerImageConfiguration.isCropImage()) {
                    finger.displayImage = airsnapUtils.convertImage(rect.image, rect.width, rect.height, this.segmentedFingerImageConfiguration.getDisplayImageType(), true, this.segmentedFingerImageConfiguration.getCroppedImageWidth(), this.segmentedFingerImageConfiguration.getCroppedImageHeight(), this.segmentedFingerImageConfiguration.getCompressionRatio(), this.segmentedFingerImageConfiguration.getPaddingColor());

                } else {
                    finger.displayImage = airsnapUtils.convertImage(rect.image, rect.width, rect.height, this.segmentedFingerImageConfiguration.getDisplayImageType(), false, 0, 0, this.segmentedFingerImageConfiguration.getCompressionRatio(), this.segmentedFingerImageConfiguration.getPaddingColor());
                }

            }

            try {


                if (this.m_getNistQuality) {
                    Quality quality = nistQualitiesMap.get(rect.pos);
                    if (quality != null) {
                        finger.nistQuality = quality.nistQuality;
                        finger.quality = quality.quality;
                        finger.minutiaesNumber = quality.minutiaesNumber;

                    }
                }

                if (this.m_getNist2Quality) {
                    Byte nist2Quality = nist2QualitiesMap.get(rect.pos);
                    finger.nist2Quality = nist2Quality == null ? 0 : nist2Quality;
                }


            } catch (Exception exception) {
            }


            capturedFingers.add(finger);


        }

        this.captureResult.fingers = capturedFingers;


        ArrayList<Slap> slapArrayList = new ArrayList<>();

        for (RawSlap rawSlap : slaps) {

            Slap slap = new Slap();
            slap.pos = rawSlap.pos;
            slap.imageType = slapImageConfiguration.getPrimaryImageType();

            if (slapImageConfiguration.isCropImage()) {
                slap.image = airsnapUtils.convertImage(rawSlap.rawData, rawSlap.imageWidth, rawSlap.imageHeight, this.slapImageConfiguration.getPrimaryImageType(), true, this.slapImageConfiguration.getCroppedImageWidth(), this.slapImageConfiguration.getCroppedImageHeight(), this.slapImageConfiguration.getCompressionRatio(), this.slapImageConfiguration.getPaddingColor());
            } else {
                slap.image = airsnapUtils.convertImage(rawSlap.rawData, rawSlap.imageWidth, rawSlap.imageHeight, this.slapImageConfiguration.getPrimaryImageType(), false, 0, 0, this.slapImageConfiguration.getCompressionRatio(), this.slapImageConfiguration.getPaddingColor());

            }

            slapArrayList.add(slap);

        }

        this.captureResult.slapImages = slapArrayList;
        this.captureResult.livenessScores = livenessScoresList;


        Log.d("TAG", "time taken save finger prints convetion " + (System.currentTimeMillis() - startTime));

    }


    public void setZoom(float zoomRatio)
    {
        m_setZoomTime = System.currentTimeMillis();
        Logger.addToLog(TAG, "setZoom: " + zoomRatio, m_logFile);
        m_zoomApplied.set(false);
        m_camera.getCameraControl().setZoomRatio(zoomRatio).addListener(
                () -> m_zoomApplied.set(true),
                ContextCompat.getMainExecutor(this));
    }

    @SuppressLint({"UnsafeExperimentalUsageError", "UnsafeOptInUsageError"})
    private void analyzeImage(ImageProxy imageProxy) {
        try {

            long timeDeltaThreshold = 500;
            long timeDelta          = System.currentTimeMillis() - m_setZoomTime;

            if (!m_zoomApplied.get() && (timeDelta < timeDeltaThreshold))
            {
                Logger.addToLog(TAG, "!m_zoomApplied", m_logFile);
                imageProxy.close();
                return;
            }

            Logger.addToLog(TAG, "-------------------------------------------------------", this.m_logFile);
            Logger.addToLog(TAG, "Analyzing preview image  width: " + imageProxy.getWidth() + " height: " + imageProxy.getHeight() + " rotation: " + imageProxy.getImageInfo().getRotationDegrees(), this.m_logFile);
            long currentTime = System.currentTimeMillis();

            int rotationDegrees = imageProxy.getImageInfo().getRotationDegrees();


            Image previewImage = imageProxy.getImage();


            ArrayList<SgmRectImage> rects = new ArrayList<>();

            if ((m_positionCode == NistPosCode.POS_CODE_PL_R_4F) || (m_positionCode == NistPosCode.POS_CODE_PL_L_4F)) {

                SgmRectImage indexFinger = new SgmRectImage();
                indexFinger.pos = (m_positionCode == NistPosCode.POS_CODE_PL_R_4F) ? POS_CODE_R_INDEX_F : NistPosCode.POS_CODE_L_INDEX_F;
                if (!missingFingers.contains(indexFinger.pos)) {
                    rects.add(indexFinger);
                }


                SgmRectImage middleFinger = new SgmRectImage();
                middleFinger.pos = (m_positionCode == NistPosCode.POS_CODE_PL_R_4F) ? NistPosCode.POS_CODE_R_MIDDLE_F : POS_CODE_L_MIDDLE_F;
                if (!missingFingers.contains(middleFinger.pos)) {
                    rects.add(middleFinger);
                }


                SgmRectImage ringFinger = new SgmRectImage();
                ringFinger.pos = (m_positionCode == NistPosCode.POS_CODE_PL_R_4F) ? POS_CODE_R_RING_F : POS_CODE_L_RING_F;
                if (!missingFingers.contains(ringFinger.pos)) {
                    rects.add(ringFinger);
                }

                SgmRectImage littleFinger = new SgmRectImage();
                littleFinger.pos = (m_positionCode == NistPosCode.POS_CODE_PL_R_4F) ? POS_CODE_R_LITTLE_F : POS_CODE_L_LITTLE_F;

                if (!missingFingers.contains(littleFinger.pos)) {
                    rects.add(littleFinger);
                }
            }

            int numRects = rects.size();
            Log.d(TAG, "analyze captureStatus :  num rects: " + rects.size());


            int captureStatus = m_cellSdk.analyzeImage(previewImage, rotationDegrees, rects, m_current_distance);

            Log.d(TAG, "analyze captureStatus : " + captureStatus + " time taken for analyze : " + (System.currentTimeMillis() - currentTime) + " num rects: " + rects.size());


            if (captureStatus == CaptureStatus.turnOnFlashlight) {
                toggleFlash(true);
            } else if (captureStatus == CaptureStatus.turnOffFlashlight) {
                toggleFlash(false);
            }
            if (captureStatus == CaptureStatus.set1xZoom) {

                setZoom(1.0f);

                runOnUiThread(() -> {
                    m_viewFinder.setVisibility(View.INVISIBLE);
                    m_transparentImageView.setImageBitmap(null);
                    m_transparentImageView.setVisibility(View.INVISIBLE);
                    m_graphicOverlay.drawBorderAndBoundBoxes(Color.GRAY, new ArrayList<>());
                    m_graphicOverlay.setVisibility(View.INVISIBLE);

                    m_preview.setSurfaceProvider(null);
                    m_viewFinder.getOverlay().clear();

                    setStatus("");


                });


            } else if (captureStatus != CaptureStatus.bestFrameChosen) {
                updateStatus(captureStatus, numRects, rects);

            }


            Log.d(TAG, "analyze captureStatus :-------------------------- ");

            if (captureStatus == bestFrameChosen) {


                runOnUiThread(() -> {

                    this.m_cameraProvider.unbindAll();

                    m_viewFinder.setVisibility(View.INVISIBLE);
                    m_transparentImageView.setImageBitmap(null);
                    m_transparentImageView.setVisibility(View.INVISIBLE);
                    m_graphicOverlay.drawBorderAndBoundBoxes(Color.GRAY, new ArrayList<>());
                    m_graphicOverlay.setVisibility(View.INVISIBLE);

                    m_preview.setSurfaceProvider(null);
                    m_viewFinder.getOverlay().clear();


                    this.m_progressDialog.show();
                });


                setStatus("");

                int previewWidth = previewImage.getWidth();
                int previewHeight = previewImage.getHeight();

                byte[] previewImageBuffer = new byte[previewWidth * previewHeight];

                ArrayList<SgmRectImage> segmentedRects = new ArrayList<>();
                float[] livenessScores = new float[4];
                for (int i = 0; i < 4; i++)
                    livenessScores[i] = 0.0f;


                int result = m_cellSdk.getSegmentedFingers(previewImageBuffer, 0, 0,
                        m_cleanFingerPrints, segmentedRects, livenessScores);

                Logger.addToLog(TAG, "Segmentation result: " + result + " liveness scores " + Arrays.toString(livenessScores), this.m_logFile);


                if (m_livenessCheck) {

                    livenessScoresList.add(new LivenessScore(m_positionCode, livenessScores[0]));
                }

                if (!segmentedRects.isEmpty()) {

                    for (SgmRectImage rectImage : segmentedRects) {

                        this.segmentedRects.put(rectImage.pos, rectImage);

                    }
                }


                RawSlap rawSlap = new RawSlap();
                rawSlap.imageHeight = previewHeight;
                rawSlap.imageWidth = previewWidth;
                rawSlap.rawData = previewImageBuffer;
                rawSlap.pos = m_positionCode;

                slaps.add(rawSlap);


                if (posIndex >= segmentationModes.size() - 1) {

                    if (countDownTimer != null) {
                        countDownTimer.cancel();
                    }

                    List<SgmRectImage> rectImages = new ArrayList<>(this.segmentedRects.values());

                    long startTime = System.currentTimeMillis();
                    saveFingerprints(rectImages);

                    Log.d("TAG", "time taken save finger prints " + (System.currentTimeMillis() - startTime));


                    runOnUiThread(() -> {
                        T5FingerCaptureController.getInstance().getFingerCapturedListener().onSuccess(this.captureResult);
                        finish();
                    });

                } else {

                    posIndex++;

                    m_positionCode = segmentationModes.get(posIndex);
                    m_cellSdk.setPositionCode(m_positionCode);
                    runOnUiThread(() -> {


                        m_viewFinder.setVisibility(View.VISIBLE);
                        m_transparentImageView.setVisibility(View.VISIBLE);
                        m_graphicOverlay.setVisibility(View.VISIBLE);

                        setStatus("");


                        FingerCaptureActivity.this.bindCameraUseCases();
                        @SuppressLint("RestrictedApi") Size size = m_imageAnalyzer.getAttachedSurfaceResolution();
                        if (size == null) {
                            return;
                        }
                        initBorder(size.getHeight(), size.getWidth());
                    });


                }


                hideProgress();

            }

        } catch (Exception e) {
            Logger.logException(TAG, e, this.m_logFile);
        } finally {
            imageProxy.close();
        }
    }


    private void initBorder(int width, int height) {
        try {
            Bitmap bitmap = Bitmap.createBitmap(m_transparentImageView.getWidth(), m_transparentImageView.getHeight(),
                    Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

            paint.setStyle(Paint.Style.FILL);
            canvas.drawColor(getResources().getColor(R.color.airsnapfinger_overlay_color));
            paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));

            m_cellSdk.initBorder(width, height, m_graphicOverlay.getWidth(), m_graphicOverlay.getHeight());

            Integer borderRectLeft = new Integer(0);
            Integer borderRectTop = new Integer(0);
            Integer borderRectRight = new Integer(0);
            Integer borderRectBottom = new Integer(0);

            m_cellSdk.getBorderRectangle(borderRectLeft, borderRectTop, borderRectRight, borderRectBottom);

            Rect borderRect = new Rect(borderRectLeft, borderRectTop, borderRectRight, borderRectBottom);

            m_graphicOverlay.init(borderRect);

            Logger.addToLog(TAG, "Drawing rect with " + " left: " + borderRectLeft + " top: " + borderRectTop + " right: " + borderRectRight + " bottom: " + borderRectBottom, m_logFile);

            Logger.addToLog(TAG, "width: " + width + " height: " + height, m_logFile);

            canvas.drawRect(borderRect, paint);

            m_transparentImageView.setImageBitmap(bitmap);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private File createLogFile() {
        return new File(getExternalCacheDir(), "airsnap_log.txt");
    }

    private void autoFocus() {
        try {
            SurfaceOrientedMeteringPointFactory surfaceOrientedMeteringPointFactory = new SurfaceOrientedMeteringPointFactory(this.m_viewFinder.getWidth(), this.m_viewFinder.getHeight());

            int centerWidth = this.m_viewFinder.getWidth() / 2;
            int centreHeight = this.m_viewFinder.getHeight() / 2;

            MeteringPoint autoFocusPoint = surfaceOrientedMeteringPointFactory.createPoint(centerWidth, centreHeight);

            FocusMeteringAction.Builder builder = new FocusMeteringAction.Builder(autoFocusPoint, FocusMeteringAction.FLAG_AE);


            builder.setAutoCancelDuration(1L, TimeUnit.SECONDS);
            this.m_camera.getCameraControl().startFocusAndMetering(builder.build());
        } catch (Exception e) {

            Logger.addToLog(TAG, "auto focus failed " + e.getLocalizedMessage(), this.m_logFile);
            Logger.logException(TAG, e, this.m_logFile);
        }
    }

    void toggleFlash(boolean enable) {
        if (this.m_camera != null) {

            CameraInfo cameraInfo = this.m_camera.getCameraInfo();
            if (this.m_camera.getCameraInfo().hasFlashUnit() && cameraInfo.getTorchState().getValue() != null) {
                int torchState = ((Integer) cameraInfo.getTorchState().getValue()).intValue();
                this.m_camera.getCameraControl().enableTorch(enable);
            }
        }
    }


    private void setStatus(String msg) {
        runOnUiThread(() -> {
            if (msg != null && !msg.isEmpty()) {
                this.txtStatus.setText(msg);
            } else {
                this.txtStatus.setText("");
            }
        });
    }


    @Override
    public boolean onOptionsItemSelected(MenuItem item) {

        switch (item.getItemId()) {
            case android.R.id.home:
                // app icon in action bar clicked; go home
                onBackPressed();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    protected void onResume() {


        super.onResume();
        toggleFlash(false);
    }

    protected void onPause() {
        super.onPause();
        toggleFlash(false);
    }

    @Override
    protected void onStop() {
        super.onStop();
        toggleFlash(false);
    }

    public void onBackPressed() {
        super.onBackPressed();
        T5FingerCaptureController.getInstance().getFingerCapturedListener().onCancelled();
    }

    protected void onDestroy() {


        super.onDestroy();

        hideProgress();

        toggleFlash(false);

        if (this.m_cameraExecutorService != null) {
            this.m_cameraExecutorService.shutdown();
        }

        if (m_service != null) {
            m_service.shutdown();
        }


        if (this.countDownTimer != null) {
            this.countDownTimer.cancel();
        }

        if (m_cellSdk != null) {
            m_cellSdk.closeSdk();
            m_cellSdk = null;
        }
    }

    private void hideProgress() {


        runOnUiThread(() -> {
            if (this.m_progressDialog != null && this.m_progressDialog.isShowing())
                this.m_progressDialog.dismiss();
        });
    }

    class FingerAnalyzer implements ImageAnalysis.Analyzer {

        @Nullable
        @Override
        public Size getDefaultTargetResolution() {
            return new Size(1080, 1920);
        }

        @SuppressLint({"UnsafeExperimentalUsageError"})
        public void analyze(@NonNull ImageProxy imageProxy) {
            FingerCaptureActivity.this.analyzeImage(imageProxy);
        }
    }


}
