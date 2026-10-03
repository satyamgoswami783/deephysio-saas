import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LogBox } from 'react-native';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { Colors } from '../src/constants/colors';

// Disable red/yellow overlay on phone screen so app UI stays clean
// All errors will be printed directly to the development terminal
LogBox.ignoreAllLogs(true);

// Global Query & Mutation error logger for terminal
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.log(`\n❌ [React Query Error] ━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📌 Query Key:`, JSON.stringify(query.queryKey));
      console.log(`HTTP Status:`, status || 'Network Error');
      console.log(`Message:`, data?.message || error?.message || error);
      if (data) console.log(`Response Body:`, JSON.stringify(data, null, 2));
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any, _variables, _context, mutation) => {
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.log(`\n❌ [React Mutation Error] ━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📌 Mutation:`, mutation.options.mutationKey || 'Anonymous');
      console.log(`HTTP Status:`, status || 'Network Error');
      console.log(`Message:`, data?.message || error?.message || error);
      if (data) console.log(`Response Body:`, JSON.stringify(data, null, 2));
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 15, // 15 seconds fresh cache
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// React Error Boundary to catch and print any screen rendering crash
class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`🔥 [React Native UI Crash / Render Error]`);
    console.error(`Error:`, error.name, error.message);
    console.error(`Stack:`, error.stack);
    console.error(`Component Stack:`, errorInfo.componentStack);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <ScrollView contentContainerStyle={styles.errorScroll}>
            <Text style={styles.errorBadge}>⚠️ App Error Detected</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </Text>
            {this.state.error?.stack && (
              <View style={styles.stackBox}>
                <Text style={styles.stackText} numberOfLines={12}>
                  {this.state.error.stack}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.retryButton} onPress={this.resetError} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>🔄 Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useEffect(() => {
    console.log('🚀 [DeePhysio Mobile] Application Root Loaded Successfully');

    // Global uncaught JS exceptions
    const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
    if ((global as any).ErrorUtils) {
      (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.error(`💣 [Global Uncaught Exception] Fatal: ${isFatal}`);
        console.error(`Error:`, error);
        console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LanguageProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
              </Stack>
            </LanguageProvider>
          </AuthProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  errorScroll: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  errorBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  stackBox: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stackText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#F87171',
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

