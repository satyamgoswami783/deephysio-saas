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
import { FileText, User, Sparkles, Check } from 'lucide-react-native';
import { clinicalNoteApi } from '../../../src/api/clinicalNote.api';
import { patientApi } from '../../../src/api/patient.api';
import { useAuth } from '../../../src/context/AuthContext';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import Card from '../../../src/components/common/Card';
import Colors from '../../../src/constants/colors';

const NOTE_TYPES = ['Initial Assessment', 'Progress Note', 'SOAP Note', 'Discharge Summary'];

export default function CreateNoteScreen() {
  const { patientId: initialPatientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    initialPatientId ? parseInt(initialPatientId, 10) : null
  );
  const [noteType, setNoteType] = useState<string>('SOAP Note');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Finalized'>('Finalized');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Queries
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientApi.getAll(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['note-templates'],
    queryFn: clinicalNoteApi.getTemplates,
  });

  const handleApplyTemplate = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.subjective) setSubjective(parsed.subjective);
      if (parsed.objective) setObjective(parsed.objective);
      if (parsed.assessment) setAssessment(parsed.assessment);
      if (parsed.plan) setPlan(parsed.plan);
    } catch {
      setSubjective(content);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      setErrorMessage('Please select a patient for this clinical note.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await clinicalNoteApi.create({
        patientId: selectedPatientId,
        therapistId: user?.id || 1,
        type: noteType,
        date: new Date().toISOString(),
        status,
        subjective: subjective.trim() || undefined,
        objective: objective.trim() || undefined,
        assessment: assessment.trim() || undefined,
        plan: plan.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      queryClient.invalidateQueries({ queryKey: ['patient-notes', selectedPatientId] });

      Alert.alert('Note Saved', 'Clinical note recorded successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Draft Clinical Note" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* Patient Selector */}
        {!initialPatientId && (
          <>
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
          </>
        )}

        {/* Note Type */}
        <Text style={styles.sectionTitle}>Note Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {NOTE_TYPES.map((t) => {
            const isSelected = noteType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, isSelected && styles.typeChipActive]}
                onPress={() => setNoteType(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Template Quick Loader */}
        {templates.length > 0 && (
          <>
            <View style={styles.templateHeader}>
              <Sparkles size={14} color={Colors.secondaryDark} />
              <Text style={styles.templateHeaderText}>Load Pre-Built Template:</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {templates.map((tpl) => (
                <TouchableOpacity
                  key={tpl.id}
                  style={styles.templateChip}
                  onPress={() => handleApplyTemplate(tpl.content)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.templateChipText}>{tpl.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* SOAP Input Fields */}
        <Card style={styles.soapCard}>
          <Input
            label="[S] Subjective (Chief Complaint & Symptoms)"
            placeholder="Patient states pain is 6/10 in lumbar spine since..."
            value={subjective}
            onChangeText={setSubjective}
            multiline
            numberOfLines={4}
          />

          <Input
            label="[O] Objective (Physical Exam & Tests)"
            placeholder="Active ROM: Flexion 45 deg, palpation tenderness at L4-L5..."
            value={objective}
            onChangeText={setObjective}
            multiline
            numberOfLines={4}
          />

          <Input
            label="[A] Assessment (Clinical Diagnosis)"
            placeholder="Mechanical lower back strain with muscle spasm..."
            value={assessment}
            onChangeText={setAssessment}
            multiline
            numberOfLines={3}
          />

          <Input
            label="[P] Plan of Care & Home Exercises"
            placeholder="Manual therapy 2x/week, core stabilization protocol..."
            value={plan}
            onChangeText={setPlan}
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Status selection */}
        <View style={styles.statusRow}>
          {(['Draft', 'Finalized'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusOption, status === st && styles.statusOptionActive]}
              onPress={() => setStatus(st)}
            >
              <Text style={[styles.statusOptionText, status === st && styles.statusOptionTextActive]}>
                Save as {st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Save Clinical Note"
          onPress={handleSubmit}
          loading={loading}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginTop: 10,
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
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate,
  },
  typeChipTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  templateHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryDark,
  },
  templateChip: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryDark,
  },
  soapCard: {
    padding: 16,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate,
  },
  statusOptionTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 16,
  },
});
