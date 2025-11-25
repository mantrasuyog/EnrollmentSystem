import React, {memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import { colors } from '../common/colors';

interface InfoBadgeProps {
  message: string;
  icon?: string;
}

const InfoBadge: React.FC<InfoBadgeProps> = memo(({message, icon = 'ℹ️'}) => {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoBadge}>
        <Text style={styles.infoBadgeIcon}>{icon}</Text>
        <Text style={styles.infoBadgeText}>{message}</Text>
      </View>
    </View>
  );
});

InfoBadge.displayName = 'InfoBadge';

const styles = StyleSheet.create({
  infoSection: {
    marginTop: 6,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.blueLightBg,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.bluePrimary,
    shadowColor: colors.bluePrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoBadgeIcon: {
    fontSize: 14,
  },
  infoBadgeText: {
    flex: 1,
    fontSize: 11,
    color: colors.darkText,
    fontFamily: 'Sen-SemiBold',
    lineHeight: 15,
  },
});

export default InfoBadge;
