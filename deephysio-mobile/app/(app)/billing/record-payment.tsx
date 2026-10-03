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
import { CreditCard, User, Check, Plus, Receipt } from 'lucide-react-native';
import { billingApi } from '../../../src/api/billing.api';
import { patientApi } from '../../../src/api/patient.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import Card from '../../../src/components/common/Card';
import Colors from '../../../src/constants/colors';
import { PaymentMethod } from '../../../src/types/billing.types';

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Card', 'UPI', 'Online', 'Bank Transfer'];

export default function RecordPaymentScreen() {
  const { invoiceId, patientId: prefilledPatientId, amount: prefilledAmount } = useLocalSearchParams<{
    invoiceId?: string;
    patientId?: string;
    amount?: string;
  }>();

  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(() => {
    return prefilledPatientId ? parseInt(String(prefilledPatientId), 10) : null;
  });
  const [amount, setAmount] = useState(prefilledAmount ? String(prefilledAmount) : '');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Queries
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientApi.getAll(),
  });

  const { data: invoiceDetail } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => billingApi.getInvoiceById(invoiceId!),
    enabled: !!invoiceId,
  });

  // Auto-sync prefilled params or invoice details
  useEffect(() => {
    if (prefilledPatientId) {
      const pid = parseInt(String(prefilledPatientId), 10);
      if (!isNaN(pid) && pid > 0) setSelectedPatientId(pid);
    }
    if (prefilledAmount && (!amount || amount === '')) {
      setAmount(String(prefilledAmount));
    }
  }, [prefilledPatientId, prefilledAmount]);

  useEffect(() => {
    if (invoiceDetail) {
      const pid = Number(invoiceDetail.patient_id || (invoiceDetail as any).patientId || invoiceDetail.patient?.id);
      if (!isNaN(pid) && pid > 0 && !selectedPatientId) {
        setSelectedPatientId(pid);
      }
      if (invoiceDetail.total && (!amount || amount === '')) {
        setAmount(String(invoiceDetail.total));
      }
    }
  }, [invoiceDetail]);

  const selectedPatient =
    patients.find((p) => Number(p.id) === Number(selectedPatientId)) ||
    (invoiceDetail?.patient && Number(invoiceDetail.patient.id || invoiceDetail.patient_id) === Number(selectedPatientId)
      ? invoiceDetail.patient
      : undefined);

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      setErrorMessage('Please select a patient.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await billingApi.createPayment({
        patientId: selectedPatientId,
        invoiceId: invoiceId || undefined,
        amount: numAmount,
        date: new Date().toISOString(),
        method,
        description: description.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });

      Alert.alert('Payment Recorded', 'Payment receipt generated and ledger updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Record Payment" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* 1. Patient Selection Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>1. Select Patient *</Text>
          <TouchableOpacity
            style={styles.addPatientMiniBtn}
            onPress={() => router.push('/(app)/patients/create')}
            activeOpacity={0.7}
          >
            <Plus size={13} color={Colors.primary} />
            <Text style={styles.addPatientMiniBtnText}>New Patient</Text>
          </TouchableOpacity>
        </View>

        {selectedPatient && (
          <View style={styles.selectedBanner}>
            <View style={styles.selectedBannerIcon}>
              <Check size={14} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedBannerTitle}>
                {`${selectedPatient.first_name || selectedPatient.firstName || ''} ${selectedPatient.last_name || selectedPatient.lastName || ''}`.trim()}
              </Text>
              <Text style={styles.selectedBannerSub}>
                ID #{selectedPatient.id} • {selectedPatient.phone || 'No phone'}
              </Text>
            </View>
          </View>
        )}

        {loadingPatients ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading patients...</Text>
          </View>
        ) : patients.length === 0 ? (
          <Card style={styles.noPatientCard}>
            <User size={24} color={Colors.slate} />
            <Text style={styles.noPatientText}>No patients registered in clinic yet.</Text>
            <Button
              title="+ Register Patient"
              size="sm"
              onPress={() => router.push('/(app)/patients/create')}
              style={{ marginTop: 8 }}
            />
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {patients.map((p) => {
              const isSelected = selectedPatientId === p.id;
              const name = `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || 'Patient';
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.selectCard, isSelected && styles.selectCardActive]}
                  onPress={() => {
                    setSelectedPatientId(p.id);
                    setErrorMessage('');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatarCircle, isSelected && styles.avatarCircleActive]}>
                    <User size={14} color={isSelected ? '#FFFFFF' : Colors.primary} />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={[styles.selectCardTitle, isSelected && styles.selectCardTitleActive]} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={styles.selectCardSub} numberOfLines={1}>
                      {p.phone || `ID: #${p.id}`}
                    </Text>
                  </View>
                  {isSelected && <Check size={14} color={Colors.primary} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* 2. Payment Details Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>2. Payment Information</Text>

          <Input
            label="Payment Amount (₹)"
            placeholder="e.g. 800"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            leftIcon={<Text style={styles.currencyPrefix}>₹</Text>}
            required
          />

          {/* Payment Method Selector */}
          <Text style={styles.label}>Payment Method *</Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodChip, method === m && styles.methodChipActive]}
                onPress={() => setMethod(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Receipt / Reference Notes (Optional)"
            placeholder="Transaction ID / Cash receipt number..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </Card>

        <Button
          title="Record Payment Receipt"
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
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  addPatientMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  addPatientMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  selectedBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  selectedBannerSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    fontWeight: '500',
  },
  loadingWrap: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: Colors.slate,
  },
  noPatientCard: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  noPatientText: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 6,
    textAlign: 'center',
  },
  horizontalList: {
    gap: 8,
    paddingBottom: 12,
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
    minWidth: 150,
    maxWidth: 220,
  },
  selectCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleActive: {
    backgroundColor: Colors.primary,
  },
  selectCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
  selectCardTitleActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  selectCardSub: {
    fontSize: 10,
    color: Colors.slate,
    marginTop: 1,
  },
  sectionCard: {
    padding: 16,
    marginTop: 6,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 14,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
    paddingLeft: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  methodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate,
  },
  methodTextActive: {
    color: Colors.surface,
    fontWeight: '800',
  },
  submitBtn: {
    marginTop: 16,
  },
});
