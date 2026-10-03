import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, ShieldCheck, User, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Colors from '../../src/constants/colors';

const ROLE_PRESETS = [
  { label: 'Admin', email: 'admin@deephysio.com', pass: 'admin123', role: 'admin', color: '#0D9488' },
  { label: 'Therapist', email: 'therapist@deephysio.com', pass: 'therapist123', role: 'therapist', color: '#3B82F6' },
  { label: 'Receptionist', email: 'receptionist@deephysio.com', pass: 'receptionist123', role: 'receptionist', color: '#8B5CF6' },
  { label: 'Billing', email: 'billing@deephysio.com', pass: 'billing123', role: 'billing', color: '#F59E0B' },
  { label: 'SuperAdmin', email: 'superadmin@deephysio.com', pass: 'superadmin123', role: 'superadmin', color: '#7E22CE' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login, clinicProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRolePreset, setSelectedRolePreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setSelectedRolePreset(preset.role);
    setEmail(preset.email);
    setPassword(preset.pass);
    setErrorMessage('');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(email.trim(), password);
      router.replace('/(app)/(tabs)');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Access Denied. Please check your email and password.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const logoSource = clinicProfile?.logoDataUrl
    ? { uri: clinicProfile.logoDataUrl }
    : require('../../assets/icon.png');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Back Button to Landing Page ── */}
        <View style={styles.topBackRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(auth)/landing')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#0F172A" />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>
        </View>

        {/* ── 1. Brand Header (KT Master Logo + Platform Branding) ── */}
        <View style={styles.brandContainer}>
          {/* KT Master Logo in sleek glow frame */}
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <Image
                source={logoSource}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.appName}>
            {clinicProfile?.clinicName && !clinicProfile.clinicName.toLowerCase().includes('deephysio')
              ? clinicProfile.clinicName
              : 'Healthcare Clinic'}
          </Text>
          <View style={styles.platformBadge}>
            <Text style={styles.platformBadgeText}>
              HEALTHCARE MANAGEMENT PLATFORM
            </Text>
          </View>
        </View>

        {/* ── 2. Login Card ── */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Sign In</Text>
          <Text style={styles.welcomeSubtitle}>
            Enter your credentials or choose a quick test profile below
          </Text>

          {/* Quick Role Selector */}
          <Text style={styles.presetLabel}>QUICK ROLE SWITCH:</Text>
          <View style={styles.presetContainer}>
            {ROLE_PRESETS.map((preset) => {
              const isSelected = selectedRolePreset === preset.role;
              return (
                <TouchableOpacity
                  key={preset.role}
                  style={[
                    styles.presetChip,
                    isSelected && { backgroundColor: `${preset.color}18`, borderColor: preset.color },
                  ]}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.presetDot, { backgroundColor: preset.color }]} />
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && { color: preset.color, fontWeight: '800' },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Error Message */}
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Email Address <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputFieldWrap}>
              <Mail size={18} color={Colors.slate} style={styles.inputIcon} />
              <TextInputField
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                }}
                placeholder="name@clinic.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Password <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputFieldWrap}>
              <Lock size={18} color={Colors.slate} style={styles.inputIcon} />
              <TextInputField
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage('');
                }}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Colors.slate} />
                ) : (
                  <Eye size={18} color={Colors.slate} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.forgotRow}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <ShieldCheck size={15} color={Colors.slate} />
          <Text style={styles.footerText}>
            Secure 256-bit Encrypted Medical Workspace
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Sub-component for clean input text
import { TextInput } from 'react-native';

function TextInputField({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  autoCapitalize?: any;
}) {
  return (
    <TextInput
      style={styles.textInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  topBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#334155',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 10,
    padding: 6,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  platformBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
  platformBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 3,
    marginBottom: 14,
    lineHeight: 17,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  presetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  inputFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: -2,
  },
  forgotText: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '500',
  },
});
