import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  Crown,
  Sparkles,
  Zap,
  Building,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
} from 'lucide-react-native';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Colors from '../../../src/constants/colors';
import { useAuth } from '../../../src/context/AuthContext';

interface PlanItem {
  id: string;
  name: string;
  price: string;
  period: string;
  badge?: string;
  isPopular?: boolean;
  color: string;
  icon: any;
  features: string[];
}

const PLANS: PlanItem[] = [
  {
    id: 'trial',
    name: '7-Day Free Trial',
    price: '₹0',
    period: 'for 7 days',
    color: '#0D9488',
    icon: Sparkles,
    features: [
      '7 Days full feature trial access',
      'Smart Scheduling & Patient Directory',
      'Clinical SOAP Notes & Templates',
      'No Credit Card required to start',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₹999',
    period: 'per month',
    color: '#3B82F6',
    icon: Zap,
    features: [
      'Essential clinic management features',
      'Up to 3 Practitioners & Staff',
      'Standard Appointments & Reminders',
      'Invoice Registry & PDF Receipts',
      'Standard Email Support',
    ],
  },
  {
    id: 'standard',
    name: 'Standard / Professional',
    price: '₹1,299',
    period: 'per month',
    badge: 'MOST POPULAR',
    isPopular: true,
    color: '#0D9488',
    icon: Crown,
    features: [
      'Complete features for growing clinics',
      'Unlimited Practitioners & Staff',
      'Smart Schedule Timetable & Grid',
      'SOAP Notes, Progress & Assessments',
      'Billing, Invoices & Payment Ledger',
      'Patient Medical History & Files',
      'Priority Support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹1,499',
    period: 'per month',
    badge: 'AI POWERED',
    color: '#7E22CE',
    icon: Sparkles,
    features: [
      'Kiaan AI Assistant & AI Notes Generator',
      'Advanced Practice Analytics & Reports',
      'Multi-Location Clinic Support',
      'Automated SMS & WhatsApp Reminders',
      'Dedicated Account Manager (24/7)',
    ],
  },
  {
    id: 'custom',
    name: 'Custom Plan',
    price: 'Custom',
    period: 'tailored to clinic',
    color: '#0F172A',
    icon: Building,
    features: [
      'SaaS with Full Customization',
      'Personal Domain & Custom App Branding',
      'Custom API & Hospital Integrations',
      'On-Premises / Private Cloud Hosting',
      'Custom SLA & Enterprise Security',
    ],
  },
];

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { clinicProfile, role } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectPlan = (plan: PlanItem) => {
    Alert.alert(
      `Select ${plan.name}`,
      `Would you like to upgrade to the ${plan.name} (${plan.price} ${plan.period})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Proceed',
          onPress: () => {
            Alert.alert(
              'Subscription Request Sent',
              `Your upgrade request for ${plan.name} has been processed. An invoice has been generated for your clinic.`
            );
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <Header
        title="Subscription Plans"
        subtitle="Simple, Transparent Clinic Pricing"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Plan Card */}
        <Card elevated style={styles.activePlanCard}>
          <View style={styles.activePlanRow}>
            <View style={styles.activePlanIconWrap}>
              <Crown size={22} color="#0D9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activePlanLabel}>CURRENT CLINIC PLAN</Text>
              <Text style={styles.activePlanTitle}>Professional Plan (Active)</Text>
              <Text style={styles.activePlanExpiry}>Renews automatically on next cycle</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>
        </Card>

        {/* Billing Cycle Switcher */}
        <View style={styles.cycleSwitcher}>
          <TouchableOpacity
            style={[styles.cycleBtn, billingCycle === 'monthly' && styles.cycleBtnActive]}
            onPress={() => setBillingCycle('monthly')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cycleBtnText,
                billingCycle === 'monthly' && styles.cycleBtnTextActive,
              ]}
            >
              Monthly Billing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cycleBtn, billingCycle === 'annual' && styles.cycleBtnActive]}
            onPress={() => setBillingCycle('annual')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cycleBtnText,
                billingCycle === 'annual' && styles.cycleBtnTextActive,
              ]}
            >
              Annual Billing (Save 20%)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plans List */}
        <View style={styles.plansList}>
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isHighlighted = plan.isPopular;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isHighlighted && styles.planCardHighlighted,
                ]}
              >
                {/* Popular / AI Badge */}
                {plan.badge && (
                  <View
                    style={[
                      styles.popularBadge,
                      { backgroundColor: isHighlighted ? '#0D9488' : '#7E22CE' },
                    ]}
                  >
                    <Text style={styles.popularBadgeText}>{plan.badge}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={[styles.planIconBox, { backgroundColor: `${plan.color}15` }]}>
                    <Icon size={20} color={plan.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>/{plan.period}</Text>
                    </View>
                  </View>
                </View>

                {/* Features list */}
                <View style={styles.featuresList}>
                  {plan.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <CheckCircle2 size={16} color="#10B981" style={{ marginTop: 1 }} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={[
                    styles.planActionBtn,
                    isHighlighted ? styles.planActionBtnPrimary : styles.planActionBtnOutline,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.planActionBtnText,
                      isHighlighted ? styles.planActionBtnTextPrimary : styles.planActionBtnTextOutline,
                    ]}
                  >
                    {plan.id === 'custom' ? 'Contact Enterprise' : 'Get Started'}
                  </Text>
                  <ChevronRight
                    size={16}
                    color={isHighlighted ? '#FFFFFF' : Colors.dark}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Trust & Guarantee Banner */}
        <View style={styles.trustBanner}>
          <ShieldCheck size={20} color="#0D9488" />
          <View style={{ flex: 1 }}>
            <Text style={styles.trustTitle}>Enterprise Cloud Security</Text>
            <Text style={styles.trustDesc}>
              HIPAA compliant, 256-bit SSL encrypted & isolated clinic databases.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  activePlanCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
    borderWidth: 1.5,
  },
  activePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activePlanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePlanLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  activePlanTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
    marginTop: 2,
  },
  activePlanExpiry: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  cycleSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  cycleBtnActive: {
    backgroundColor: Colors.primary,
  },
  cycleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
  },
  cycleBtnTextActive: {
    color: Colors.surface,
    fontWeight: '800',
  },
  plansList: {
    gap: 16,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  planCardHighlighted: {
    borderColor: '#0D9488',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0D9488',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  planIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
  },
  planPeriod: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '600',
  },
  featuresList: {
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
  planActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  planActionBtnPrimary: {
    backgroundColor: '#0D9488',
  },
  planActionBtnOutline: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  planActionBtnTextPrimary: {
    color: '#FFFFFF',
  },
  planActionBtnTextOutline: {
    color: Colors.dark,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },
  trustDesc: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 1,
  },
});
