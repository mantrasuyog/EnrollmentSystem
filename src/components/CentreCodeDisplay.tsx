import React, {memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface CentreCodeDisplayProps {
  centreCode: string;
}

const CentreCodeDisplay: React.FC<CentreCodeDisplayProps> = memo(
  ({centreCode}) => {
    return (
      <View style={styles.centreCodeDisplayContainer}>
        <View style={styles.centreCodeDisplayBadge}>
          <Text style={styles.centreCodeDisplayLabel}>Centre Code</Text>
          <Text style={styles.centreCodeDisplayValue}>{centreCode}</Text>
        </View>
      </View>
    );
  },
);

CentreCodeDisplay.displayName = 'CentreCodeDisplay';

const styles = StyleSheet.create({
  centreCodeDisplayContainer: {
    marginBottom: 8,
  },
  centreCodeDisplayBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centreCodeDisplayLabel: {
    fontSize: 9,
    color: '#6366f1',
    fontFamily: 'Sen-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  centreCodeDisplayValue: {
    fontSize: 14,
    color: '#4338ca',
    fontFamily: 'Sen-Bold',
    letterSpacing: 1,
  },
});

export default CentreCodeDisplay;
