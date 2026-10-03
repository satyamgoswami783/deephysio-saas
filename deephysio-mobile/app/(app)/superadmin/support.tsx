import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Ticket,
  Headphones,
  RotateCcw,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Building,
  Eye,
  Plus,
} from 'lucide-react-native';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Card from '../../../src/components/common/Card';
import Badge from '../../../src/components/common/Badge';
import Button from '../../../src/components/common/Button';
import EmptyState from '../../../src/components/common/EmptyState';
import Colors from '../../../src/constants/colors';
import { supportApi, SupportTicket } from '../../../src/api/support.api';
import { formatDate } from '../../../src/utils/date';
import { usePermissions } from '../../../src/hooks/usePermissions';

export default function SuperAdminSupportScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = usePermissions();

  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['support-tickets-list', isSuperAdmin],
    queryFn: () => supportApi.getTickets(isSuperAdmin),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, msg }: { id: number; msg: string }) => supportApi.replyTicket(id, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets-list'] });
      setReplyMessage('');
      Alert.alert('Success', 'Reply sent to clinic owner.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to send reply');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { subject: string; message: string; priority: string }) =>
      supportApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets-list'] });
      setShowCreateModal(false);
      setNewSubject('');
      setNewMessage('');
      Alert.alert('Success', 'Support ticket opened successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to create ticket');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      supportApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets-list'] });
      if (selectedTicket) {
        setSelectedTicket(null);
      }
      Alert.alert('Updated', 'Ticket status updated.');
    },
  });

  // Calculate top 4 metrics
  const totalTickets = tickets.length;
  const openCount = tickets.filter((t) => (t.status || '').toLowerCase() === 'open').length;
  const repliedCount = tickets.filter((t) => (t.status || '').toLowerCase() === 'replied').length;
  const closedCount = tickets.filter(
    (t) => (t.status || '').toLowerCase() === 'resolved' || (t.status || '').toLowerCase() === 'closed'
  ).length;

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'All' && (t.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (priorityFilter !== 'All' && (t.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || 'open').toLowerCase();
    if (s === 'resolved' || s === 'closed') {
      return <Badge label="Closed" variant="success" size="sm" dot />;
    }
    if (s === 'replied') {
      return <Badge label="Replied" variant="secondary" size="sm" dot />;
    }
    return <Badge label="Open" variant="warning" size="sm" dot />;
  };

  const getPriorityBadge = (priority: string) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'urgent' || p === 'high') {
      return <Badge label={priority || 'High'} variant="danger" size="sm" />;
    }
    if (p === 'low') {
      return <Badge label={priority || 'Low'} variant="primary" size="sm" />;
    }
    return <Badge label={priority || 'Medium'} variant="neutral" size="sm" />;
  };

  return (
    <ScreenWrapper>
      {/* Header matching Website */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Support Tickets</Text>
          <Text style={styles.headerSubtitle}>Manage all clinic owner support requests</Text>
        </View>
        {!isSuperAdmin && (
          <TouchableOpacity
            style={styles.newTicketBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.topContainer}>
            {/* Top 4 Stat Cards matching Website */}
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statVal, { color: '#F97316' }]}>{totalTickets}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statVal, { color: '#2563EB' }]}>{openCount}</Text>
                <Text style={styles.statLabel}>Open</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statVal, { color: '#9333EA' }]}>{repliedCount}</Text>
                <Text style={styles.statLabel}>Replied</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statVal, { color: '#10B981' }]}>{closedCount}</Text>
                <Text style={styles.statLabel}>Closed</Text>
              </View>
            </View>

            {/* Filter Bar matching Website */}
            <View style={styles.filterCard}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.chipRow}>
                  {['All', 'Open', 'Replied', 'Closed'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, statusFilter === s && styles.chipActive]}
                      onPress={() => setStatusFilter(s)}
                    >
                      <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Priority</Text>
                <View style={styles.chipRow}>
                  {['All', 'Low', 'Medium', 'High'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chip, priorityFilter === p && styles.chipActive]}
                      onPress={() => setPriorityFilter(p)}
                    >
                      <Text style={[styles.chipText, priorityFilter === p && styles.chipTextActive]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterActionRow}>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => {
                    setStatusFilter('All');
                    setPriorityFilter('All');
                  }}
                >
                  <RotateCcw size={12} color="#F97316" />
                  <Text style={styles.resetBtnText}>Reset Filters</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
                  <RefreshCw size={12} color={Colors.slate} />
                  <Text style={styles.refreshBtnText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Headphones size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tickets found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.ticketCard}>
            <View style={styles.ticketTop}>
              <View style={styles.ticketIdBadge}>
                <Text style={styles.ticketIdText}>#{item.id}</Text>
              </View>
              <View style={styles.ticketMain}>
                <Text style={styles.ticketSubject}>{item.subject}</Text>
                <Text style={styles.ticketClinic}>
                  {item.tenant_name || 'DeePhysio Clinic'} · {item.user_name || 'Admin'}
                </Text>
              </View>
              <View style={styles.statusCol}>
                {getStatusBadge(item.status)}
              </View>
            </View>

            {item.message ? (
              <Text style={styles.ticketMessage} numberOfLines={2}>
                {item.message}
              </Text>
            ) : null}

            <View style={styles.ticketFooter}>
              <View style={styles.footerLeft}>
                {getPriorityBadge(item.priority)}
                <View style={styles.dateRow}>
                  <Clock size={11} color={Colors.slate} />
                  <Text style={styles.dateText}>{formatDate(item.created_at, 'dd MMM yyyy')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewActionBtn}
                onPress={() => setSelectedTicket(item)}
                activeOpacity={0.7}
              >
                <Eye size={14} color="#2563EB" />
                <Text style={styles.viewActionText}>Open Ticket</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      {/* TICKET DETAILS & REPLY MODAL */}
      {selectedTicket && (
        <Modal
          visible={!!selectedTicket}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSubject}>{selectedTicket.subject}</Text>
                  <Text style={styles.modalMeta}>
                    Ticket #{selectedTicket.id} · {selectedTicket.tenant_name || 'Clinic'} · {formatDate(selectedTicket.created_at, 'dd MMM yyyy')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <X size={20} color={Colors.slate} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalMessageLabel}>Initial Issue Description:</Text>
                <View style={styles.modalMessageBox}>
                  <Text style={styles.modalMessageText}>{selectedTicket.message || 'No message provided'}</Text>
                </View>

                {isSuperAdmin && (
                  <View style={styles.statusActionRow}>
                    <Button
                      title="Mark as Closed / Resolved"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() =>
                        updateStatusMutation.mutate({ id: selectedTicket.id, status: 'Resolved' })
                      }
                    />
                  </View>
                )}

                <Text style={[styles.modalMessageLabel, { marginTop: 14 }]}>Send Response:</Text>
                <View style={styles.replyBox}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Type reply message to clinic admin..."
                    placeholderTextColor={Colors.slate}
                    multiline
                    value={replyMessage}
                    onChangeText={setReplyMessage}
                  />
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={() => {
                      if (!replyMessage.trim()) return;
                      replyMutation.mutate({ id: selectedTicket.id, msg: replyMessage });
                    }}
                    disabled={replyMutation.isPending}
                  >
                    <Send size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* CREATE TICKET MODAL */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalSubject}>Create Support Ticket</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color={Colors.slate} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Subject / Topic *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Issue with SMS Integration"
                placeholderTextColor={Colors.slate}
                value={newSubject}
                onChangeText={setNewSubject}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Priority</Text>
              <View style={styles.prioritySelector}>
                {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityChip, newPriority === p && styles.priorityChipActive]}
                    onPress={() => setNewPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        newPriority === p && styles.priorityChipTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Message Details *</Text>
              <TextInput
                style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe your issue or question in detail..."
                placeholderTextColor={Colors.slate}
                multiline
                value={newMessage}
                onChangeText={setNewMessage}
              />

              <Button
                title="Submit Support Ticket"
                variant="primary"
                style={{ marginTop: 20 }}
                loading={createMutation.isPending}
                onPress={() => {
                  if (!newSubject.trim() || !newMessage.trim()) {
                    Alert.alert('Required', 'Please fill subject and message.');
                    return;
                  }
                  createMutation.mutate({
                    subject: newSubject,
                    message: newMessage,
                    priority: newPriority,
                  });
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '600',
    marginTop: 2,
  },
  newTicketBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topContainer: {
    paddingBottom: 6,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate,
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: 8,
  },
  filterGroup: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  chipTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  filterActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  resetBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F97316',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  refreshBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate,
    fontWeight: '600',
  },
  ticketCard: {
    padding: 14,
    borderRadius: 16,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketIdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ticketIdText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  ticketMain: {
    flex: 1,
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  ticketClinic: {
    fontSize: 10,
    color: Colors.slate,
    marginTop: 1,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  ticketMessage: {
    fontSize: 12,
    color: Colors.slate,
    lineHeight: 16,
    marginTop: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: 10,
    color: Colors.slate,
  },
  viewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  viewActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalSubject: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  modalMeta: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  modalBody: {
    paddingVertical: 14,
  },
  modalMessageLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 6,
  },
  modalMessageBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalMessageText: {
    fontSize: 12,
    color: Colors.dark,
    lineHeight: 18,
  },
  statusActionRow: {
    marginTop: 10,
  },
  replyBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  replyInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 12,
    color: Colors.dark,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 12,
    color: Colors.dark,
    marginTop: 4,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priorityChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  priorityChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  priorityChipTextActive: {
    color: Colors.primaryDark,
  },
});
