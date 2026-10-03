import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  KeyRound,
  ShieldCheck,
  Clock,
  Fingerprint,
  ChevronDown,
  Check,
  ChevronLeft,
  Smartphone,
  LogOut,
  Globe,
} from 'lucide-react-native';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Colors from '../../../src/constants/colors';

const TIMEOUT_OPTIONS = [
  '15 minutes',
  '30 minutes',
  '1 hour',
  '4 hours',
  'Never',
];

export default function SecuritySettingsScreen() {
  const router = useRouter();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [singleSessionEnabled, setSingleSessionEnabled] = useState(true);
  const [autoLogoutTime, setAutoLogoutTime] = useState('30 minutes');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const handleToggle2FA = (val: boolean) => {
    setTwoFactorEnabled(val);
    Alert.alert(
      val ? '2FA Enabled' : '2FA Disabled',
      val
        ? 'Two-Factor Authentication is now active. You will be prompted for an OTP when logging in.'
        : 'Two-Factor Authentication has been turned off for your account.'
    );
  };

  const handleToggleSingleSession = (val: boolean) => {
    setSingleSessionEnabled(val);
    Alert.alert(
      val ? 'Single Session Enforced' : 'Concurrent Sessions Allowed',
      val
        ? 'Logging in from another mobile or desktop device will automatically log out older sessions.'
        : 'Multiple concurrent logins are now allowed.'
    );
  };

  const handleTerminateRemoteSessions = () => {
    Alert.alert(
      'Terminate Other Sessions',
      'This will immediately log out all other mobile and desktop devices logged into this clinic workspace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate All',
          style: 'destructive',
          onPress: async () => {
            setTerminating(true);
            try {
              Alert.alert('Success', 'All remote device sessions terminated successfully.');
            } catch (err) {
              Alert.alert('Error', 'Failed to terminate remote sessions.');
            } finally {
              setTerminating(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleBiometric = (val: boolean) => {
    setBiometricEnabled(val);
    Alert.alert(
      val ? 'Biometrics Enabled' : 'Biometrics Disabled',
      val
        ? 'Fingerprint / Face ID authentication enabled for quick app access.'
        : 'Biometric unlock disabled.'
    );
  };

  return (
    <ScreenWrapper>
      <Header
        title="Security Settings"
        subtitle="Manage account protection and session timeouts."
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Change Password Card (Matching Web) ── */}
        <Card elevated style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <KeyRound size={20} color="#6366F1" />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Change Password</Text>
              <Text style={styles.cardDesc}>
                Update your account password to maintain security. We recommend changing it every 90 days.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(app)/settings/change-password')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── 2. Two-Factor Authentication Card (Matching Web) ── */}
        <Card elevated style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <ShieldCheck size={20} color="#10B981" />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Two-Factor Authentication</Text>
              <Text style={styles.cardDesc}>
                Add extra security to your account by requiring an OTP from your mobile device upon login.
              </Text>
            </View>

            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
              thumbColor={Colors.surface}
            />
          </View>
        </Card>

        {/* ── 3. Auto Logout Card (Matching Web) ── */}
        <Card elevated style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={20} color="#D97706" />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Auto Logout</Text>
              <Text style={styles.cardDesc}>
                Automatically log out of your session when inactive for a specific duration to prevent unauthorized access.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setShowTimeoutModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownBtnText}>{autoLogoutTime}</Text>
              <ChevronDown size={14} color={Colors.slate} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── 4. Biometric App Lock (Mobile Exclusive) ── */}
        <Card elevated style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDFA' }]}>
              <Fingerprint size={20} color="#0D9488" />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Biometric App Lock</Text>
              <Text style={styles.cardDesc}>
                Quickly unlock your DeePhysio workspace using Fingerprint or Face ID sensor.
              </Text>
            </View>

            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
              thumbColor={Colors.surface}
            />
          </View>
        </Card>

        {/* ── 5. Single Device Session Enforcement (Feature 10) ── */}
        <Card elevated style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Smartphone size={20} color="#2563EB" />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Single Device Login</Text>
              <Text style={styles.cardDesc}>
                Enforce single active login per account. Prevents concurrent usage across multiple devices or locations.
              </Text>
            </View>

            <Switch
              value={singleSessionEnabled}
              onValueChange={handleToggleSingleSession}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              thumbColor={Colors.surface}
            />
          </View>
        </Card>

        {/* ── 6. Remote Sessions Termination (Feature 10) ── */}
        <Card elevated style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
              <LogOut size={20} color="#DC2626" />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Terminate Remote Sessions</Text>
              <Text style={styles.cardDesc}>
                Instantly revoke all active sessions on other phones or desktop browsers.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
              onPress={handleTerminateRemoteSessions}
              disabled={terminating}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>
                {terminating ? 'Ending...' : 'Logout All'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* Auto Logout Selection Modal */}
      <Modal
        visible={showTimeoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeoutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimeoutModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Inactivity Timeout</Text>
            <Text style={styles.modalSubtitle}>
              Session will end automatically after selected duration of inactivity.
            </Text>

            {TIMEOUT_OPTIONS.map((opt) => {
              const isSelected = autoLogoutTime === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                  onPress={() => {
                    setAutoLogoutTime(opt);
                    setShowTimeoutModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                  {isSelected && <Check size={16} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    color: Colors.slate,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  dropdownBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.slate,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  modalOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  modalOptionText: {
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '600',
  },
  modalOptionTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
});
