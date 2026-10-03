import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileSpreadsheet, Calendar, ChevronRight } from 'lucide-react-native';
import { Invoice } from '../../types/billing.types';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import Colors from '../../constants/colors';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onPress }) => {
  const patientName = invoice.patient
    ? `${invoice.patient.first_name || invoice.patient.firstName || ''} ${invoice.patient.last_name || invoice.patient.lastName || ''}`.trim() || 'Patient'
    : 'Patient';

  return (
    <Card onPress={onPress} elevated style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.invoiceNumberBadge}>
          <FileSpreadsheet size={14} color={Colors.primaryDark} />
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
        </View>

        <StatusBadge status={invoice.status} type="invoice" size="sm" />
      </View>

      <View style={styles.mainRow}>
        <View style={styles.patientContainer}>
          <Text style={styles.patientName}>{patientName}</Text>
          <View style={styles.dateRow}>
            <Calendar size={12} color={Colors.slate} />
            <Text style={styles.dateText}>{formatDate(invoice.date)}</Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.totalAmount}>{formatCurrency(invoice.total)}</Text>
          <Text style={styles.itemsCount}>
            {invoice.items?.length || 0} {invoice.items?.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoiceNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 5,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientContainer: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.slate,
    marginLeft: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  itemsCount: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
});

export default InvoiceCard;
