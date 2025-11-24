import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SuccessInfoCardProps {
  icon: string;
  title: string;
  description: string;
  backgroundColor: string;
  borderColor: string;
  iconBgColor: string;
}

const SuccessInfoCard = React.memo<SuccessInfoCardProps>(({
  icon,
  title,
  description,
  backgroundColor,
  borderColor,
  iconBgColor,
}) => {
  return (
    <View style={[styles.infoCard, { backgroundColor, borderColor }]}>
      <View style={styles.infoHeader}>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <Text style={styles.largeIcon}>{icon}</Text>
        </View>
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      <Text style={styles.infoText}>{description}</Text>
    </View>
  );
});

SuccessInfoCard.displayName = 'SuccessInfoCard';

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  largeIcon: {
    fontSize: 18,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Sen-Bold',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Sen-Regular',
    marginTop: 6,
  },
});

export default SuccessInfoCard;
