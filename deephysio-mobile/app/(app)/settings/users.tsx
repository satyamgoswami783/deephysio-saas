import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users2, Plus, User, Shield, Mail, Trash2 } from 'lucide-react-native';
import { settingsApi } from '../../../src/api/settings.api';
import { usePermissions } from '../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Badge from '../../../src/components/common/Badge';
import Button from '../../../src/components/common/Button';
import Input from '../../../src/components/common/Input';
import EmptyState from '../../../src/components/common/EmptyState';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';
import { UserRole } from '../../../src/types/auth.types';

const ROLES: UserRole[] = ['admin', 'therapist', 'receptionist', 'billing'];

export default function StaffUsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin, isSuperAdmin } = usePermissions();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('therapist');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['staff-users'],
    queryFn: settingsApi.getUsers,
  });

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in Name, Email, and Password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await settingsApi.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      refetch();
      Alert.alert('Staff Member Added', 'User account created successfully.');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to remove this staff account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await settingsApi.deleteUser(userId);
            refetch();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || err.message);
          }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <Header
        title="Staff Directory"
        subtitle={`${users.length} Clinic Accounts`}
        showBack
        onBackPress={() => router.back()}
        rightElement={
          (isAdmin || isSuperAdmin) ? (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={18} color={Colors.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState message="Loading staff accounts..." />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Card elevated style={styles.userCard}>
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <User size={20} color={Colors.primary} />
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <View style={styles.roleBadgeRow}>
                    <Badge
                      label={String(item.role || 'staff').toUpperCase()}
                      variant={item.role === 'admin' ? 'secondary' : 'primary'}
                      size="sm"
                      dot
                    />
                  </View>
                </View>

                {(isAdmin || isSuperAdmin) && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteUser(item.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Users Found"
              description="Click the plus icon above to add a staff member."
              icon={<Users2 size={36} color={Colors.primary} />}
            />
          }
        />
      )}

      {/* Add User Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Staff Member</Text>

            {!!errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            <Input
              label="Full Name *"
              placeholder="e.g. Dr. Amit Patel"
              value={name}
              onChangeText={setName}
              required
            />

            <Input
              label="Email Address *"
              placeholder="name@clinic.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />

            <Input
              label="Password *"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              required
            />

            {/* Role selection */}
            <Text style={styles.roleLabel}>Role / Permissions *</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowAddModal(false)}
                style={styles.flexBtn}
              />
              <Button
                title="Create Account"
                variant="primary"
                loading={submitting}
                onPress={handleCreateUser}
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
  userCard: {
    padding: 14,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  roleBadgeRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dangerLight,
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.danger,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  roleChip: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
  },
  roleChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexBtn: {
    flex: 1,
  },
});
