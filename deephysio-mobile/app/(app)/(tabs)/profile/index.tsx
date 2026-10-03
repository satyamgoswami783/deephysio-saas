import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Shield,
  KeyRound,
  FileCheck2,
  Users2,
  TrendingUp,
  Building,
  LogOut,
  ChevronRight,
  HelpCircle,
  Camera,
  Tag,
  Crown,
  Database,
  Globe,
} from 'lucide-react-native';
import { useAuth } from '../../../../src/context/AuthContext';
import { usePermissions } from '../../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../../src/components/common/ScreenWrapper';
import Header from '../../../../src/components/common/Header';
import Card from '../../../../src/components/common/Card';
import Badge from '../../../../src/components/common/Badge';
import ConfirmationModal from '../../../../src/components/common/ConfirmationModal';
import Colors from '../../../../src/constants/colors';
import { saasApi } from '../../../../src/api/saas.api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, role, clinicProfile, logout, updateUserPhoto } = useAuth();
  const { isAdmin, isSuperAdmin, can, hasModule } = usePermissions();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handlePickPhoto = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option to update your photo:',
      [
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        { text: 'Take Photo with Camera', onPress: pickFromCamera },
        ...(user?.photo
          ? [
              {
                text: 'Remove Photo',
                style: 'destructive' as const,
                onPress: () => {
                  updateUserPhoto('');
                  if (isSuperAdmin) saasApi.updateSettings({ profile: { name: user.name, email: user.email, photo: '' } }).catch(() => {});
                },
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoData = result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : result.assets[0].uri;
        updateUserPhoto(photoData);
        if (isSuperAdmin) {
          saasApi.updateSettings({ profile: { name: user?.name || '', email: user?.email || '', photo: photoData } }).catch(() => {});
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to select image.');
    }
  };

  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access permission is required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoData = result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : result.assets[0].uri;
        updateUserPhoto(photoData);
        if (isSuperAdmin) {
          saasApi.updateSettings({ profile: { name: user?.name || '', email: user?.email || '', photo: photoData } }).catch(() => {});
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to take photo.');
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const initialLetter = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <ScreenWrapper>
      <Header title="Staff Profile" subtitle="Account & Clinic Settings" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Card elevated style={styles.userCard}>
          <View style={styles.userRow}>
            <TouchableOpacity style={styles.avatar} onPress={handlePickPhoto} activeOpacity={0.8}>
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarInitials}>{initialLetter}</Text>
              )}
              <View style={styles.cameraIconBadge}>
                <Camera size={10} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Staff Member'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'email@clinic.com'}</Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={String(role || 'staff').toUpperCase()}
                  variant="primary"
                  size="sm"
                  dot
                />
              </View>
            </View>
          </View>

          <View style={styles.clinicDetailsRow}>
            <Building size={14} color={Colors.slate} />
            <Text style={styles.clinicNameText}>
              {user?.tenant?.clinic_name || clinicProfile?.clinicName || 'Clinic Practice'}
            </Text>
          </View>
        </Card>

        {/* 👑 SUPERADMIN SPECIFIC SAAS SUITE */}
        {isSuperAdmin && (
          <>
            <Text style={styles.sectionHeader}>SaaS Platform Control</Text>
            <Card style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(app)/superadmin/tenants')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Users2 size={18} color="#2563EB" />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={styles.menuItemTitle}>Admins & Clinic Subscriptions</Text>
                  <Text style={styles.menuItemSubtitle}>Manage all clinic owners and plans</Text>
                </View>
                <ChevronRight size={18} color={Colors.slate} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => router.push('/(app)/superadmin/revenue')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <TrendingUp size={18} color="#059669" />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={styles.menuItemTitle}>SaaS Revenue & Payments</Text>
                  <Text style={styles.menuItemSubtitle}>MRR, plans & transaction history</Text>
                </View>
                <ChevronRight size={18} color={Colors.slate} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => router.push('/(app)/superadmin/settings')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Building size={18} color="#D97706" />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={styles.menuItemTitle}>Global Platform Settings</Text>
                  <Text style={styles.menuItemSubtitle}>HQ profile, GST & system config</Text>
                </View>
                <ChevronRight size={18} color={Colors.slate} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* Clinical Suite Section (For Non-SuperAdmin Clinic Staff) */}
        {!isSuperAdmin && (
          <>
            <Text style={styles.sectionHeader}>Clinical & Practice Modules</Text>
            <Card style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(app)/services' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FDF4FF' }]}>
                  <Tag size={18} color="#A855F7" />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={styles.menuItemTitle}>Services & Pricing Catalog</Text>
                  <Text style={styles.menuItemSubtitle}>Manage treatments, duration & pricing rates</Text>
                </View>
                <ChevronRight size={18} color={Colors.slate} />
              </TouchableOpacity>

              {(hasModule('Forms') || can('forms.view')) && (
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={() => router.push('/(app)/forms')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: Colors.primaryLight }]}>
                    <FileCheck2 size={18} color={Colors.primaryDark} />
                  </View>
                  <View style={styles.menuItemTextContainer}>
                    <Text style={styles.menuItemTitle}>Clinical Forms & Templates</Text>
                    <Text style={styles.menuItemSubtitle}>Assessment sheets & intake forms</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.slate} />
                </TouchableOpacity>
              )}

              {(hasModule('Analytics') || can('analytics.view')) && (
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={() => router.push('/(app)/analytics')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: Colors.secondaryLight }]}>
                    <TrendingUp size={18} color={Colors.secondaryDark} />
                  </View>
                  <View style={styles.menuItemTextContainer}>
                    <Text style={styles.menuItemTitle}>Analytics & Practice Reports</Text>
                    <Text style={styles.menuItemSubtitle}>Financial, session & staff metrics</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.slate} />
                </TouchableOpacity>
              )}
            </Card>
          </>
        )}

        {/* Administration Section */}
        {isAdmin && (
          <>
            <Text style={styles.sectionHeader}>Administration & Access</Text>
            <Card style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(app)/settings/users')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Users2 size={18} color={Colors.success} />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={styles.menuItemTitle}>Staff Directory & Roles</Text>
                  <Text style={styles.menuItemSubtitle}>Manage users and RBAC matrix</Text>
                </View>
                <ChevronRight size={18} color={Colors.slate} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => router.push('/(app)/settings/clinic')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: Colors.primaryLight }]}>
                  <Building size={18} color={Colors.primaryDark} />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={styles.menuItemTitle}>Clinic Configuration</Text>
                  <Text style={styles.menuItemSubtitle}>Branding, hours & contact info</Text>
                </View>
                <ChevronRight size={18} color={Colors.slate} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => router.push('/(app)/settings/plans')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#F0FDFA' }]}>
                  <Crown size={18} color="#0D9488" />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={styles.menuItemTitle}>Subscription & Plans</Text>
                  <Text style={styles.menuItemSubtitle}>Manage SaaS tier, pricing & upgrades</Text>
                </View>
                <ChevronRight size={18} color={Colors.slate} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => router.push('/(app)/settings/backup' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#ECFEFF' }]}>
                  <Database size={18} color="#0891B2" />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text style={styles.menuItemTitle}>Data Backup & Snapshots</Text>
                  <Text style={styles.menuItemSubtitle}>Export and archive database copies</Text>
                </View>
                <ChevronRight size={18} color={Colors.slate} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* Security & App Section */}
        <Text style={styles.sectionHeader}>Security & App</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(app)/settings/language' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Globe size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemTitle}>Language (भाषा)</Text>
              <Text style={styles.menuItemSubtitle}>English, हिन्दी, Español, العربية, Français</Text>
            </View>
            <ChevronRight size={18} color={Colors.slate} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => router.push('/(app)/settings/security')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Shield size={18} color="#10B981" />
            </View>
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemTitle}>Security Settings</Text>
              <Text style={styles.menuItemSubtitle}>Single session, 2FA & remote logout</Text>
            </View>
            <ChevronRight size={18} color={Colors.slate} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => router.push('/(app)/settings/change-password')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: Colors.background }]}>
              <KeyRound size={18} color={Colors.dark} />
            </View>
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemTitle}>Change Password</Text>
              <Text style={styles.menuItemSubtitle}>Update your security credentials</Text>
            </View>
            <ChevronRight size={18} color={Colors.slate} />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out from Workspace</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>DeePhysio Healthcare Mobile v1.0.0</Text>
      </ScrollView>

      <ConfirmationModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out from your DeePhysio workspace?"
        confirmTitle="Sign Out"
        confirmVariant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  userCard: {
    padding: 16,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.slate,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
  },
  clinicDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 6,
  },
  clinicNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    padding: 0,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.slate,
    marginTop: 20,
  },
});
