import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Database, Download, RefreshCw, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Button from '../../../src/components/common/Button';
import Colors from '../../../src/constants/colors';
import apiClient from '../../../src/api/client';

interface BackupItem {
  name: string;
  size: string;
  createdAt: string;
}

export default function MobileBackupScreen() {
  const router = useRouter();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState<'JSON' | 'SQL'>('JSON');

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/backup');
      if (res.data?.success) {
        setBackups(res.data.data || []);
      }
    } catch (err: any) {
      console.log('Failed to fetch backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleGenerateBackup = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post('/backup/trigger', { type: format });
      if (res.data?.success) {
        Alert.alert('Success', 'Database snapshot generated successfully.');
        fetchBackups();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to create backup.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Error triggering backup.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteBackup = async (fileName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/backup/${fileName}`);
              fetchBackups();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete backup.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <Header
        title="Data Backup"
        subtitle="Manage database snapshots and cloud exports."
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card elevated style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFEFF' }]}>
              <Database size={22} color="#0891B2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Create New Snapshot</Text>
              <Text style={styles.actionDesc}>
                Export an encrypted copy of all clinical records, patients, and invoices.
              </Text>
            </View>
          </View>

          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[styles.formatBtn, format === 'JSON' && styles.formatBtnActive]}
              onPress={() => setFormat('JSON')}
            >
              <Text style={[styles.formatText, format === 'JSON' && styles.formatTextActive]}>
                JSON Format
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formatBtn, format === 'SQL' && styles.formatBtnActive]}
              onPress={() => setFormat('SQL')}
            >
              <Text style={[styles.formatText, format === 'SQL' && styles.formatTextActive]}>
                SQL Dump
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={generating ? 'Generating Backup...' : 'Trigger Database Backup'}
            onPress={handleGenerateBackup}
            loading={generating}
            fullWidth
            size="md"
            style={styles.triggerBtn}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Snapshot Archives</Text>
          <TouchableOpacity onPress={fetchBackups} disabled={loading} style={styles.refreshBtn}>
            <RefreshCw size={14} color={Colors.slate} />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : backups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ShieldAlert size={32} color={Colors.slate} />
            <Text style={styles.emptyText}>No backup archives created yet.</Text>
          </Card>
        ) : (
          backups.map((item, idx) => (
            <Card key={idx} style={styles.backupItemCard}>
              <View style={styles.backupItemLeft}>
                <View style={[styles.itemIcon, { backgroundColor: '#F0FDF4' }]}>
                  <CheckCircle2 size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.size} • {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteBackup(item.name)}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color={Colors.danger} />
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.slate,
    lineHeight: 16,
    marginTop: 2,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  formatBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  formatText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate,
  },
  formatTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  triggerBtn: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate,
  },
  backupItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  backupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
});
