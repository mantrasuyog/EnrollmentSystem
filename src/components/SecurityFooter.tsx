import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SecurityFooterProps {
  fadeAnim: Animated.Value;
  isDarkMode: boolean;
}

const SecurityFooter = React.memo<SecurityFooterProps>(({ fadeAnim, isDarkMode }) => {
  return (
    <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
      <View style={styles.securityBadge}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={[styles.footerText, isDarkMode && styles.footerTextDark]}>
          End-to-end encrypted • ISO 27001 certified
        </Text>
      </View>
    </Animated.View>
  );
});

SecurityFooter.displayName = 'SecurityFooter';

const styles = StyleSheet.create({
  footer: {
    paddingVertical: Math.min(16, screenWidth * 0.035),
    paddingTop: Math.min(10, screenWidth * 0.022),
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: Math.min(16, screenWidth * 0.035),
    paddingVertical: Math.min(10, screenWidth * 0.022),
    borderRadius: Math.min(20, screenWidth * 0.045),
  },
  lockIcon: {
    fontSize: Math.min(14, screenWidth * 0.032),
    marginRight: Math.min(8, screenWidth * 0.018),
  },
  footerText: {
    fontSize: Math.min(12, screenWidth * 0.028),
    color: '#6b7280',
    fontFamily: 'Sen-SemiBold',
  },
  footerTextDark: {
    color: '#9ca3af',
  },
});

export default SecurityFooter;
