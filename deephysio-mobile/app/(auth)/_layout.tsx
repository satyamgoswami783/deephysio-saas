import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import LoadingState from '../../src/components/common/LoadingState';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Checking session..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="landing" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
