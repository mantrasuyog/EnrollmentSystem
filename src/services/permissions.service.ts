import { Platform, Linking } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
  PermissionStatus,
  openSettings,
} from 'react-native-permissions';

export interface PermissionResult {
  camera: PermissionStatus | 'unavailable';
}

// Get camera permission based on platform
const getCameraPermission = (): Permission | null => {
  if (Platform.OS === 'android') {
    return PERMISSIONS.ANDROID.CAMERA;
  } else if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.CAMERA;
  }
  return null;
};

// Check camera permission status
export const checkCameraPermission = async (): Promise<PermissionStatus | 'unavailable'> => {
  const permission = getCameraPermission();
  if (!permission) {
    return 'unavailable';
  }
  try {
    const result = await check(permission);
    return result;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return 'unavailable';
  }
};

// Check all permissions status (only camera)
export const checkAllPermissions = async (): Promise<PermissionResult> => {
  const camera = await checkCameraPermission();
  return { camera };
};

// Request camera permission
export const requestCameraPermission = async (): Promise<PermissionStatus | 'unavailable'> => {
  const permission = getCameraPermission();
  if (!permission) {
    return 'unavailable';
  }
  try {
    const result = await request(permission);
    return result;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return 'unavailable';
  }
};

// Request all permissions (only camera)
export const requestAllPermissions = async (): Promise<PermissionResult> => {
  const camera = await requestCameraPermission();
  return { camera };
};

// Check if permission is granted
export const isPermissionGranted = (status: PermissionStatus | 'unavailable'): boolean => {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
};

// Check if camera permission is granted
export const areAllPermissionsGranted = (results: PermissionResult): boolean => {
  return isPermissionGranted(results.camera);
};

// Get status display info
export const getPermissionStatusInfo = (status: PermissionStatus | 'unavailable'): {
  label: string;
  color: string;
  icon: string;
} => {
  switch (status) {
    case RESULTS.GRANTED:
      return { label: 'Granted', color: '#10B981', icon: '✓' };
    case RESULTS.LIMITED:
      return { label: 'Limited', color: '#F59E0B', icon: '~' };
    case RESULTS.DENIED:
      return { label: 'Denied', color: '#EF4444', icon: '✕' };
    case RESULTS.BLOCKED:
      return { label: 'Blocked', color: '#EF4444', icon: '⊘' };
    case 'unavailable':
      return { label: 'N/A', color: '#9CA3AF', icon: '–' };
    default:
      return { label: 'Unknown', color: '#9CA3AF', icon: '?' };
  }
};

// Open app settings
export const openAppSettings = async (): Promise<void> => {
  try {
    await openSettings();
  } catch (error) {
    console.error('Error opening settings:', error);
    // Fallback to Linking
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }
};
