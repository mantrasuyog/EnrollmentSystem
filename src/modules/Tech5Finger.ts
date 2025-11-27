import {NativeModules, Platform} from 'react-native';

const {Tech5FingerModule} = NativeModules;

// Type definitions
export type SegmentationMode =
  | 'LEFT_SLAP'
  | 'RIGHT_SLAP'
  | 'LEFT_THUMB'
  | 'RIGHT_THUMB'
  | 'LEFT_AND_RIGHT_THUMBS'
  | 'LEFT_INDEX'
  | 'LEFT_MIDDLE'
  | 'LEFT_RING'
  | 'LEFT_LITTLE'
  | 'RIGHT_INDEX'
  | 'RIGHT_MIDDLE'
  | 'RIGHT_RING'
  | 'RIGHT_LITTLE'
  | 'RIGHT_INDEX_MIDDLE'
  | 'LEFT_INDEX_MIDDLE'
  | 'RIGHT_RING_LITTLE'
  | 'LEFT_RING_LITTLE';

export type CaptureSpeed = 'low' | 'normal' | 'high';
export type CaptureMode = 'self' | 'operator';
export type ImageType = 'PNG' | 'BMP' | 'WSQ';

export interface ImageConfiguration {
  imageType?: ImageType;
  cropImage?: boolean;
  croppedImageWidth?: number;
  croppedImageHeight?: number;
  compressionRatio?: number;
  paddingColor?: number;
}

export interface CaptureConfig {
  license?: string;
  livenessCheck?: boolean;
  getQuality?: boolean;
  getNfiq2Quality?: boolean;
  detectorThreshold?: number;
  segmentationModes?: SegmentationMode[];
  captureMode?: CaptureMode;
  title?: string;
  showBackButton?: boolean;
  missingFingers?: number[];
  captureSpeed?: CaptureSpeed;
  propDenoise?: boolean;
  cleanFingerPrints?: boolean;
  outsideCapture?: boolean;
  segmentedImageConfig?: ImageConfiguration;
  slapImageConfig?: ImageConfiguration;
  timeoutInSecs?: number;
  showEllipses?: boolean;
}

export interface FingerData {
  position: number;
  nistQuality: number;
  nist2Quality: number;
  quality: number;
  minutiaesNumber: number;
  primaryImageType: ImageType;
  primaryImageBase64: string;
  displayImageBase64?: string;
  displayImageType?: ImageType;
}

export interface SlapImage {
  position: number;
  imageType: ImageType;
  imageBase64: string;
}

export interface LivenessScore {
  positionCode: number;
  score: number;
}

export interface CaptureResult {
  success: boolean;
  fingers?: FingerData[];
  slapImages?: SlapImage[];
  livenessScores?: LivenessScore[];
}

// Finger position constants (NIST codes)
export const FingerPosition = {
  UNKNOWN: 0,
  RIGHT_THUMB: 1,
  RIGHT_INDEX: 2,
  RIGHT_MIDDLE: 3,
  RIGHT_RING: 4,
  RIGHT_LITTLE: 5,
  LEFT_THUMB: 6,
  LEFT_INDEX: 7,
  LEFT_MIDDLE: 8,
  LEFT_RING: 9,
  LEFT_LITTLE: 10,
  RIGHT_FOUR_FINGERS: 13,
  LEFT_FOUR_FINGERS: 14,
  BOTH_THUMBS: 15,
} as const;

export const FingerPositionNames: Record<number, string> = {
  0: 'Unknown',
  1: 'Right Thumb',
  2: 'Right Index',
  3: 'Right Middle',
  4: 'Right Ring',
  5: 'Right Little',
  6: 'Left Thumb',
  7: 'Left Index',
  8: 'Left Middle',
  9: 'Left Ring',
  10: 'Left Little',
  13: 'Right Four Fingers',
  14: 'Left Four Fingers',
  15: 'Both Thumbs',
};

class Tech5FingerService {
  /**
   * Capture fingerprints using the Tech5 SDK
   * @param config - Configuration options for finger capture
   * @returns Promise with capture result containing finger images and quality scores
   */
  async captureFingers(config: CaptureConfig = {}): Promise<CaptureResult> {
    if (Platform.OS !== 'android') {
      throw new Error('Tech5 Finger SDK is only available on Android');
    }

    const defaultConfig: CaptureConfig = {
      license: '',
      livenessCheck: false,
      getQuality: true,
      getNfiq2Quality: false,
      detectorThreshold: 0.9,
      segmentationModes: ['LEFT_SLAP', 'RIGHT_SLAP', 'LEFT_THUMB', 'RIGHT_THUMB'],
      captureMode: 'self',
      title: 'Finger Capture',
      showBackButton: false,
      missingFingers: [],
      captureSpeed: 'normal',
      propDenoise: false,
      cleanFingerPrints: false,
      outsideCapture: false,
      segmentedImageConfig: {
        imageType: 'PNG',
        cropImage: false,
      },
      slapImageConfig: {
        imageType: 'BMP',
        cropImage: false,
      },
      timeoutInSecs: 60,
      showEllipses: true,
    };

    const mergedConfig = {...defaultConfig, ...config};
    return await Tech5FingerModule.captureFingers(mergedConfig);
  }

  /**
   * Capture only left hand fingers (4 fingers slap + thumb)
   */
  async captureLeftHand(config: Partial<CaptureConfig> = {}): Promise<CaptureResult> {
    return this.captureFingers({
      ...config,
      segmentationModes: ['LEFT_SLAP', 'LEFT_THUMB'],
      title: config.title || 'Left Hand Capture',
    });
  }

  /**
   * Capture only right hand fingers (4 fingers slap + thumb)
   */
  async captureRightHand(config: Partial<CaptureConfig> = {}): Promise<CaptureResult> {
    return this.captureFingers({
      ...config,
      segmentationModes: ['RIGHT_SLAP', 'RIGHT_THUMB'],
      title: config.title || 'Right Hand Capture',
    });
  }

  /**
   * Capture all 10 fingers (both hands)
   */
  async captureAllFingers(config: Partial<CaptureConfig> = {}): Promise<CaptureResult> {
    return this.captureFingers({
      ...config,
      segmentationModes: ['LEFT_SLAP', 'RIGHT_SLAP', 'LEFT_THUMB', 'RIGHT_THUMB'],
      title: config.title || 'All Fingers Capture',
    });
  }

  /**
   * Capture both thumbs together
   */
  async captureThumbs(config: Partial<CaptureConfig> = {}): Promise<CaptureResult> {
    return this.captureFingers({
      ...config,
      segmentationModes: ['LEFT_AND_RIGHT_THUMBS'],
      title: config.title || 'Thumbs Capture',
    });
  }

  /**
   * Capture a single finger
   */
  async captureSingleFinger(
    finger: SegmentationMode,
    config: Partial<CaptureConfig> = {},
  ): Promise<CaptureResult> {
    return this.captureFingers({
      ...config,
      segmentationModes: [finger],
    });
  }

  /**
   * Deregister the device from Tech5 license server
   */
  async deregisterDevice(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new Error('Tech5 Finger SDK is only available on Android');
    }
    return await Tech5FingerModule.deregisterDevice();
  }

  /**
   * Check if camera permission is granted
   */
  async checkCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    return await Tech5FingerModule.checkCameraPermission();
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    return await Tech5FingerModule.requestCameraPermission();
  }

  /**
   * Get finger name from position code
   */
  getFingerName(position: number): string {
    return FingerPositionNames[position] || 'Unknown';
  }

  /**
   * Convert base64 image to data URI for display
   */
  toImageUri(base64: string, imageType: ImageType = 'PNG'): string {
    const mimeType =
      imageType === 'BMP'
        ? 'image/bmp'
        : imageType === 'WSQ'
        ? 'application/octet-stream'
        : 'image/png';
    return `data:${mimeType};base64,${base64}`;
  }
}

export const Tech5Finger = new Tech5FingerService();
export default Tech5Finger;
