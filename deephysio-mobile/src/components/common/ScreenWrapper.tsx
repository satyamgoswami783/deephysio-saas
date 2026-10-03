import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';

interface ScreenWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  withSafeArea?: boolean;
  backgroundColor?: string;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  scrollable = false,
  withSafeArea = true,
  backgroundColor = Colors.background,
  edges = ['top', 'left', 'right'],
}) => {
  const Container = withSafeArea ? SafeAreaView : View;

  const content = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <Container edges={edges} style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});

export default ScreenWrapper;
