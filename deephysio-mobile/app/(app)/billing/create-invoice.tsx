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
import { Plus, Trash2, User, Receipt, Calculator, Check } from 'lucide-react-native';
import { billingApi } from '../../../src/api/billing.api';
import { patientApi } from '../../../src/api/patient.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import Card from '../../../src/components/common/Card';
import Colors from '../../../src/constants/colors';
import { formatCurrency } from '../../../src/utils/currency';

interface LineItemState {
  service: string;
  rate: string;
  qty: string;
}

export default function CreateInvoiceScreen() {
  const { patientId: prefilledPatientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(() => {
    return prefilledPatientId ? parseInt(String(prefilledPatientId), 10) : null;
  });

  useEffect(() => {
    if (prefilledPatientId) {
      const pid = parseInt(String(prefilledPatientId), 10);
      if (!isNaN(pid) && pid > 0) {
        setSelectedPatientId(pid);
      }
    }
  }, [prefilledPatientId]);

  const [items, setItems] = useState<LineItemState[]>([
    { service: 'Initial Physiotherapy Consultation', rate: '800', qty: '1' },
  ]);
  const [taxPercent, setTaxPercent] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Queries
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientApi.getAll(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services-list'],
    queryFn: billingApi.getServices,
  });

  const handleAddItem = () => {
    setItems([...items, { service: '', rate: '500', qty: '1' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemState, value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSelectPredefinedService = (index: number, srvName: string, srvPrice: number | string) => {
    const updated = [...items];
    updated[index].service = srvName;
    updated[index].rate = String(srvPrice);
    setItems(updated);
  };

  // Computations
  const subtotal = items.reduce((acc, it) => {
    const r = parseFloat(it.rate) || 0;
    const q = parseInt(it.qty, 10) || 1;
    return acc + r * q;
  }, 0);

  const tax = subtotal * ((parseFloat(taxPercent) || 0) / 100);
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      setErrorMessage('Please select a patient.');
      return;
    }

    const validItems = items.filter((it) => it.service.trim() && parseFloat(it.rate) > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one valid line item with service name and rate.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await billingApi.createInvoice({
        patientId: selectedPatientId,
        date: new Date().toISOString(),
        notes: notes.trim() || undefined,
        items: validItems.map((it) => ({
          service: it.service.trim(),
          rate: parseFloat(it.rate) || 0,
          qty: parseInt(it.qty, 10) || 1,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });

      Alert.alert('Invoice Created', 'New invoice successfully generated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to generate invoice.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find((p) => Number(p.id) === Number(selectedPatientId));

  return (
    <ScreenWrapper>
      <Header title="Generate Invoice" showBack onBackPress={() => router.back()} />

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

        {patients.length === 0 ? (
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {patients.map((p) => {
              const isSelected = Number(selectedPatientId) === Number(p.id);
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

        {/* 2. Line Items Builder */}
        <View style={styles.itemsHeaderRow}>
          <Text style={styles.sectionTitle}>2. Line Items *</Text>
          <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem} activeOpacity={0.7}>
            <Plus size={14} color={Colors.primary} />
            <Text style={styles.addItemBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <Card key={index} style={styles.itemCard}>
            <View style={styles.itemCardHeader}>
              <Text style={styles.itemNumber}>Item #{index + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveItem(index)} activeOpacity={0.7}>
                  <Trash2 size={16} color={Colors.danger} />
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Service Description"
              placeholder="e.g. Laser Therapy Session"
              value={item.service}
              onChangeText={(val) => handleItemChange(index, 'service', val)}
            />

            {/* Quick Preset Service chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetChipScroll}>
              {services.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.presetChip}
                  onPress={() => handleSelectPredefinedService(index, s.name, s.price)}
                >
                  <Text style={styles.presetChipText}>{s.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.presetChip, { backgroundColor: Colors.primaryLight, borderColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 3 }]}
                onPress={() => router.push('/(app)/services' as any)}
              >
                <Plus size={11} color={Colors.primaryDark} />
                <Text style={[styles.presetChipText, { color: Colors.primaryDark, fontWeight: '700' }]}>Add Service</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.rateQtyRow}>
              <View style={styles.rateCol}>
                <Input
                  label="Rate (₹)"
                  placeholder="800"
                  value={item.rate}
                  onChangeText={(val) => handleItemChange(index, 'rate', val)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.qtyCol}>
                <Input
                  label="Qty"
                  placeholder="1"
                  value={item.qty}
                  onChangeText={(val) => handleItemChange(index, 'qty', val)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>
        ))}

        {/* 3. Summary & Totals */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </Card>

        <Input
          label="Invoice Notes (Optional)"
          placeholder="Payment due upon receipt..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button
          title={`Generate Invoice (${formatCurrency(total)})`}
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
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
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
    paddingBottom: 10,
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
    minWidth: 140,
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
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  itemCard: {
    padding: 14,
    marginBottom: 12,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate,
  },
  presetChipScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipText: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '600',
  },
  rateQtyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rateCol: {
    flex: 2,
  },
  qtyCol: {
    flex: 1,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.slate,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
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
  submitBtn: {
    marginTop: 10,
  },
});
