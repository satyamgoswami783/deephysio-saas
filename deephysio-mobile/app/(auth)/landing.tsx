import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import {
  Users,
  Calendar,
  FileText,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Crown,
  Clock,
  Lock,
  Database,
  Shield,
  Activity,
  Award,
} from 'lucide-react-native';
import Colors from '../../src/constants/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 44) / 2;

const STANDOUT_METRICS = [
  {
    num: '40%',
    title: 'Less Admin Work',
    icon: TrendingUp,
    iconColor: '#0D9488',
    bg: '#F0FDFA',
    border: '#CCFBF1',
  },
  {
    num: '15+',
    title: 'Hours Saved/Wk',
    icon: Clock,
    iconColor: '#3B82F6',
    bg: '#EFF6FF',
    border: '#DBEAFE',
  },
  {
    num: '99.9%',
    title: 'System Uptime',
    icon: ShieldCheck,
    iconColor: '#10B981',
    bg: '#ECFDF5',
    border: '#D1FAE5',
  },
  {
    num: 'Cloud',
    title: 'Secure Backup',
    icon: Database,
    iconColor: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#EDE9FE',
  },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Patient Management',
    desc: 'Intake, medical history & treatment records.',
    color: '#0D9488',
    bg: '#CCFBF1',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduler',
    desc: 'Timetable, live check-in & queue waitlist.',
    color: '#3B82F6',
    bg: '#DBEAFE',
  },
  {
    icon: FileText,
    title: 'Clinical Notes',
    desc: 'SOAP notes, templates & treatment logs.',
    color: '#8B5CF6',
    bg: '#EDE9FE',
  },
  {
    icon: CreditCard,
    title: 'Billing & Invoices',
    desc: 'Invoicing, receipts & balance reconciliation.',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  {
    icon: TrendingUp,
    title: 'Practice Analytics',
    desc: 'Monthly yield, patient visits & KPIs.',
    color: '#10B981',
    bg: '#DCFCE7',
  },
  {
    icon: ShieldCheck,
    title: 'Role Permissions',
    desc: 'Role-based access & patient data security.',
    color: '#6366F1',
    bg: '#EEF2FF',
  },
];

const SUBSCRIPTION_PLANS = [
  {
    name: '7-Day Free Trial',
    price: '₹0',
    period: 'for 7 days',
    tag: 'FREE TRIAL',
    color: '#0D9488',
    features: ['Full feature trial access', 'Smart Scheduling & Notes', 'No card required'],
  },
  {
    name: 'Starter',
    price: '₹999',
    period: '/month',
    tag: 'STARTER',
    color: '#3B82F6',
    features: ['Up to 3 staff & doctors', 'Appointment reminders', 'PDF receipts & ledger'],
  },
  {
    name: 'Professional',
    price: '₹1,299',
    period: '/month',
    tag: 'MOST POPULAR',
    color: '#0D9488',
    highlight: true,
    features: ['Unlimited staff & doctors', 'Full schedule timetable', 'Complete SOAP notes & billing', 'Priority 24/7 support'],
  },
  {
    name: 'Pro (AI)',
    price: '₹1,499',
    period: '/month',
    tag: 'AI POWERED',
    color: '#7E22CE',
    features: ['Kiaan AI notes assistant', 'Multi-location support', 'Automated WhatsApp alerts'],
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { clinicProfile } = useAuth();

  const logoSource = clinicProfile?.logoDataUrl
    ? { uri: clinicProfile.logoDataUrl }
    : require('../../assets/icon.png');

  return (
    <View style={styles.container}>
      {/* ── Top Fixed Navigation Bar ── */}
      <View style={styles.topNav}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <View style={styles.logoInner}>
              <Image
                source={logoSource}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <View>
            <Text style={styles.brandName}>Healthcare Clinic</Text>
            <Text style={styles.brandTag}>MANAGEMENT PLATFORM</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signInTopBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.signInTopBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 1. Hero Section ── */}
        <View style={styles.heroSection}>
          <View style={styles.badgePill}>
            <Sparkles size={11} color="#0D9488" />
            <Text style={styles.badgePillText}>HEALTHCARE MANAGEMENT PLATFORM</Text>
          </View>

          <Text style={styles.heroHeadline}>
            Transform Your{'\n'}
            <Text style={styles.heroGradientText}>Medical Practice</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            The cloud-based clinical platform enabling you to automate appointments, clinical notes, patient records, and billing.
          </Text>

          {/* Primary CTA Button */}
          <TouchableOpacity
            style={styles.ctaPrimaryBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaPrimaryText}>Sign In to Workspace</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Trust badges */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <CheckCircle2 size={12} color="#10B981" />
              <Text style={styles.trustText}>7-Day Free Trial</Text>
            </View>
            <View style={styles.trustItem}>
              <Lock size={12} color="#10B981" />
              <Text style={styles.trustText}>No Card Needed</Text>
            </View>
            <View style={styles.trustItem}>
              <ShieldCheck size={12} color="#10B981" />
              <Text style={styles.trustText}>Secure Cloud</Text>
            </View>
          </View>
        </View>

        {/* ── 2. Why Platform Stands Out (2 UPAR, 2 NICHE - 2x2 Grid) ── */}
        <View style={styles.metricsSection}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={styles.sectionOverline}>ENTERPRISE SAAS</Text>
            <Text style={styles.sectionTitle}>Why Our Platform Stands Out</Text>
          </View>

          {/* 2x2 Grid Container (2 upar, 2 niche) */}
          <View style={styles.metricsGrid}>
            {STANDOUT_METRICS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <View
                  key={idx}
                  style={[
                    styles.metricBox,
                    { backgroundColor: item.bg, borderColor: item.border },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIconWrap,
                      { backgroundColor: '#FFFFFF' },
                    ]}
                  >
                    <Icon size={18} color={item.iconColor} />
                  </View>
                  <Text style={styles.metricNumber}>{item.num}</Text>
                  <Text style={styles.metricTitle}>{item.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── 3. Features Section (2-Column Grid) ── */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={styles.sectionOverline}>ALL-IN-ONE SYSTEM</Text>
            <Text style={styles.sectionTitle}>Everything You Need to Manage Your Clinic</Text>
            <Text style={styles.sectionSubtitle}>
              From smart calendar schedules to clinical treatment records and billing ledgers.
            </Text>
          </View>

          {/* 2-Column Features Grid */}
          <View style={styles.featuresGrid}>
            {FEATURES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <View key={idx} style={styles.featureBox}>
                  <View style={[styles.featureIconWrap, { backgroundColor: item.bg }]}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── 4. Subscription Plans ── */}
        <View style={styles.plansSection}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={styles.sectionOverline}>SUBSCRIPTION TIERS</Text>
            <Text style={styles.sectionTitle}>Simple, Transparent Pricing</Text>
            <Text style={styles.sectionSubtitle}>
              Start your 7-Day Free Trial. No Credit Card required.
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plansScroll}
          >
            {SUBSCRIPTION_PLANS.map((plan, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.planCard,
                  plan.highlight && styles.planCardHighlight,
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/register',
                    params: { plan: plan.name },
                  })
                }
                activeOpacity={0.8}
              >
                {/* Badge */}
                <View
                  style={[
                    styles.planBadge,
                    { backgroundColor: plan.highlight ? '#0D9488' : `${plan.color}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.planBadgeText,
                      { color: plan.highlight ? '#FFFFFF' : plan.color },
                    ]}
                  >
                    {plan.tag}
                  </Text>
                </View>

                <Text style={styles.planCardName}>{plan.name}</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planCardPrice}>{plan.price}</Text>
                  <Text style={styles.planCardPeriod}>{plan.period}</Text>
                </View>

                {/* Features */}
                <View style={styles.planFeaturesWrap}>
                  {plan.features.map((feat, fIdx) => (
                    <View key={fIdx} style={styles.planFeatureLine}>
                      <CheckCircle2 size={12} color="#10B981" />
                      <Text style={styles.planFeatureText} numberOfLines={1}>
                        {feat}
                      </Text>
                    </View>
                  ))}
                </View>

                <View
                  style={[
                    styles.planActionBtn,
                    plan.highlight && styles.planActionBtnHighlight,
                  ]}
                >
                  <Text
                    style={[
                      styles.planActionBtnText,
                      plan.highlight && { color: '#FFFFFF' },
                    ]}
                  >
                    Get Started
                  </Text>
                  <ArrowRight
                    size={12}
                    color={plan.highlight ? '#FFFFFF' : '#0D9488'}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── 5. Bottom Call To Action ── */}
        <View style={styles.bottomCtaCard}>
          <Crown size={26} color="#FFFFFF" />
          <Text style={styles.bottomCtaTitle}>Transform Your Clinic Today</Text>
          <Text style={styles.bottomCtaDesc}>
            Join thousands of clinic owners who have streamlined their medical practice with Healthcare Clinic.
          </Text>
          <TouchableOpacity
            style={styles.bottomCtaBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomCtaBtnText}>Open Sign In Portal</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerBrand}>Healthcare Clinic Platform</Text>
          <Text style={styles.footerSub}>Powered by Kiaan Technology • v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    padding: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  brandTag: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.6,
  },
  signInTopBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  signInTopBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  heroSection: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    marginBottom: 12,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroGradientText: {
    color: '#0D9488',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  ctaPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    gap: 6,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 14,
  },
  ctaPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  metricsSection: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  sectionHeaderCompact: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionOverline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  metricBox: {
    width: cardWidth,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureBox: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  plansSection: {
    paddingTop: 22,
  },
  plansScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  planCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardHighlight: {
    borderColor: '#0D9488',
    borderWidth: 2,
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planCardName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 4,
  },
  planCardPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  planCardPeriod: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  planFeaturesWrap: {
    gap: 6,
    marginBottom: 14,
  },
  planFeatureLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planFeatureText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  planActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#0D9488',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  planActionBtnHighlight: {
    backgroundColor: '#0D9488',
  },
  planActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },
  bottomCtaCard: {
    backgroundColor: '#0D9488',
    marginHorizontal: 16,
    marginTop: 22,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  bottomCtaTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  bottomCtaDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  bottomCtaBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bottomCtaBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
  },
  footerWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  footerSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
});
