import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react-native';
import { authApi } from '../../../src/api/auth.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import Card from '../../../src/components/common/Card';
import Colors from '../../../src/constants/colors';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      Alert.alert('Password Changed', 'Your account password has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Change Password" subtitle="Security & Credentials" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <Card style={styles.card}>
          <Input
            label="Current Password *"
            placeholder="••••••••"
            value={currentPassword}
            onChangeText={(t) => {
              setCurrentPassword(t);
              setErrorMessage('');
            }}
            secureTextEntry
            leftIcon={<Lock size={18} color={Colors.slate} />}
            required
          />

          <Input
            label="New Password *"
            placeholder="••••••••"
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              setErrorMessage('');
            }}
            secureTextEntry
            leftIcon={<KeyRound size={18} color={Colors.slate} />}
            helper="Must be at least 6 characters."
            required
          />

          <Input
            label="Confirm New Password *"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setErrorMessage('');
            }}
            secureTextEntry
            leftIcon={<ShieldCheck size={18} color={Colors.slate} />}
            required
          />

          <Button
            title="Update Password"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.danger,
  },
  card: {
    padding: 18,
  },
  submitBtn: {
    marginTop: 10,
  },
});
