import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar,
  AlertCircle,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { patientApi } from '../../../src/api/patient.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import Card from '../../../src/components/common/Card';
import DatePickerModal from '../../../src/components/common/DatePickerModal';
import LocationInput from '../../../src/components/common/LocationInput';
import LoadingState from '../../../src/components/common/LoadingState';
import ErrorState from '../../../src/components/common/ErrorState';
import Colors from '../../../src/constants/colors';
import { PatientBehaviour, PatientGender } from '../../../src/types/patient.types';

export default function EditPatientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawId = Array.isArray(id) ? id[0] : id;
  const patientId = parseInt(rawId || '0', 10);
  const isValidPatientId = !isNaN(patientId) && patientId > 0;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<PatientGender>('male');
  const [dob, setDob] = useState('');
  const [displayDob, setDisplayDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [address, setAddress] = useState('');
  const [patientType, setPatientType] = useState('Normal');
  const [behaviour, setBehaviour] = useState<PatientBehaviour>('green');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-detail', patientId],
    queryFn: () => patientApi.getById(patientId),
    enabled: isValidPatientId,
  });

  useEffect(() => {
    if (patient) {
      setFirstName(patient.first_name || patient.firstName || '');
      setLastName(patient.last_name || patient.lastName || '');
      setPhone(patient.phone || '');
      setEmail(patient.email || '');
      setGender((patient.gender as PatientGender) || 'male');
      setAddress(patient.address || '');
      setPatientType(patient.patient_type || patient.patientType || 'Normal');
      setBehaviour((patient.behaviour as PatientBehaviour) || 'green');

      const rawDate = patient.date_of_birth || patient.dob;
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            setDob(format(d, 'yyyy-MM-dd'));
            setDisplayDob(format(d, 'dd/MM/yyyy'));
          }
        } catch {
          // ignore
        }
      }
    }
  }, [patient]);

  const handleDateSelected = (isoDate: string, formatted: string) => {
    setDob(isoDate);
    setDisplayDob(formatted);
  };

  const handleClearDate = () => {
    setDob('');
    setDisplayDob('');
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !phone.trim()) {
      setErrorMessage('First Name and Phone Number are required.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const cleanEmail = email.replace(/\s+/g, '').trim();

      await patientApi.update(patientId, {
        firstName: firstName.trim(),
        first_name: firstName.trim(),
        lastName: lastName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim(),
        email: cleanEmail || undefined,
        gender,
        dateOfBirth: dob || undefined,
        date_of_birth: dob || undefined,
        address: address.trim() || undefined,
        patientType,
        patient_type: patientType,
        behaviour,
      });

      queryClient.invalidateQueries({ queryKey: ['patient-detail', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });

      Alert.alert('Updated', 'Patient details updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update patient.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading patient details..." />;
  }

  if (!patient) {
    return (
      <ScreenWrapper>
        <Header title="Edit Patient Details" showBack onBackPress={() => router.back()} />
        <ErrorState title="Patient Not Found" message="Could not find the requested patient records." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Edit Patient Details" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={Colors.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DEMOGRAPHIC INFORMATION</Text>

          <Input
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            required
          />

          <Input
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          <Input
            label="Primary Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            required
          />

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Gender:</Text>
          <View style={styles.chipRow}>
            {(['male', 'female', 'other'] as PatientGender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => setGender(g)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                  {g.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dedicated Date of Birth Selector */}
          <View style={styles.dobContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Date of Birth</Text>
              <Text style={styles.optionalBadge}> (Calendar Picker)</Text>
            </View>

            <TouchableOpacity
              style={[styles.dobTrigger, !!displayDob && styles.dobTriggerSelected]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Calendar size={18} color={displayDob ? Colors.primary : Colors.slate} />
              <Text style={[styles.dobTriggerText, !displayDob && styles.dobPlaceholder]}>
                {displayDob ? `${displayDob} (${dob})` : 'Tap to select Date of Birth...'}
              </Text>
              {displayDob ? (
                <TouchableOpacity onPress={handleClearDate} style={styles.clearDobBtn} activeOpacity={0.7}>
                  <X size={16} color={Colors.slate} />
                </TouchableOpacity>
              ) : (
                <ChevronRight size={18} color={Colors.slate} />
              )}
            </TouchableOpacity>
          </View>

          {/* Location / Address with dropdown suggestions */}
          <LocationInput
            label="Residential Address"
            placeholder="Type address or select Indore / City from dropdown..."
            value={address}
            onChangeLocation={setAddress}
          />
        </Card>

        {/* Behaviour Flag */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CLASSIFICATION & BEHAVIOUR</Text>
          <Text style={styles.label}>Behaviour Flag:</Text>
          <View style={styles.chipRow}>
            {[
              { label: 'Green Flag', val: 'green', color: Colors.flagGreen },
              { label: 'Yellow Flag', val: 'yellow', color: Colors.flagYellow },
              { label: 'Red Flag', val: 'red', color: Colors.flagRed },
            ].map((f) => (
              <TouchableOpacity
                key={f.val}
                style={[
                  styles.chip,
                  behaviour === f.val && { backgroundColor: f.color, borderColor: f.color },
                ]}
                onPress={() => setBehaviour(f.val as PatientBehaviour)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    behaviour === f.val && { color: Colors.surface, fontWeight: '700' },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={handleDateSelected}
        initialDate={dob || undefined}
        title="Edit Date of Birth"
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 6,
  },
  optionalBadge: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dobContainer: {
    marginBottom: 16,
  },
  dobTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  dobTriggerSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDFA',
  },
  dobTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
  },
  dobPlaceholder: {
    color: Colors.slate,
    fontWeight: '400',
  },
  clearDobBtn: {
    padding: 4,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
});
