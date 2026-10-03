import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors from '../../constants/colors';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  dot = false,
}) => {
  const getBadgeStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.badge, styles[size]];
    switch (variant) {
      case 'primary':
        base.push(styles.primary);
        break;
      case 'secondary':
        base.push(styles.secondary);
        break;
      case 'success':
        base.push(styles.success);
        break;
      case 'warning':
        base.push(styles.warning);
        break;
      case 'danger':
        base.push(styles.danger);
        break;
      case 'info':
        base.push(styles.info);
        break;
      case 'neutral':
        base.push(styles.neutral);
        break;
    }
    if (style) base.push(style);
    return base;
  };

  const getTextStyle = (): TextStyle[] => {
    const base: TextStyle[] = [styles.text, styles[`text_${size}` as keyof typeof styles] as TextStyle];
    switch (variant) {
      case 'primary':
        base.push(styles.textPrimary);
        break;
      case 'secondary':
        base.push(styles.textSecondary);
        break;
      case 'success':
        base.push(styles.textSuccess);
        break;
      case 'warning':
        base.push(styles.textWarning);
        break;
      case 'danger':
        base.push(styles.textDanger);
        break;
      case 'info':
        base.push(styles.textInfo);
        break;
      case 'neutral':
        base.push(styles.textNeutral);
        break;
    }
    if (textStyle) base.push(textStyle);
    return base;
  };

  const getDotColor = () => {
    switch (variant) {
      case 'primary': return Colors.primary;
      case 'secondary': return Colors.secondary;
      case 'success': return Colors.success;
      case 'warning': return Colors.warning;
      case 'danger': return Colors.danger;
      case 'info': return Colors.info;
      default: return Colors.slate;
    }
  };

  return (
    <View style={getBadgeStyle()}>
      {dot && <View style={[styles.dot, { backgroundColor: getDotColor() }]} />}
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  md: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  primary: {
    backgroundColor: Colors.primaryLight,
  },
  secondary: {
    backgroundColor: Colors.secondaryLight,
  },
  success: {
    backgroundColor: Colors.successLight,
  },
  warning: {
    backgroundColor: Colors.warningLight,
  },
  danger: {
    backgroundColor: Colors.dangerLight,
  },
  info: {
    backgroundColor: Colors.infoLight,
  },
  neutral: {
    backgroundColor: Colors.backgroundMuted,
  },
  text: {
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 11,
  },
  text_md: {
    fontSize: 12,
  },
  textPrimary: {
    color: Colors.primaryDark,
  },
  textSecondary: {
    color: Colors.secondaryDark,
  },
  textSuccess: {
    color: '#065F46',
  },
  textWarning: {
    color: Colors.secondaryDark,
  },
  textDanger: {
    color: '#991B1B',
  },
  textInfo: {
    color: '#1E40AF',
  },
  textNeutral: {
    color: Colors.slate,
  },
});

export default Badge;
