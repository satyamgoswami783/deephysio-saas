import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  User,
  Building,
  Lock,
  Megaphone,
  Camera,
  Trash2,
} from 'lucide-react-native';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Colors from '../../../src/constants/colors';
import { saasApi } from '../../../src/api/saas.api';
import { useAuth } from '../../../src/context/AuthContext';

const notificationItems = [
  { title: 'Welcome Note', sub: 'Sent automatically to new members on registration.' },
  { title: 'Invoice Bills', sub: 'Sent automatically to members when recording a plan payment.' },
  { title: 'Marketing Campaigns', sub: 'Sent for scheduled marketing campaigns or blasts.' },
  { title: 'Free Trial Registration Alerts', sub: 'Sent automatically to the Super Admin when a new Clinic registers for a free trial.' },
  { title: 'Paid Subscription Expiry / Renewal Alerts', sub: 'Sent automatically to Clinic Admins (Owners) when their SaaS plan is expiring.' },
  { title: 'Paid Payment Invoice / Receipt', sub: 'Sent automatically to Clinic Owners with PDF Tax Invoice link when subscription payment is received.' },
];

export default function SuperAdminSettingsScreen() {
  const router = useRouter();
  const { user, updateUserPhoto } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [savingChannels, setSavingChannels] = useState(false);

  const [fullName, setFullName] = useState(user?.name || 'Super Admin');
  const [email, setEmail] = useState(user?.email || 'superadmin@deephysio.com');
  const [profilePhoto, setProfilePhoto] = useState<string>(user?.photo || '');

  const [businessName, setBusinessName] = useState('DeePhysio Healthcare Pvt Ltd');
  const [gstNumber, setGstNumber] = useState('07AAAAA0000A1Z5');
  const [mobileNumber, setMobileNumber] = useState('+91 98765 43210');
  const [businessAddress, setBusinessAddress] = useState('Plot 42, Health City, Sector 62, Noida, UP - 201301');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [channels, setChannels] = useState<Record<string, { email: boolean; whatsapp: boolean; push: boolean }>>(() => {
    const initial: any = {};
    notificationItems.forEach((item) => {
      initial[item.title] = { email: true, whatsapp: true, push: true };
    });
    return initial;
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await saasApi.getSettings();
      if (res) {
        if (res.profile) {
          if (res.profile.name) setFullName(res.profile.name);
          if (res.profile.email) setEmail(res.profile.email);
          if (res.profile.photo) {
            setProfilePhoto(res.profile.photo);
            updateUserPhoto(res.profile.photo);
          }
        }
        if (res.business) {
          if (res.business.businessName) setBusinessName(res.business.businessName);
          if (res.business.gstNumber) setGstNumber(res.business.gstNumber);
          if (res.business.mobileNumber) setMobileNumber(res.business.mobileNumber);
          if (res.business.businessAddress) setBusinessAddress(res.business.businessAddress);
        }
        if (res.notifications && Object.keys(res.notifications).length > 0) {
          setChannels(res.notifications as any);
        }
      }
    } catch (err) {
      console.log('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option to update your profile photo:',
      [
        {
          text: 'Choose from Gallery',
          onPress: pickFromGallery,
        },
        {
          text: 'Take Photo with Camera',
          onPress: pickFromCamera,
        },
        ...(profilePhoto
          ? [
              {
                text: 'Remove Photo',
                style: 'destructive' as const,
                onPress: () => {
                  setProfilePhoto('');
                  updateUserPhoto('');
                },
              },
            ]
          : []),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Permission to access the media library is required to upload images.');
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
        const asset = result.assets[0];
        const photoData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePhoto(photoData);
        updateUserPhoto(photoData);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select image.');
    }
  };

  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const photoData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePhoto(photoData);
        updateUserPhoto(photoData);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to capture photo.');
    }
  };

  const toggleChannel = (title: string, type: 'email' | 'whatsapp' | 'push') => {
    setChannels((prev) => ({
      ...prev,
      [title]: {
        ...prev[title],
        [type]: !prev[title]?.[type],
      },
    }));
  };

  const handleSaveProfileBusiness = async () => {
    try {
      setSavingProfile(true);
      await saasApi.updateSettings({
        profile: {
          name: fullName,
          email,
          photo: profilePhoto,
        },
        business: {
          businessName,
          gstNumber,
          mobileNumber,
          businessAddress,
        },
      });
      updateUserPhoto(profilePhoto);
      Alert.alert('Success', 'Profile and Business details updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required', 'Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      await saasApi.updatePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveChannels = async () => {
    try {
      setSavingChannels(true);
      await saasApi.updateSettings({
        notifications: channels as any,
      });
      Alert.alert('Success', 'Notification channel preferences saved.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save channels.');
    } finally {
      setSavingChannels(false);
    }
  };

  const initialLetter = fullName ? fullName.trim().charAt(0).toUpperCase() : 'S';

  return (
    <ScreenWrapper>
      {/* Header matching Website */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: 👤 MY PROFILE */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <User size={16} color={Colors.slate} />
            <Text style={styles.sectionHeaderText}>My Profile</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.profileTopRow}>
              <TouchableOpacity style={styles.avatarCircle} onPress={handlePickImage} activeOpacity={0.8}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarText}>{initialLetter}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <Camera size={13} color={Colors.slate} />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.textInput} value={fullName} onChangeText={setFullName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: 🏢 BUSINESS DETAILS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Building size={16} color={Colors.slate} />
            <Text style={styles.sectionHeaderText}>Business Details</Text>
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.noticeText}>
              These details will be printed on the Email/Payment Invoices sent to your clients.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput style={styles.textInput} value={businessName} onChangeText={setBusinessName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST Number</Text>
              <TextInput style={styles.textInput} value={gstNumber} onChangeText={setGstNumber} autoCapitalize="characters" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput style={styles.textInput} value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Address</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                value={businessAddress}
                onChangeText={setBusinessAddress}
                multiline
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={savingProfile}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveOrangeBtn} onPress={handleSaveProfileBusiness} disabled={savingProfile} activeOpacity={0.8}>
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveOrangeBtnText}>Save Profile & Business</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 3: 🔒 CHANGE PASSWORD */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Lock size={16} color={Colors.slate} />
            <Text style={styles.sectionHeaderText}>Change Password</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
              />
            </View>

            <TouchableOpacity style={styles.darkUpdateBtn} onPress={handleUpdatePassword} disabled={updatingPassword} activeOpacity={0.8}>
              {updatingPassword ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.darkUpdateBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 4: 📢 GLOBAL NOTIFICATION CHANNEL MANAGER */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Megaphone size={16} color="#DC2626" />
            <Text style={styles.sectionHeaderText}>Global Notification Channel Manager</Text>
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.noticeText}>
              Select which communication channels (Email, WhatsApp, or App Push Notification) will be used to send system notifications.
            </Text>

            <View style={styles.channelList}>
              {notificationItems.map((item, idx) => {
                const rowState = channels[item.title] || { email: true, whatsapp: true, push: true };
                return (
                  <View key={idx} style={styles.channelRow}>
                    <View style={styles.channelInfo}>
                      <Text style={styles.channelTitle}>{item.title}</Text>
                      <Text style={styles.channelSub}>{item.sub}</Text>
                    </View>
                    <View style={styles.switchGrid}>
                      <View style={styles.switchItem}>
                        <Text style={styles.switchLabel}>Email</Text>
                        <Switch
                          value={rowState.email}
                          onValueChange={() => toggleChannel(item.title, 'email')}
                          trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                          thumbColor={rowState.email ? '#2563EB' : '#F8FAFC'}
                        />
                      </View>
                      <View style={styles.switchItem}>
                        <Text style={styles.switchLabel}>WA</Text>
                        <Switch
                          value={rowState.whatsapp}
                          onValueChange={() => toggleChannel(item.title, 'whatsapp')}
                          trackColor={{ false: '#E2E8F0', true: '#A7F3D0' }}
                          thumbColor={rowState.whatsapp ? '#059669' : '#F8FAFC'}
                        />
                      </View>
                      <View style={styles.switchItem}>
                        <Text style={styles.switchLabel}>Push</Text>
                        <Switch
                          value={rowState.push}
                          onValueChange={() => toggleChannel(item.title, 'push')}
                          trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                          thumbColor={rowState.push ? '#4F46E5' : '#F8FAFC'}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={[styles.saveOrangeBtn, { marginTop: 16 }]} onPress={handleSaveChannels} disabled={savingChannels} activeOpacity={0.8}>
              {savingChannels ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveOrangeBtnText}>Save Channels</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: -0.4,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  sectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  sectionBody: {
    padding: 16,
  },
  profileTopRow: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#EAB308',
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#854D0E',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  noticeText: {
    fontSize: 11,
    color: Colors.slate,
    lineHeight: 16,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.dark,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#64748B',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  saveOrangeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  saveOrangeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  darkUpdateBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  darkUpdateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  channelList: {
    gap: 12,
  },
  channelRow: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  channelInfo: {
    marginBottom: 8,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
  },
  channelSub: {
    fontSize: 10,
    color: Colors.slate,
    marginTop: 2,
    lineHeight: 14,
  },
  switchGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  switchItem: {
    alignItems: 'center',
    gap: 2,
  },
  switchLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.slate,
  },
});
