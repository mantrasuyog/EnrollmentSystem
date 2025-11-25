import React, {memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import { colors } from '../common/colors';

interface DocumentHeaderProps {
  fullName: string;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = memo(({fullName}) => {
  return (
    <View style={styles.headerTop}>
      <Text style={styles.headerGreeting}>Document Verification</Text>
      <View style={styles.headerStatusRow}>
        <View style={[styles.statusDot, {backgroundColor: colors.green1}]} />
        <Text style={styles.statusLabelTop}>{fullName}</Text>
      </View>
    </View>
  );
});

DocumentHeader.displayName = 'DocumentHeader';

const styles = StyleSheet.create({
  headerTop: {
    marginBottom: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  headerGreeting: {
    fontSize: 20,
    fontFamily: 'Sen-Bold',
    color: '#111827',
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    shadowColor: colors.green1,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  statusLabelTop: {
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'Sen-SemiBold',
  },
});

export default DocumentHeader;
