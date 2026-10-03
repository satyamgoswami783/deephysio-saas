import React, { useState } from 'react';
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
import { User, Check } from 'lucide-react-native';
import { formsApi } from '../../../src/api/forms.api';
import { patientApi } from '../../../src/api/patient.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import Card from '../../../src/components/common/Card';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';

export default function FillFormScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const id = parseInt(templateId || '0', 10);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Queries
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['form-templates'],
    queryFn: formsApi.getTemplates,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientApi.getAll(),
  });

  const currentTemplate = templates.find((t) => t.id === id);

  let fields: Array<{ name: string; label: string; type?: string }> = [];
  if (currentTemplate?.fields) {
    try {
      const parsed = JSON.parse(currentTemplate.fields);
      fields = Array.isArray(parsed) ? parsed : [];
    } catch {
      fields = [{ name: 'notes', label: 'Form Content', type: 'textarea' }];
    }
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      Alert.alert('Validation', 'Please select a patient.');
      return;
    }

    setSubmitting(true);
    try {
      await formsApi.createSubmission({
        patientId: selectedPatientId,
        formTemplateId: id,
        responses: formData,
      });

      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      Alert.alert('Form Submitted', 'Responses recorded successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Submission Error', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTemplates || !currentTemplate) {
    return <LoadingState message="Loading form template..." />;
  }

  return (
    <ScreenWrapper>
      <Header
        title={currentTemplate.name}
        subtitle={currentTemplate.category || 'Intake Form'}
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* 1. Patient Selector */}
        <Text style={styles.sectionTitle}>1. Select Patient *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {patients.map((p) => {
            const isSelected = selectedPatientId === p.id;
            const name = `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || 'Patient';
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.selectCard, isSelected && styles.selectCardActive]}
                onPress={() => setSelectedPatientId(p.id)}
                activeOpacity={0.7}
              >
                <User size={16} color={isSelected ? Colors.primary : Colors.slate} />
                <Text style={[styles.selectCardTitle, isSelected && styles.selectCardTitleActive]}>{name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. Dynamic Questions */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>2. Responses</Text>
          {fields.length === 0 ? (
            <Input
              label="Form Notes"
              placeholder="Enter details..."
              value={formData.notes || ''}
              onChangeText={(val) => handleFieldChange('notes', val)}
              multiline
              numberOfLines={4}
            />
          ) : (
            fields.map((f, idx) => (
              <Input
                key={idx}
                label={f.label || f.name}
                placeholder={`Enter ${f.label || f.name}...`}
                value={formData[f.name] || ''}
                onChangeText={(val) => handleFieldChange(f.name, val)}
                multiline={f.type === 'textarea'}
                numberOfLines={f.type === 'textarea' ? 3 : 1}
              />
            ))
          )}
        </Card>

        <Button
          title="Submit Form"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginTop: 8,
    marginBottom: 8,
  },
  horizontalList: {
    gap: 8,
    paddingBottom: 10,
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  selectCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  selectCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },
  selectCardTitleActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  formCard: {
    padding: 16,
    marginTop: 8,
  },
  submitBtn: {
    marginTop: 16,
  },
});
