import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FileCheck2, ChevronRight, Plus } from 'lucide-react-native';
import { formsApi } from '../../../src/api/forms.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Badge from '../../../src/components/common/Badge';
import EmptyState from '../../../src/components/common/EmptyState';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';

export default function FormsListScreen() {
  const router = useRouter();

  const {
    data: templates = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['form-templates'],
    queryFn: formsApi.getTemplates,
  });

  return (
    <ScreenWrapper>
      <Header
        title="Clinical Forms"
        subtitle="Patient Intake & Assessment Sheets"
        showBack
        onBackPress={() => router.back()}
      />

      {isLoading ? (
        <LoadingState message="Loading templates..." />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Card
              elevated
              style={styles.card}
              onPress={() => router.push(`/(app)/forms/fill?templateId=${item.id}`)}
            >
              <View style={styles.cardRow}>
                <View style={styles.iconCircle}>
                  <FileCheck2 size={20} color={Colors.primary} />
                </View>

                <View style={styles.info}>
                  <Text style={styles.title}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Badge label={item.category || 'General'} variant="neutral" size="sm" />
                  </View>
                </View>

                <ChevronRight size={18} color={Colors.slate} />
              </View>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Templates Available"
              description="Form templates can be configured by administrators."
              icon={<FileCheck2 size={36} color={Colors.primary} />}
            />
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  card: {
    padding: 14,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
  },
});
