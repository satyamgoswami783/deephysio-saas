import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, CheckCircle2, KeyRound, Lock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import Header from '../../src/components/common/Header';
import Input from '../../src/components/common/Input';
import Button from '../../src/components/common/Button';
import { authApi } from '../../src/api/auth.api';
import Colors from '../../src/constants/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your account email.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.otp) {
        setDevOtpHint(res.otp);
      }
      setStep('otp');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Password Recovery"
        showBack
        onBackPress={() => {
          if (step === 'otp') {
            setStep('email');
            setErrorMessage('');
          } else {
            router.back();
          }
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'success' && (
            <View style={styles.successCard}>
              <View style={styles.successIconCircle}>
                <CheckCircle2 size={54} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Password Reset Complete</Text>
              <Text style={styles.successMessage}>
                Your account password has been updated securely. You can now log in with your new password.
              </Text>
              <Button
                title="Proceed to Login"
                onPress={() => router.replace('/(auth)/login')}
                fullWidth
                size="lg"
                style={styles.backBtn}
              />
            </View>
          )}

          {step === 'email' && (
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <KeyRound size={26} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.description}>
                Enter your registered clinic email. We'll send a 6-digit verification code (OTP) to reset your password.
              </Text>

              {!!errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              <Input
                label="Registered Email"
                placeholder="doctor@clinic.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color={Colors.slate} />}
                required
              />

              <Button
                title="Send 6-Digit OTP"
                onPress={handleRequestOtp}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.submitBtn}
              />
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
                <ShieldCheck size={26} color={Colors.success} />
              </View>
              <Text style={styles.title}>Enter 6-Digit Code</Text>
              <Text style={styles.description}>
                We sent a 6-digit OTP code to <Text style={{ fontWeight: '600', color: Colors.dark }}>{email}</Text>.
              </Text>

              {!!devOtpHint && (
                <View style={styles.devBanner}>
                  <Text style={styles.devBannerText}>Demo OTP: {devOtpHint}</Text>
                </View>
              )}

              {!!errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              <Input
                label="6-Digit OTP Code"
                placeholder="123456"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setErrorMessage('');
                }}
                keyboardType="numeric"
                maxLength={6}
                leftIcon={<KeyRound size={18} color={Colors.slate} />}
                required
              />

              <Input
                label="New Password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrorMessage('');
                }}
                secureTextEntry
                leftIcon={<Lock size={18} color={Colors.slate} />}
                required
              />

              <Input
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorMessage('');
                }}
                secureTextEntry
                leftIcon={<Lock size={18} color={Colors.slate} />}
                required
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.submitBtn}
              />

              <Button
                title="Resend Code"
                variant="ghost"
                onPress={handleRequestOtp}
                disabled={loading}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight || '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: Colors.slate,
    lineHeight: 20,
    marginBottom: 20,
  },
  devBanner: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  devBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.danger,
  },
  submitBtn: {
    marginTop: 8,
  },
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: Colors.slate,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backBtn: {
    marginTop: 8,
  },
});
