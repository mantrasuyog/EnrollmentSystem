import React, {memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface DocumentHeaderProps {
  fullName: string;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = memo(({fullName}) => {
  return (
    <View style={styles.headerTop}>
      <Text style={styles.headerGreeting}>Document Verification</Text>
      <View style={styles.headerStatusRow}>
        <View style={[styles.statusDot, {backgroundColor: '#10b981'}]} />
        <Text style={styles.statusLabelTop}>{fullName}</Text>
      </View>
    </View>
  );
});

DocumentHeader.displayName = 'DocumentHeader';

const styles = StyleSheet.create({
  headerTop: {
    marginBottom: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerGreeting: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#10b981',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  statusLabelTop: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Sen-SemiBold',
  },
});

export default DocumentHeader;
