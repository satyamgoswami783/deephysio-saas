import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import LoadingState from '../src/components/common/LoadingState';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Initializing DeePhysio Workspace..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/landing" />;
}
