import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Globe, Check } from 'lucide-react-native';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Colors from '../../../src/constants/colors';
import { useLanguage } from '../../../src/context/LanguageContext';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { currentLang, setLanguage, languages, t } = useLanguage();

  return (
    <ScreenWrapper>
      <Header
        title={t('language')}
        subtitle={t('selectLanguage')}
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card elevated style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Globe size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t('selectLanguage')}</Text>
              <Text style={styles.cardDesc}>
                Choose your preferred language for clinic management and patient records.
              </Text>
            </View>
          </View>

          <View style={styles.langList}>
            {languages.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langItem, isSelected && styles.langItemActive]}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.langLeft}>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text style={[styles.langName, isSelected && styles.langNameActive]}>
                      {lang.name}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.slate,
    lineHeight: 16,
  },
  langList: {
    gap: 10,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  langItemActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  langFlag: {
    fontSize: 22,
  },
  langName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  langNameActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
