import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  HeartPulse,
  FileText,
  CheckSquare,
  FolderOpen,
  Receipt,
  Edit3,
  Trash2,
  Plus,
  PlusCircle,
  Clock,
  Shield,
} from 'lucide-react-native';
import { patientApi } from '../../../src/api/patient.api';
import { clinicalNoteApi } from '../../../src/api/clinicalNote.api';
import { billingApi } from '../../../src/api/billing.api';
import { usePermissions } from '../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Button from '../../../src/components/common/Button';
import Badge from '../../../src/components/common/Badge';
import StatusBadge from '../../../src/components/common/StatusBadge';
import Input from '../../../src/components/common/Input';
import ConfirmationModal from '../../../src/components/common/ConfirmationModal';
import LoadingState from '../../../src/components/common/LoadingState';
import EmptyState from '../../../src/components/common/EmptyState';
import ErrorState from '../../../src/components/common/ErrorState';
import Colors from '../../../src/constants/colors';
import { formatDate } from '../../../src/utils/date';
import { formatCurrency } from '../../../src/utils/currency';

type ProfileTab = 'overview' | 'history' | 'notes' | 'tasks' | 'files' | 'billing';

export default function PatientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const rawId = Array.isArray(id) ? id[0] : id;
  const patientId = parseInt(rawId || '0', 10);
  const isValidPatientId = !isNaN(patientId) && patientId > 0;
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit Medical History state
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [existingConditions, setExistingConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [surgeries, setSurgeries] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);

  // New Task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Queries
  const {
    data: patient,
    isLoading: loadingPatient,
    error: patientError,
    refetch: refetchPatient,
  } = useQuery({
    queryKey: ['patient-detail', patientId],
    queryFn: () => patientApi.getById(patientId),
    enabled: isValidPatientId,
  });

  const { data: medicalHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: async () => {
      const data = await patientApi.getMedicalHistory(patientId);
      if (data) {
        setExistingConditions(data.existing_conditions || data.existingConditions || '');
        setAllergies(data.allergies || '');
        setChronicDiseases(data.chronic_diseases || data.chronicDiseases || '');
        setSurgeries(data.surgeries || '');
      }
      return data;
    },
    enabled: isValidPatientId,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: () => clinicalNoteApi.getAll({ patientId }),
    enabled: isValidPatientId && activeTab === 'notes',
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['patient-tasks', patientId],
    queryFn: () => patientApi.getTasks(patientId),
    enabled: isValidPatientId && activeTab === 'tasks',
  });

  const { data: files = [] } = useQuery({
    queryKey: ['patient-files', patientId],
    queryFn: () => patientApi.getFiles(patientId),
    enabled: isValidPatientId && activeTab === 'files',
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['patient-invoices', patientId],
    queryFn: () => billingApi.getInvoices({ patientId }),
    enabled: isValidPatientId && activeTab === 'billing',
  });

  const handleSaveMedicalHistory = async () => {
    setSavingHistory(true);
    try {
      await patientApi.upsertMedicalHistory(patientId, {
        existing_conditions: existingConditions,
        allergies,
        chronic_diseases: chronicDiseases,
        surgeries,
      });
      setIsEditingHistory(false);
      refetchHistory();
      Alert.alert('Saved', 'Medical history updated successfully.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || err.message);
    } finally {
      setSavingHistory(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await patientApi.createTask({
        patientId,
        title: newTaskTitle.trim(),
      });
      setNewTaskTitle('');
      setAddingTask(false);
      refetchTasks();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await patientApi.updateTaskStatus(taskId, nextStatus);
      refetchTasks();
    } catch (err) {
      console.warn('Toggle task failed', err);
    }
  };

  const handleDeletePatient = async () => {
    try {
      await patientApi.delete(patientId);
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });
      router.back();
    } catch (err: any) {
      Alert.alert('Delete Failed', err.response?.data?.message || err.message);
    }
  };

  if (!isValidPatientId) {
    return (
      <ScreenWrapper>
        <Header title="Patient Profile" showBack onBackPress={() => router.back()} />
        <ErrorState
          title="Invalid Patient"
          message="No valid patient ID was provided."
          onRetry={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  if (loadingPatient) {
    return <LoadingState message="Loading patient profile..." />;
  }

  if (patientError || !patient) {
    return (
      <ScreenWrapper>
        <Header title="Patient Profile" showBack onBackPress={() => router.back()} />
        <ErrorState
          title="Patient Not Found"
          message="Could not load patient details from server."
          onRetry={() => refetchPatient()}
        />
      </ScreenWrapper>
    );
  }

  const fullName = `${patient.first_name || patient.firstName || ''} ${patient.last_name || patient.lastName || ''}`.trim() || 'Patient';
  const behaviour = patient.behaviour || 'green';

  return (
    <ScreenWrapper>
      <Header
        title="Patient Profile"
        subtitle={`ID: #${patient.id}`}
        showBack
        onBackPress={() => router.back()}
        rightElement={
          can('patient.delete') ? (
            <TouchableOpacity
              style={styles.deleteHeaderBtn}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={Colors.danger} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Patient Profile Card */}
        <Card elevated style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color={Colors.primary} />
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.patientName}>{fullName}</Text>
              <View style={styles.badgeRow}>
                <StatusBadge status={behaviour} type="behaviour" size="sm" />
                {patient.patient_type && (
                  <Badge label={patient.patient_type} variant="neutral" size="sm" />
                )}
              </View>
            </View>
            {can('patient.write') && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push(`/(app)/patients/edit?id=${patient.id}`)}
                activeOpacity={0.7}
              >
                <Edit3 size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Details Bar */}
          <View style={styles.quickDetailsGrid}>
            <View style={styles.quickDetailItem}>
              <Phone size={14} color={Colors.slate} />
              <Text style={styles.quickDetailText}>{patient.phone || 'N/A'}</Text>
            </View>
            {patient.email && (
              <View style={styles.quickDetailItem}>
                <Mail size={14} color={Colors.slate} />
                <Text style={styles.quickDetailText}>{patient.email}</Text>
              </View>
            )}
            {(patient.date_of_birth || patient.dob) && (
              <View style={styles.quickDetailItem}>
                <Calendar size={14} color={Colors.slate} />
                <Text style={styles.quickDetailText}>
                  DOB: {formatDate(patient.date_of_birth || patient.dob, 'dd/MM/yyyy')}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Book Appointment Action Button */}
          {can('appointments.manage') && (
            <TouchableOpacity
              style={styles.profileBookBtn}
              onPress={() =>
                router.push({
                  pathname: '/(app)/appointments/book',
                  params: { patientId: String(patient.id) },
                })
              }
              activeOpacity={0.8}
            >
              <Calendar size={16} color="#FFF" />
              <Text style={styles.profileBookBtnText}>Book Appointment for {patient.first_name || 'Patient'}</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Tab Navigator */}
        <View style={styles.tabScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'history', label: 'Medical History' },
              { key: 'notes', label: 'SOAP Notes' },
              { key: 'tasks', label: 'Tasks' },
              { key: 'files', label: 'Documents' },
              { key: 'billing', label: 'Invoices' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key as ProfileTab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabChipText, activeTab === tab.key && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Demographics & Address</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender:</Text>
                <Text style={styles.detailValue}>{patient.gender ? patient.gender.toUpperCase() : 'Not Specified'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{patient.address || 'No address logged'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registered:</Text>
                <Text style={styles.detailValue}>{formatDate(patient.created_at)}</Text>
              </View>
            </Card>

            {/* Emergency Contacts */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Emergency Contacts</Text>
              {patient.emergency_contacts && patient.emergency_contacts.length > 0 ? (
                patient.emergency_contacts.map((contact, idx) => (
                  <View key={idx} style={styles.emergencyContactItem}>
                    <Text style={styles.contactName}>{contact.name} ({contact.relation || 'Contact'})</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubtitle}>No emergency contacts provided.</Text>
              )}
            </Card>
          </View>
        )}

        {/* TAB 2: MEDICAL HISTORY */}
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeaderFlex}>
                <Text style={styles.sectionCardTitle}>Clinical Medical History</Text>
                {can('patient.write') && !isEditingHistory && (
                  <Button
                    title="Edit"
                    size="sm"
                    variant="outline"
                    onPress={() => setIsEditingHistory(true)}
                  />
                )}
              </View>

              {isEditingHistory ? (
                <View style={styles.editHistoryForm}>
                  <Input
                    label="Existing Conditions"
                    placeholder="e.g. Hypertension, Diabetes..."
                    value={existingConditions}
                    onChangeText={setExistingConditions}
                    multiline
                  />
                  <Input
                    label="Allergies"
                    placeholder="e.g. Penicillin, Latex..."
                    value={allergies}
                    onChangeText={setAllergies}
                    multiline
                  />
                  <Input
                    label="Chronic Diseases"
                    placeholder="e.g. Asthma, Arthritis..."
                    value={chronicDiseases}
                    onChangeText={setChronicDiseases}
                    multiline
                  />
                  <Input
                    label="Surgeries & Past Procedures"
                    placeholder="e.g. ACL Reconstruction (2022)..."
                    value={surgeries}
                    onChangeText={setSurgeries}
                    multiline
                  />

                  <View style={styles.btnRow}>
                    <Button
                      title="Cancel"
                      variant="ghost"
                      onPress={() => setIsEditingHistory(false)}
                      style={styles.flexBtn}
                    />
                    <Button
                      title="Save History"
                      variant="primary"
                      loading={savingHistory}
                      onPress={handleSaveMedicalHistory}
                      style={styles.flexBtn}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.historyList}>
                  <View style={styles.historyBlock}>
                    <Text style={styles.historyLabel}>Existing Conditions</Text>
                    <Text style={styles.historyValue}>
                      {existingConditions || 'None reported'}
                    </Text>
                  </View>

                  <View style={styles.historyBlock}>
                    <Text style={styles.historyLabel}>Allergies</Text>
                    <Text style={[styles.historyValue, allergies ? { color: Colors.danger } : undefined]}>
                      {allergies || 'No known allergies'}
                    </Text>
                  </View>

                  <View style={styles.historyBlock}>
                    <Text style={styles.historyLabel}>Chronic Diseases</Text>
                    <Text style={styles.historyValue}>
                      {chronicDiseases || 'None reported'}
                    </Text>
                  </View>

                  <View style={styles.historyBlock}>
                    <Text style={styles.historyLabel}>Past Surgeries / Procedures</Text>
                    <Text style={styles.historyValue}>
                      {surgeries || 'None reported'}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* TAB 3: SOAP NOTES */}
        {activeTab === 'notes' && (
          <View style={styles.tabContent}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.sectionTitle}>SOAP Records ({notes.length})</Text>
              {can('notes.manage') && (
                <Button
                  title="Add Note"
                  size="sm"
                  variant="primary"
                  onPress={() => router.push(`/(app)/notes/create?patientId=${patient.id}`)}
                  icon={<Plus size={14} color={Colors.surface} />}
                />
              )}
            </View>

            {notes.length === 0 ? (
              <EmptyState
                title="No Clinical Notes Yet"
                description="Draft an Initial Assessment or SOAP Progress note."
                actionTitle={can('notes.manage') ? 'Create Note' : undefined}
                onActionPress={() => router.push(`/(app)/notes/create?patientId=${patient.id}`)}
              />
            ) : (
              notes.map((n) => (
                <Card
                  key={n.id}
                  style={styles.noteItemCard}
                  onPress={() => router.push(`/(app)/notes/${n.id}`)}
                >
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteType}>{n.type}</Text>
                    <Badge label={n.status} variant={n.status === 'Locked' ? 'success' : 'warning'} size="sm" />
                  </View>
                  <Text style={styles.noteDate}>{formatDate(n.date)}</Text>
                  {n.subjective ? (
                    <Text style={styles.notePreview} numberOfLines={2}>
                      S: {n.subjective}
                    </Text>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        )}

        {/* TAB 4: TASKS */}
        {activeTab === 'tasks' && (
          <View style={styles.tabContent}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.sectionTitle}>Patient Action Items</Text>
              <Button
                title="Add Task"
                size="sm"
                variant="outline"
                onPress={() => setAddingTask(true)}
              />
            </View>

            {addingTask && (
              <Card style={styles.addTaskCard}>
                <Input
                  label="Task / Action Item"
                  placeholder="e.g. Call for MRI follow-up..."
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                />
                <View style={styles.btnRow}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => setAddingTask(false)}
                    style={styles.flexBtn}
                  />
                  <Button
                    title="Add"
                    variant="primary"
                    size="sm"
                    onPress={handleAddTask}
                    style={styles.flexBtn}
                  />
                </View>
              </Card>
            )}

            {tasks.length === 0 ? (
              <EmptyState
                title="No Tasks Logged"
                description="Create patient-specific reminders or follow-up items."
              />
            ) : (
              tasks.map((t) => {
                const isDone = t.status === 'completed';
                return (
                  <Card key={t.id} style={styles.taskCard}>
                    <TouchableOpacity
                      style={styles.taskRow}
                      onPress={() => handleToggleTask(t.id, t.status)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                        {isDone && <CheckSquare size={16} color={Colors.surface} />}
                      </View>
                      <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                        {t.title}
                      </Text>
                    </TouchableOpacity>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* TAB 5: FILES */}
        {activeTab === 'files' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Documents & Attachments ({files.length})</Text>
            {files.length === 0 ? (
              <EmptyState
                title="No Uploaded Documents"
                description="Medical scans, referral letters, and reports will appear here."
              />
            ) : (
              files.map((f) => (
                <Card key={f.id} style={styles.fileCard}>
                  <FolderOpen size={20} color={Colors.primary} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{f.file_name}</Text>
                    <Text style={styles.fileDate}>{formatDate(f.created_at)}</Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* TAB 6: INVOICES */}
        {activeTab === 'billing' && (
          <View style={styles.tabContent}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.sectionTitle}>Invoices ({invoices.length})</Text>
              {can('billing.manage') && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    title="Record Payment"
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/billing/record-payment',
                        params: { patientId: String(patient.id) },
                      })
                    }
                  />
                  <Button
                    title="New Invoice"
                    size="sm"
                    variant="primary"
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/billing/create-invoice',
                        params: { patientId: String(patient.id) },
                      })
                    }
                  />
                </View>
              )}
            </View>

            {invoices.length === 0 ? (
              <EmptyState
                title="No Invoices"
                description="No financial ledger items recorded for this patient."
              />
            ) : (
              invoices.map((inv) => (
                <Card
                  key={inv.id}
                  style={styles.invoiceItemCard}
                  onPress={() => router.push(`/(app)/billing/invoices/${inv.id}`)}
                >
                  <View style={styles.invoiceHeader}>
                    <Text style={styles.invoiceNum}>{inv.invoice_number}</Text>
                    <StatusBadge status={inv.status} type="invoice" size="sm" />
                  </View>
                  <View style={styles.invoiceAmountRow}>
                    <Text style={styles.invoiceDate}>{formatDate(inv.date)}</Text>
                    <Text style={styles.invoiceAmount}>{formatCurrency(inv.total)}</Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Patient"
        message={`Are you sure you want to delete ${fullName}? Historical logs will be preserved.`}
        confirmTitle="Delete"
        confirmVariant="danger"
        onConfirm={handleDeletePatient}
        onCancel={() => setShowDeleteModal(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  deleteHeaderBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dangerLight,
  },
  profileCard: {
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  quickDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  quickDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickDetailText: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '500',
  },
  tabScrollContainer: {
    marginBottom: 16,
  },
  tabRow: {
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate,
  },
  tabChipTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  tabContent: {
    gap: 12,
  },
  sectionCard: {
    padding: 16,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.slate,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '600',
  },
  emergencyContactItem: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
  contactPhone: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.slate,
    fontStyle: 'italic',
  },
  cardHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editHistoryForm: {
    gap: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
  historyList: {
    gap: 12,
  },
  historyBlock: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 10,
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  historyValue: {
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  noteItemCard: {
    padding: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteType: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.slate,
    marginBottom: 6,
  },
  notePreview: {
    fontSize: 13,
    color: Colors.slate,
    lineHeight: 18,
  },
  addTaskCard: {
    padding: 14,
  },
  taskCard: {
    padding: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.slate,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.slate,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  fileDate: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  invoiceItemCard: {
    padding: 14,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  invoiceNum: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  invoiceAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDate: {
    fontSize: 12,
    color: Colors.slate,
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  profileBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  profileBookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
