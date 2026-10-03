import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Mail, Send, ChevronRight, User, Plus } from 'lucide-react-native';
import { communicationApi, CommThread } from '../../../src/api/communication.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Button from '../../../src/components/common/Button';
import Input from '../../../src/components/common/Input';
import EmptyState from '../../../src/components/common/EmptyState';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';
import { formatDate } from '../../../src/utils/date';

export default function CommunicationScreen() {
  const router = useRouter();

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const {
    data: threads = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['communication-threads'],
    queryFn: communicationApi.getThreads,
  });

  const handleSendEmail = async () => {
    if (!recipientEmail.trim() || !emailBody.trim()) {
      Alert.alert('Validation', 'Please provide recipient email and message body.');
      return;
    }

    setSendingEmail(true);
    try {
      await communicationApi.sendDirectEmail({
        recipientEmail: recipientEmail.trim(),
        subject: emailSubject.trim() || 'Notice from DeePhysio Clinic',
        messageBody: emailBody.trim(),
      });

      setShowEmailModal(false);
      setRecipientEmail('');
      setEmailSubject('');
      setEmailBody('');
      Alert.alert('Email Sent', 'Direct communication email delivered.');
    } catch (err: any) {
      Alert.alert('Send Failed', err.response?.data?.message || err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title="Patient Communication"
        subtitle="SMS & Messaging Threads"
        showBack
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowEmailModal(true)}
            activeOpacity={0.7}
          >
            <Mail size={18} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading communication threads..." />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const patientName = item.patient
              ? `${item.patient.first_name} ${item.patient.last_name}`.trim()
              : `Patient #${item.patient_id}`;

            return (
              <Card
                elevated
                style={styles.threadCard}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/communication/chat',
                    params: { threadId: item.id, patientName, patientPhone: item.patient?.phone },
                  })
                }
              >
                <View style={styles.threadRow}>
                  <View style={styles.avatar}>
                    <User size={18} color={Colors.primary} />
                  </View>

                  <View style={styles.threadInfo}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    <Text style={styles.channelText}>
                      Channel: {item.channel || 'SMS'} • {formatDate(item.updated_at)}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={Colors.slate} />
                </View>
              </Card>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Active Message Threads"
              description="Direct communications with patients will be logged here."
              actionTitle="Send Direct Email"
              onActionPress={() => setShowEmailModal(true)}
              icon={<MessageSquare size={36} color={Colors.primary} />}
            />
          }
        />
      )}

      {/* Direct Email Modal */}
      <Modal visible={showEmailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Direct Email</Text>

            <Input
              label="Recipient Email *"
              placeholder="patient@example.com"
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />

            <Input
              label="Subject"
              placeholder="e.g. Appointment Confirmation"
              value={emailSubject}
              onChangeText={setEmailSubject}
            />

            <Input
              label="Message Body *"
              placeholder="Type your message..."
              value={emailBody}
              onChangeText={setEmailBody}
              multiline
              numberOfLines={4}
              required
            />

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowEmailModal(false)}
                style={styles.flexBtn}
              />
              <Button
                title="Send Email"
                variant="primary"
                loading={sendingEmail}
                onPress={handleSendEmail}
                icon={<Send size={16} color={Colors.surface} />}
                style={styles.flexBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  listContent: {
    padding: 16,
  },
  threadCard: {
    padding: 14,
    marginBottom: 10,
  },
  threadRow: {
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
    marginRight: 12,
  },
  threadInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  channelText: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  flexBtn: {
    flex: 1,
  },
});
