import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building, Phone, Mail, MapPin, Clock } from 'lucide-react-native';
import { settingsApi } from '../../../src/api/settings.api';
import { useAuth } from '../../../src/context/AuthContext';
import { usePermissions } from '../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';

export default function ClinicSettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clinicProfile, refreshUser } = useAuth();
  const { isAdmin, isSuperAdmin } = usePermissions();

  const [clinicName, setClinicName] = useState(clinicProfile?.clinicName || 'DeePhysio Healthcare');
  const [phone, setPhone] = useState(clinicProfile?.phone || '+91 9876543210');
  const [email, setEmail] = useState(clinicProfile?.email || 'contact@deephysio.com');
  const [address, setAddress] = useState(clinicProfile?.address || '123 Health Ave, Medical District');
  const [saving, setSaving] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const settings = await settingsApi.getSettings(['clinicProfile']);
      if (settings?.clinicProfile) {
        setClinicName(settings.clinicProfile.clinicName || clinicName);
        setPhone(settings.clinicProfile.phone || phone);
        setEmail(settings.clinicProfile.email || email);
        setAddress(settings.clinicProfile.address || address);
      }
      return settings;
    },
  });

  const handleSave = async () => {
    if (!isAdmin && !isSuperAdmin) {
      Alert.alert('Permission Denied', 'Only administrators can modify clinic configurations.');
      return;
    }

    setSaving(true);
    try {
      await settingsApi.updateSettings({
        clinicProfile: {
          clinicName,
          phone,
          email,
          address,
        },
      });

      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });

      Alert.alert('Settings Saved', 'Clinic configuration updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Clinic Configuration" subtitle="Practice Information & Branding" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Input
            label="Clinic Display Name *"
            value={clinicName}
            onChangeText={setClinicName}
            leftIcon={<Building size={18} color={Colors.slate} />}
            editable={isAdmin || isSuperAdmin}
            required
          />

          <Input
            label="Clinic Contact Phone *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color={Colors.slate} />}
            editable={isAdmin || isSuperAdmin}
            required
          />

          <Input
            label="Official Contact Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={Colors.slate} />}
            editable={isAdmin || isSuperAdmin}
            required
          />

          <Input
            label="Physical Clinic Address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            leftIcon={<MapPin size={18} color={Colors.slate} />}
            editable={isAdmin || isSuperAdmin}
          />

          {(isAdmin || isSuperAdmin) && (
            <Button
              title="Save Clinic Settings"
              onPress={handleSave}
              loading={saving}
              fullWidth
              size="lg"
              style={styles.submitBtn}
            />
          )}
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 18,
  },
  submitBtn: {
    marginTop: 12,
  },
});
