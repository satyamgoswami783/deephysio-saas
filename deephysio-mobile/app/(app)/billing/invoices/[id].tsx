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
import {
  FileSpreadsheet,
  User,
  Calendar,
  CreditCard,
  Trash2,
  Receipt,
  Plus,
} from 'lucide-react-native';
import { billingApi } from '../../../../src/api/billing.api';
import { usePermissions } from '../../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../../src/components/common/ScreenWrapper';
import Header from '../../../../src/components/common/Header';
import Card from '../../../../src/components/common/Card';
import StatusBadge from '../../../../src/components/common/StatusBadge';
import Button from '../../../../src/components/common/Button';
import ConfirmationModal from '../../../../src/components/common/ConfirmationModal';
import LoadingState from '../../../../src/components/common/LoadingState';
import Colors from '../../../../src/constants/colors';
import { formatDate } from '../../../../src/utils/date';
import { formatCurrency } from '../../../../src/utils/currency';
import { InvoiceItem } from '../../../../src/types/billing.types';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = id || '';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: invoice,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => billingApi.getInvoiceById(invoiceId),
    enabled: !!invoiceId,
  });

  const handleDelete = async () => {
    try {
      await billingApi.deleteInvoice(invoiceId);
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      router.back();
    } catch (err: any) {
      Alert.alert('Delete Failed', err.response?.data?.message || err.message);
    }
  };

  if (isLoading || !invoice) {
    return <LoadingState message="Loading invoice..." />;
  }

  const patientName = invoice.patient
    ? `${invoice.patient.first_name || invoice.patient.firstName || ''} ${invoice.patient.last_name || invoice.patient.lastName || ''}`.trim() || 'Patient'
    : 'Patient';

  return (
    <ScreenWrapper>
      <Header
        title={`Invoice ${invoice.invoice_number}`}
        subtitle={formatDate(invoice.date)}
        showBack
        onBackPress={() => router.back()}
        rightElement={
          can('billing.manage') ? (
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
        {/* Status & Amount Hero Card */}
        <Card elevated style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Total Amount</Text>
              <Text style={styles.heroAmount}>{formatCurrency(invoice.total)}</Text>
            </View>
            <StatusBadge status={invoice.status} type="invoice" size="md" />
          </View>
        </Card>

        {/* Patient Details */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Billed To</Text>
          <View style={styles.patientRow}>
            <View style={styles.avatar}>
              <User size={20} color={Colors.primary} />
            </View>
            <View style={styles.patientMeta}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.patientPhone}>{invoice.patient?.phone || 'No phone'}</Text>
            </View>
          </View>
        </Card>

        {/* Line Items Table */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Invoice Items</Text>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item: InvoiceItem, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.service}</Text>
                  <Text style={styles.itemRate}>
                    {item.qty} × {formatCurrency(item.rate)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatCurrency(Number(item.rate) * item.qty)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No line items listed.</Text>
          )}

          {/* Breakdown Totals */}
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>

            {Number(invoice.tax) > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Tax / GST</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(invoice.tax)}</Text>
              </View>
            )}

            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </Card>

        {/* Record Payment shortcut */}
        {can('billing.manage') && invoice.status !== 'PAID' && (
          <Button
            title="Record Payment for this Invoice"
            variant="primary"
            size="lg"
            onPress={() => {
              const pId = invoice.patient_id || (invoice as any).patientId || invoice.patient?.id;
              router.push({
                pathname: '/(app)/billing/record-payment',
                params: {
                  invoiceId: invoice.id,
                  patientId: pId ? String(pId) : '',
                  amount: String(invoice.total || ''),
                },
              });
            }}
            icon={<CreditCard size={18} color={Colors.surface} />}
            style={styles.paymentBtn}
          />
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice record?"
        confirmTitle="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
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
  heroCard: {
    padding: 18,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  patientPhone: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  itemRate: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate,
  },
  breakdownContainer: {
    marginTop: 12,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.slate,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  paymentBtn: {
    marginTop: 8,
  },
});
