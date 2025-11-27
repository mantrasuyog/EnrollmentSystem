import {NativeModules, Platform} from 'react-native';

const {Tech5FaceModule} = NativeModules;

// Type definitions
export type GlassDetection = 'SUN_GLASSES' | 'ANY_GLASSES';
export type CompressBy = 'COMPRESSION_RATE' | 'TARGET_SIZE';
export type ImageType = 'JPG' | 'BMP';

export interface FaceThresholds {
  pitchThreshold?: number; // Default: 15 degrees
  yawThreshold?: number; // Default: 15 degrees
  rollThreshold?: number; // Default: 10 degrees
  maskThreshold?: number; // Default: 0.5
  anyGlassThreshold?: number; // Default: 0.5
  sunGlassThreshold?: number; // Default: 0.5
  brisqueThreshold?: number; // Default: 60
  livenessThreshold?: number; // Default: 0.5
  eyeCloseThreshold?: number; // Default: 0.8
}

export interface CompressionConfig {
  compressBy?: CompressBy;
  compressionRate?: number; // 0-100 quality
  targetSizeInKbs?: number;
}

export interface FullFrontalCropConfig {
  portalWidth?: number; // Default: 1200 pixels
  imageType?: ImageType;
  compression?: number; // 0.0 to 1.0
  getSegmentedImage?: boolean;
  segmentedImageBackgroundColor?: [number, number, number]; // RGB array
}

export interface CaptureConfig {
  license?: string;
  useBackCamera?: boolean;
  autoCapture?: boolean;
  occlusionEnabled?: boolean;
  eyeClosedEnabled?: boolean;
  livenessEnabled?: boolean;
  glassDetection?: GlassDetection;
  timeoutInSecs?: number;
  compression?: boolean;
  isISOEnabled?: boolean;
  enableCameraSwitching?: boolean;
  fastCapture?: boolean;
  messagesFrequency?: number;
  fontSize?: number;
  thresholds?: FaceThresholds;
  compressionConfig?: CompressionConfig;
  fullFrontalCropConfig?: FullFrontalCropConfig;
}

export interface FaceData {
  // Pose angles
  pan: number;
  pitch: number;
  roll: number;

  // Eye distance
  eyeDistance: number;

  // Gaze
  horizontalGaze: number;
  verticalGaze: number;

  // Quality scores
  blurScore: number;
  exposureScore: number;
  brightnessScore: number;
  skinToneScore: number;
  hotspotScore: number;
  redEyesScore: number;

  // Expression scores
  mouthOpenScore: number;
  laughScore: number;

  // Background scores
  uniformBackgroundScore: number;
  uniformBackgroundColorScore: number;
  uniformIlluminationScore: number;
  faceBackDiffScore: number;

  // Occlusion scores
  maskScore: number;
  anyGlassScore: number;
  sunGlassScore: number;
  headphonesScore: number;
  hatScore: number;
  handOcclusion: number;

  // Eye closure
  leftEyeCloseScore: number;
  rightEyeCloseScore: number;

  // Portal image
  hasPortalImage: boolean;
  portalImageBase64?: string;
}

export interface CaptureResult {
  success: boolean;
  timedOut?: boolean;
  imageBase64?: string;
  originalImageBase64?: string;
  faceData?: FaceData;
}

class Tech5FaceService {
  /**
   * Capture face using the Tech5 Face SDK
   * @param config - Configuration options for face capture
   * @returns Promise with capture result containing face image and quality metrics
   */
  async captureFace(config: CaptureConfig = {}): Promise<CaptureResult> {
    if (Platform.OS !== 'android') {
      throw new Error('Tech5 Face SDK is only available on Android');
    }

    const defaultConfig: CaptureConfig = {
      license: '',
      useBackCamera: false,
      autoCapture: true,
      occlusionEnabled: true,
      eyeClosedEnabled: true,
      livenessEnabled: false,
      glassDetection: 'SUN_GLASSES',
      timeoutInSecs: 60,
      compression: false,
      isISOEnabled: false,
      enableCameraSwitching: false,
      fastCapture: false,
      messagesFrequency: 3,
      fontSize: 16,
      thresholds: {
        pitchThreshold: 15,
        yawThreshold: 15,
        rollThreshold: 10,
        maskThreshold: 0.5,
        anyGlassThreshold: 0.5,
        sunGlassThreshold: 0.5,
        brisqueThreshold: 60,
        livenessThreshold: 0.5,
        eyeCloseThreshold: 0.8,
      },
    };

    const mergedConfig = {
      ...defaultConfig,
      ...config,
      thresholds: {
        ...defaultConfig.thresholds,
        ...config.thresholds,
      },
    };

    return await Tech5FaceModule.captureFace(mergedConfig);
  }

  /**
   * Capture face with ISO/ICAO compliance checks
   */
  async captureFaceWithICAO(
    config: Partial<CaptureConfig> = {},
  ): Promise<CaptureResult> {
    return this.captureFace({
      ...config,
      isISOEnabled: true,
      occlusionEnabled: true,
      eyeClosedEnabled: true,
    });
  }

  /**
   * Capture face with liveness detection
   */
  async captureFaceWithLiveness(
    config: Partial<CaptureConfig> = {},
  ): Promise<CaptureResult> {
    return this.captureFace({
      ...config,
      livenessEnabled: true,
    });
  }

  /**
   * Capture face with portal/cropped image
   */
  async captureFaceWithPortal(
    config: Partial<CaptureConfig> = {},
  ): Promise<CaptureResult> {
    return this.captureFace({
      ...config,
      fullFrontalCropConfig: {
        portalWidth: 1200,
        imageType: 'JPG',
        compression: 0.8,
        getSegmentedImage: true,
        segmentedImageBackgroundColor: [255, 255, 255], // White background
        ...config.fullFrontalCropConfig,
      },
    });
  }

  /**
   * Quick capture with minimal checks (for fast enrollment)
   */
  async quickCapture(
    config: Partial<CaptureConfig> = {},
  ): Promise<CaptureResult> {
    return this.captureFace({
      ...config,
      fastCapture: true,
      occlusionEnabled: false,
      eyeClosedEnabled: false,
      isISOEnabled: false,
      timeoutInSecs: 30,
    });
  }

  /**
   * Initialize the SDK with license
   */
  async initSDK(license: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new Error('Tech5 Face SDK is only available on Android');
    }
    return await Tech5FaceModule.initSDK(license);
  }

  /**
   * Get device identifier for licensing
   */
  async getDeviceIdentifier(): Promise<string> {
    if (Platform.OS !== 'android') {
      throw new Error('Tech5 Face SDK is only available on Android');
    }
    return await Tech5FaceModule.getDeviceIdentifier();
  }

  /**
   * Deregister the device from Tech5 license server
   */
  async deregisterDevice(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new Error('Tech5 Face SDK is only available on Android');
    }
    return await Tech5FaceModule.deregisterDevice();
  }

  /**
   * Check if camera permission is granted
   */
  async checkCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    return await Tech5FaceModule.checkCameraPermission();
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    return await Tech5FaceModule.requestCameraPermission();
  }

  /**
   * Convert base64 image to data URI for display
   */
  toImageUri(base64: string, imageType: 'jpg' | 'png' = 'jpg'): string {
    const mimeType = imageType === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Check if face quality passes ICAO standards
   */
  isICAOCompliant(faceData: FaceData): {compliant: boolean; issues: string[]} {
    const issues: string[] = [];

    // Pose checks
    if (Math.abs(faceData.pitch) > 15) {
      issues.push('Head tilted too far up/down');
    }
    if (Math.abs(faceData.pan) > 15) {
      issues.push('Head turned too far left/right');
    }
    if (Math.abs(faceData.roll) > 10) {
      issues.push('Head tilted sideways');
    }

    // Occlusion checks
    if (faceData.maskScore > 0.5) {
      issues.push('Face mask detected');
    }
    if (faceData.sunGlassScore > 0.5) {
      issues.push('Sunglasses detected');
    }
    if (faceData.hatScore > 0.4) {
      issues.push('Hat detected');
    }

    // Eye checks
    if (faceData.leftEyeCloseScore > 0.8 || faceData.rightEyeCloseScore > 0.8) {
      issues.push('Eyes appear closed');
    }

    // Quality checks
    if (faceData.blurScore > 0.5) {
      issues.push('Image is blurry');
    }
    if (faceData.exposureScore < 0.2 || faceData.exposureScore > 0.7) {
      issues.push('Exposure issues');
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }
}

export const Tech5Face = new Tech5FaceService();
export default Tech5Face;
