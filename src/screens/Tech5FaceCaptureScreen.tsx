import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Tech5Face, {
  CaptureResult,
  CaptureConfig,
  FaceData,
} from '../modules/Tech5Face';

interface Tech5FaceCaptureScreenProps {
  navigation?: any;
  route?: {
    params?: {
      config?: CaptureConfig;
      onCaptureComplete?: (result: CaptureResult) => void;
    };
  };
}

type CaptureMode = 'standard' | 'icao' | 'liveness' | 'quick';

const Tech5FaceCaptureScreen: React.FC<Tech5FaceCaptureScreenProps> = ({
  navigation,
  route,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<CaptureMode>('standard');

  const captureConfig = route?.params?.config || {};
  const onCaptureComplete = route?.params?.onCaptureComplete;

  const handleCapture = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Error', 'Face capture is only available on Android');
      return;
    }

    setIsCapturing(true);
    setError(null);
    setCaptureResult(null);

    try {
      // Check camera permission first
      const hasPermission = await Tech5Face.checkCameraPermission();
      if (!hasPermission) {
        await Tech5Face.requestCameraPermission();
      }

      let result: CaptureResult;

      switch (selectedMode) {
        case 'icao':
          result = await Tech5Face.captureFaceWithICAO(captureConfig);
          break;
        case 'liveness':
          result = await Tech5Face.captureFaceWithLiveness(captureConfig);
          break;
        case 'quick':
          result = await Tech5Face.quickCapture(captureConfig);
          break;
        case 'standard':
        default:
          result = await Tech5Face.captureFace(captureConfig);
          break;
      }

      setCaptureResult(result);

      if (onCaptureComplete) {
        onCaptureComplete(result);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to capture face';
      setError(errorMessage);

      if (err.code !== 'CANCELLED') {
        Alert.alert('Capture Error', errorMessage);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [selectedMode, captureConfig, onCaptureComplete]);

  const getModeLabel = (mode: CaptureMode): string => {
    switch (mode) {
      case 'standard':
        return 'Standard';
      case 'icao':
        return 'ICAO/ISO';
      case 'liveness':
        return 'Liveness';
      case 'quick':
        return 'Quick';
      default:
        return mode;
    }
  };

  const getModeDescription = (mode: CaptureMode): string => {
    switch (mode) {
      case 'standard':
        return 'Standard face capture with quality checks';
      case 'icao':
        return 'ISO/ICAO compliant capture for official documents';
      case 'liveness':
        return 'Includes passive liveness detection';
      case 'quick':
        return 'Fast capture with minimal checks';
      default:
        return '';
    }
  };

  const renderModeSelector = () => (
    <View style={styles.modeContainer}>
      <Text style={styles.modeLabel}>Select Capture Mode:</Text>
      <View style={styles.modeButtons}>
        {(['standard', 'icao', 'liveness', 'quick'] as CaptureMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              selectedMode === mode && styles.modeButtonActive,
            ]}
            onPress={() => setSelectedMode(mode)}>
            <Text
              style={[
                styles.modeButtonText,
                selectedMode === mode && styles.modeButtonTextActive,
              ]}>
              {getModeLabel(mode)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.modeDescription}>{getModeDescription(selectedMode)}</Text>
    </View>
  );

  const renderQualityScore = (label: string, value: number, threshold?: number) => {
    const isGood = threshold ? value <= threshold : value >= 0.5;
    return (
      <View style={styles.qualityRow}>
        <Text style={styles.qualityLabel}>{label}</Text>
        <Text style={[styles.qualityValue, isGood ? styles.qualityGood : styles.qualityBad]}>
          {value.toFixed(3)}
        </Text>
      </View>
    );
  };

  const renderFaceData = (faceData: FaceData) => {
    const compliance = Tech5Face.isICAOCompliant(faceData);

    return (
      <View style={styles.faceDataContainer}>
        {/* Compliance Status */}
        <View style={[styles.complianceBox, compliance.compliant ? styles.complianceGood : styles.complianceBad]}>
          <Text style={styles.complianceText}>
            {compliance.compliant ? 'ICAO Compliant' : 'Non-Compliant'}
          </Text>
          {!compliance.compliant && compliance.issues.length > 0 && (
            <View style={styles.issuesList}>
              {compliance.issues.map((issue, index) => (
                <Text key={index} style={styles.issueText}>- {issue}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Pose Angles */}
        <View style={styles.qualitySection}>
          <Text style={styles.qualitySectionTitle}>Pose Angles</Text>
          {renderQualityScore('Pan (Yaw)', Math.abs(faceData.pan), 15)}
          {renderQualityScore('Pitch', Math.abs(faceData.pitch), 15)}
          {renderQualityScore('Roll', Math.abs(faceData.roll), 10)}
        </View>

        {/* Occlusion Detection */}
        <View style={styles.qualitySection}>
          <Text style={styles.qualitySectionTitle}>Occlusion Detection</Text>
          {renderQualityScore('Mask', faceData.maskScore, 0.5)}
          {renderQualityScore('Sunglasses', faceData.sunGlassScore, 0.5)}
          {renderQualityScore('Any Glasses', faceData.anyGlassScore, 0.5)}
          {renderQualityScore('Hat', faceData.hatScore, 0.4)}
          {renderQualityScore('Headphones', faceData.headphonesScore, 0.4)}
        </View>

        {/* Eye Status */}
        <View style={styles.qualitySection}>
          <Text style={styles.qualitySectionTitle}>Eye Status</Text>
          {renderQualityScore('Left Eye Closed', faceData.leftEyeCloseScore, 0.8)}
          {renderQualityScore('Right Eye Closed', faceData.rightEyeCloseScore, 0.8)}
          {renderQualityScore('Eye Distance', faceData.eyeDistance)}
        </View>

        {/* Image Quality */}
        <View style={styles.qualitySection}>
          <Text style={styles.qualitySectionTitle}>Image Quality</Text>
          {renderQualityScore('Blur', faceData.blurScore, 0.5)}
          {renderQualityScore('Exposure', faceData.exposureScore)}
          {renderQualityScore('Brightness', faceData.brightnessScore)}
          {renderQualityScore('Uniform Background', faceData.uniformBackgroundScore)}
        </View>
      </View>
    );
  };

  const renderCaptureResult = () => {
    if (!captureResult || !captureResult.success) return null;

    const imageUri = captureResult.imageBase64
      ? Tech5Face.toImageUri(captureResult.imageBase64)
      : null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Capture Result</Text>

        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{uri: imageUri}} style={styles.faceImage} />
          </View>
        )}

        {captureResult.faceData && renderFaceData(captureResult.faceData)}

        {captureResult.faceData?.hasPortalImage && captureResult.faceData.portalImageBase64 && (
          <View style={styles.portalImageContainer}>
            <Text style={styles.portalImageTitle}>Portal Image (Cropped)</Text>
            <Image
              source={{uri: Tech5Face.toImageUri(captureResult.faceData.portalImageBase64)}}
              style={styles.portalImage}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Face Capture</Text>
          <Text style={styles.subtitle}>Tech5 AirSnap Face Scanner</Text>
        </View>

        {renderModeSelector()}

        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isCapturing}>
          {isCapturing ? (
            <View style={styles.captureButtonContent}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.captureButtonText}>Capturing...</Text>
            </View>
          ) : (
            <Text style={styles.captureButtonText}>Start Face Capture</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {captureResult?.timedOut && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Capture timed out. Best available frame returned.
            </Text>
          </View>
        )}

        {renderCaptureResult()}

        {captureResult && navigation && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              navigation.goBack();
            }}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  modeContainer: {
    marginBottom: 20,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  modeDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  captureButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0,
    elevation: 0,
  },
  captureButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  warningContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    color: '#e65100',
    fontSize: 14,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  faceImage: {
    width: 200,
    height: 250,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  faceDataContainer: {
    gap: 15,
  },
  complianceBox: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  complianceGood: {
    backgroundColor: '#e8f5e9',
  },
  complianceBad: {
    backgroundColor: '#ffebee',
  },
  complianceText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  issuesList: {
    marginTop: 10,
  },
  issueText: {
    fontSize: 13,
    color: '#c62828',
    marginTop: 4,
  },
  qualitySection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  qualitySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  qualityLabel: {
    fontSize: 13,
    color: '#666',
  },
  qualityValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  qualityGood: {
    color: '#2e7d32',
  },
  qualityBad: {
    color: '#c62828',
  },
  portalImageContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  portalImageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  portalImage: {
    width: 150,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Tech5FaceCaptureScreen;
