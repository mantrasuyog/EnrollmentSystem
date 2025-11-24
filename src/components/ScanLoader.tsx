import React, {memo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import * as Progress from 'react-native-progress';

interface ScanLoaderProps {
  scanProgress: number;
  onCancel: () => void;
  loaderScaleAnim: Animated.Value;
}

const ScanLoader: React.FC<ScanLoaderProps> = memo(
  ({scanProgress, onCancel, loaderScaleAnim}) => {
    return (
      <View style={styles.scanLoaderContainer}>
        <Animated.View
          style={[
            styles.loaderCircle,
            {transform: [{scale: loaderScaleAnim}]},
          ]}>
          <View style={styles.loaderInner} />
        </Animated.View>
        <Text style={styles.loaderText}>Scanning Document...</Text>
        <Progress.Bar
          style={styles.scanProgressBar}
          width={250}
          useNativeDriver={true}
          color="#1e40af"
          progress={scanProgress}
          borderColor="rgba(30,64,175,0.2)"
          unfilledColor="#e2e8f0"
        />
        <Text style={styles.progressText}>
          {Math.round(scanProgress * 100)}%
        </Text>
        <TouchableOpacity
          style={styles.cancelScanButton}
          onPress={onCancel}
          activeOpacity={0.7}>
          <Text style={styles.cancelScanText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

ScanLoader.displayName = 'ScanLoader';

const styles = StyleSheet.create({
  scanLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loaderCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#1e40af',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  loaderInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3B82F6',
  },
  loaderText: {
    fontSize: 20,
    color: '#1e3a8a',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.2,
  },
  scanProgressBar: {
    marginVertical: 24,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 16,
    color: '#3B82F6',
    marginTop: 12,
    fontFamily: 'Sen-Bold',
  },
  cancelScanButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelScanText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default ScanLoader;
