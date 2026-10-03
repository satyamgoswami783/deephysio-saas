import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Inbox } from 'lucide-react-native';
import Button from './Button';
import Colors from '../../constants/colors';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        {icon || <Inbox size={36} color={Colors.primary} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {!!actionTitle && !!onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="sm"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginVertical: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.slate,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 260,
  },
  actionButton: {
    marginTop: 4,
  },
});

export default EmptyState;
