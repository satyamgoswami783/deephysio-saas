import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, User, Phone } from 'lucide-react-native';
import { communicationApi, CommMessage } from '../../../src/api/communication.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';
import { formatTime } from '../../../src/utils/date';

export default function ChatScreen() {
  const { threadId: threadIdParam, patientName, patientPhone } = useLocalSearchParams<{
    threadId: string;
    patientName?: string;
    patientPhone?: string;
  }>();

  const threadId = parseInt(threadIdParam || '0', 10);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: () => communicationApi.getMessages(threadId),
    enabled: !!threadId,
    refetchInterval: 5000, // Light auto-polling
  });

  const handleSend = async () => {
    if (!messageText.trim()) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await communicationApi.sendMessage(threadId, {
        body: textToSend,
        channel: 'SMS',
      });

      await refetch();
      queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
    } catch (err: any) {
      Alert.alert('Message Failed', err.response?.data?.message || err.message);
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenWrapper withSafeArea edges={['top', 'left', 'right']}>
      <Header
        title={patientName || 'Patient Chat'}
        subtitle={patientPhone || 'Direct Communication'}
        showBack
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {isLoading ? (
          <LoadingState message="Loading conversation..." />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const isOutbound = item.direction === 'OUTBOUND';
              return (
                <View
                  style={[
                    styles.messageBubble,
                    isOutbound ? styles.outboundBubble : styles.inboundBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageBody,
                      isOutbound ? styles.outboundText : styles.inboundText,
                    ]}
                  >
                    {item.body}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isOutbound ? styles.outboundTime : styles.inboundTime,
                    ]}
                  >
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              );
            }}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No previous messages in this thread.</Text>
                <Text style={styles.emptySubText}>Send a message below to reach the patient.</Text>
              </View>
            }
          />
        )}

        {/* Bottom Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.slate}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
            activeOpacity={0.8}
          >
            <Send size={18} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  outboundBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  inboundBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  outboundText: {
    color: Colors.surface,
  },
  inboundText: {
    color: Colors.dark,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  outboundTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inboundTime: {
    color: Colors.slate,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  emptySubText: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.dark,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
