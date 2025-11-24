import React, {memo} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface DocumentCardProps {
  docFront: ImageSourcePropType | {uri: string};
  onZoomPress: () => void;
  onDeletePress?: () => void;
  showDeleteButton?: boolean;
  floatY: Animated.AnimatedInterpolation<number>;
  welcomeScaleAnim: Animated.Value;
}

const DocumentCard: React.FC<DocumentCardProps> = memo(
  ({
    docFront,
    onZoomPress,
    onDeletePress,
    showDeleteButton = false,
    floatY,
    welcomeScaleAnim,
  }) => {
    const hasUri = typeof docFront === 'object' && 'uri' in docFront;

    return (
      <Animated.View
        style={[
          {
            transform: [{scale: welcomeScaleAnim}, {translateY: floatY}],
            marginBottom: 6,
            marginTop: 0,
          },
        ]}>
        <LinearGradient
          colors={['#6366f1', '#4f46e5', '#4338ca', '#3730a3']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.creditCardContainer}>
          {showDeleteButton && onDeletePress && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDeletePress}
              activeOpacity={0.8}>
              <Text style={styles.deleteButtonIcon}>×</Text>
            </TouchableOpacity>
          )}

          <View style={styles.cardPattern} />

          <View style={styles.chipArea}>
            <View style={styles.chip} />
          </View>

          <View style={styles.cardContentArea}>
            <TouchableOpacity
              style={styles.documentFrameCard}
              onPress={onZoomPress}
              activeOpacity={0.8}
              disabled={!hasUri}>
              <Image
                style={styles.documentImageCard}
                source={docFront}
                resizeMode="contain"
              />
              {hasUri && (
                <View style={styles.zoomIconOverlay}>
                  <Text style={styles.zoomIconText}>🔍</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardLabel}>DOCUMENT</Text>
              <Text style={styles.cardName} numberOfLines={1}>
                {hasUri ? '✓ Captured' : 'Pending'}
              </Text>
            </View>
            <View style={styles.cardSecurityBadge}>
              <Text style={styles.securityIcon}>🔒</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  },
);

DocumentCard.displayName = 'DocumentCard';

const styles = StyleSheet.create({
  creditCardContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 12,
    minHeight: 180,
    shadowColor: '#1e40af',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#EF4444',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButtonIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 30,
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: '#ffffff',
  },
  chipArea: {
    marginBottom: 2,
    alignItems: 'flex-start',
    marginTop: 12,
  },
  chip: {
    width: 28,
    height: 20,
    borderRadius: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContentArea: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    marginTop: 8,
  },
  documentFrameCard: {
    width: '100%',
    height: 105,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  documentImageCard: {
    height: 98,
    width: '96%',
    borderRadius: 8,
  },
  zoomIconOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  zoomIconText: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'Sen-Bold',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 11,
    color: '#ffffff',
    fontFamily: 'Sen-Bold',
    letterSpacing: 0.3,
  },
  cardSecurityBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  securityIcon: {
    fontSize: 12,
  },
});

export default DocumentCard;
