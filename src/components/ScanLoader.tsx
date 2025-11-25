import React, {memo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import * as Progress from 'react-native-progress';
import { colors } from '../common/colors';

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
          color={colors.deepBlue1}
          progress={scanProgress}
          borderColor={colors.white30}
          unfilledColor={colors.borderGray}
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
    backgroundColor: colors.lightBlue1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: colors.deepBlue1,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: colors.sky3,
  },
  loaderInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bluePrimary,
  },
  loaderText: {
    fontSize: 20,
    color: colors.deepBlue1,
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
    color: colors.bluePrimary,
    marginTop: 12,
    fontFamily: 'Sen-Bold',
  },
  cancelScanButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: colors.danger1,
    borderRadius: 12,
    shadowColor: colors.danger1,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelScanText: {
    fontSize: 16,
    color: colors.white,
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default ScanLoader;
