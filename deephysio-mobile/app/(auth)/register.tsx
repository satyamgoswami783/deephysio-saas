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
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Building,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { authApi } from '../../src/api/auth.api';
import { useAuth } from '../../src/context/AuthContext';
import Colors from '../../src/constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { plan: paramPlan } = useLocalSearchParams<{ plan?: string }>();
  const { login, clinicProfile } = useAuth();

  const selectedPlan = paramPlan || '7-Day Free Trial';

  const [businessName, setBusinessName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (
      !businessName.trim() ||
      !adminName.trim() ||
      !email.trim() ||
      !mobileNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Please accept the Terms and Conditions to proceed.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authApi.register({
        businessName: businessName.trim(),
        adminName: adminName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password,
        selectedPlan,
      });

      // Auto login after registration
      await login(email.trim(), password);
      Alert.alert(
        'Workspace Created!',
        `Welcome to Healthcare Clinic! Your clinic workspace has been activated with the ${selectedPlan} plan.`,
        [{ text: 'Get Started', onPress: () => router.replace('/(app)/(tabs)') }]
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your details and try again.';
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
        {/* ── Top Back Row ── */}
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

        {/* ── 1. Brand Header ── */}
        <View style={styles.brandContainer}>
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
            {clinicProfile?.clinicName || 'Healthcare Clinic'}
          </Text>
          <Text style={styles.appTagline}>Create Your Clinic Workspace</Text>
        </View>

        {/* ── 2. Selected Plan Banner ── */}
        <View style={styles.planBanner}>
          <View style={styles.planBannerIconWrap}>
            <Crown size={18} color="#0D9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planBannerLabel}>SELECTED PLAN</Text>
            <Text style={styles.planBannerTitle}>{selectedPlan}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/landing')}
            style={styles.changePlanBtn}
          >
            <Text style={styles.changePlanBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Registration Form Card ── */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Clinic Registration</Text>
          <Text style={styles.welcomeSubtitle}>
            Activate your clinic portal with full access to appointments, patient records & billing.
          </Text>

          {/* Error Message */}
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Clinic / Business Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Clinic / Business Name <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputFieldWrap}>
              <Building size={18} color={Colors.slate} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={businessName}
                onChangeText={(t) => {
                  setBusinessName(t);
                  setErrorMessage('');
                }}
                placeholder="e.g. DeePhysio Rehab & Wellness"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Admin / Doctor Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Administrator Full Name <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputFieldWrap}>
              <User size={18} color={Colors.slate} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={adminName}
                onChangeText={(t) => {
                  setAdminName(t);
                  setErrorMessage('');
                }}
                placeholder="e.g. Dr. John Doe"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Work Email Address <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputFieldWrap}>
              <Mail size={18} color={Colors.slate} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrorMessage('');
                }}
                placeholder="admin@clinic.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Mobile / Contact Number <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputFieldWrap}>
              <Phone size={18} color={Colors.slate} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={mobileNumber}
                onChangeText={(t) => {
                  setMobileNumber(t);
                  setErrorMessage('');
                }}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Account Password <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputFieldWrap}>
              <Lock size={18} color={Colors.slate} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorMessage('');
                }}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#94A3B8"
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

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Confirm Password <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputFieldWrap}>
              <Lock size={18} color={Colors.slate} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setErrorMessage('');
                }}
                placeholder="Re-enter password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAcceptTerms(!acceptTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
              {acceptTerms && <CheckCircle2 size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>
              {loading ? 'Activating Workspace...' : 'Activate Clinic Workspace'}
            </Text>
          </TouchableOpacity>

          {/* Already have an account link */}
          <View style={styles.signInLinkRow}>
            <Text style={styles.signInPromptText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.signInLinkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ShieldCheck size={15} color={Colors.slate} />
          <Text style={styles.footerText}>
            Secure 256-bit Encrypted Healthcare SaaS Platform
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 36,
    justifyContent: 'center',
  },
  topBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 14,
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
    marginBottom: 8,
    padding: 5,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
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
  appTagline: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '600',
    marginTop: 2,
  },
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  planBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.6,
  },
  planBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  changePlanBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  changePlanBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 3,
    marginBottom: 14,
    lineHeight: 16,
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
    fontSize: 11,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  termsText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
  },
  termsLink: {
    color: '#0D9488',
    fontWeight: '700',
  },
  registerBtn: {
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
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  signInLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
  },
  signInPromptText: {
    fontSize: 12,
    color: Colors.slate,
  },
  signInLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
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
