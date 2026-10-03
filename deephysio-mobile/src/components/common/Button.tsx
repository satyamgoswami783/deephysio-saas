import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Colors from '../../constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.button, styles[size]];

    if (fullWidth) base.push(styles.fullWidth);

    switch (variant) {
      case 'primary':
        base.push(styles.primary);
        break;
      case 'secondary':
        base.push(styles.secondary);
        break;
      case 'outline':
        base.push(styles.outline);
        break;
      case 'danger':
        base.push(styles.danger);
        break;
      case 'ghost':
        base.push(styles.ghost);
        break;
    }

    if (disabled || loading) {
      base.push(styles.disabled);
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
      case 'outline':
        base.push(styles.textOutline);
        break;
      case 'danger':
        base.push(styles.textDanger);
        break;
      case 'ghost':
        base.push(styles.textGhost);
        break;
    }

    if (disabled) {
      base.push(styles.textDisabled);
    }

    if (textStyle) base.push(textStyle);

    return base;
  };

  const spinnerColor =
    variant === 'primary' || variant === 'danger' ? Colors.surface : Colors.primary;

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 48,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 54,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 16,
  },
  textPrimary: {
    color: Colors.surface,
  },
  textSecondary: {
    color: Colors.surface,
  },
  textOutline: {
    color: Colors.primary,
  },
  textDanger: {
    color: Colors.surface,
  },
  textGhost: {
    color: Colors.primary,
  },
  textDisabled: {
    color: Colors.slate,
  },
});

export default Button;
