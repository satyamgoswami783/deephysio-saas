import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import LoadingState from '../../src/components/common/LoadingState';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Loading your workspace..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="appointments/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="appointments/book" options={{ presentation: 'modal' }} />
      <Stack.Screen name="appointments/checkin" options={{ presentation: 'modal' }} />
      <Stack.Screen name="appointments/waitlist" options={{ presentation: 'card' }} />
      <Stack.Screen name="patients/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="patients/create" options={{ presentation: 'modal' }} />
      <Stack.Screen name="patients/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notes/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="notes/create" options={{ presentation: 'modal' }} />
      <Stack.Screen name="billing/invoices/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="billing/create-invoice" options={{ presentation: 'modal' }} />
      <Stack.Screen name="billing/record-payment" options={{ presentation: 'modal' }} />
      <Stack.Screen name="forms/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="forms/fill" options={{ presentation: 'card' }} />
      <Stack.Screen name="communication/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="analytics/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="services/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings/plans" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings/security" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings/change-password" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings/users" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings/clinic" options={{ presentation: 'card' }} />
    </Stack>
  );
}
