import React from 'react';
import { Image, View } from 'react-native';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Receipt,
  UserCircle,
  Building,
  TrendingUp,
  Settings,
  Headphones,
} from 'lucide-react-native';
import Colors from '../../../src/constants/colors';
import { usePermissions } from '../../../src/hooks/usePermissions';
import { useAuth } from '../../../src/context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  const { hasModule, can, isSuperAdmin, isAdmin, isBilling } = usePermissions();

  const showAppointments = !isSuperAdmin && (hasModule('Appointments') || can('appointments.view'));
  const showPatients = !isSuperAdmin && (hasModule('Patients') || can('patient.basic'));
  const showNotes = !isSuperAdmin && (hasModule('Clinical Notes') || can('notes.view'));
  const showBilling = !isSuperAdmin && (hasModule('Billing') || hasModule('Billing & Payments') || isAdmin || isBilling);

  // SuperAdmin SaaS Specific Tabs
  const showTenants = isSuperAdmin;
  const showRevenue = isSuperAdmin;
  const showSettings = isSuperAdmin;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isSuperAdmin ? '#7E22CE' : Colors.primary,
        tabBarInactiveTintColor: Colors.slate,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. DASHBOARD */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={20} color={color} />,
        }}
      />

      {/* 👑 2. SUPERADMIN: ADMINS */}
      <Tabs.Screen
        name="tenants/index"
        options={{
          title: 'Admins',
          href: (showTenants ? '/(app)/(tabs)/tenants' : null) as any,
          tabBarIcon: ({ color, size }) => <Users size={20} color={color} />,
        }}
      />

      {/* 👑 3. SUPERADMIN: PAYMENTS */}
      <Tabs.Screen
        name="revenue/index"
        options={{
          title: 'Payments',
          href: (showRevenue ? '/(app)/(tabs)/revenue' : null) as any,
          tabBarIcon: ({ color, size }) => <Receipt size={20} color={color} />,
        }}
      />

      {/* 👑 4. SUPERADMIN: SETTING */}
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Setting',
          href: (showSettings ? '/(app)/(tabs)/settings' : null) as any,
          tabBarIcon: ({ color, size }) => <Settings size={20} color={color} />,
        }}
      />

      {/* 👑 5. SUPERADMIN: SUPPORT TICKETS */}
      <Tabs.Screen
        name="support/index"
        options={{
          title: 'Support Tickets',
          href: (isSuperAdmin ? '/(app)/(tabs)/support' : null) as any,
          tabBarIcon: ({ color, size }) => <Headphones size={20} color={color} />,
        }}
      />

      {/* 🏥 5. CLINIC: APPOINTMENTS SCHEDULE */}
      <Tabs.Screen
        name="appointments/index"
        options={{
          title: 'Schedule',
          href: (showAppointments ? '/(app)/(tabs)/appointments' : null) as any,
          tabBarIcon: ({ color, size }) => <Calendar size={20} color={color} />,
        }}
      />

      {/* 🏥 6. CLINIC: PATIENT DIRECTORY */}
      <Tabs.Screen
        name="patients/index"
        options={{
          title: 'Patients',
          href: (showPatients ? '/(app)/(tabs)/patients' : null) as any,
          tabBarIcon: ({ color, size }) => <Users size={20} color={color} />,
        }}
      />

      {/* 🏥 7. CLINIC: SOAP NOTES */}
      <Tabs.Screen
        name="notes/index"
        options={{
          title: 'Notes',
          href: (showNotes ? '/(app)/(tabs)/notes' : null) as any,
          tabBarIcon: ({ color, size }) => <FileText size={20} color={color} />,
        }}
      />

      {/* 🏥 8. CLINIC: INVOICES & BILLING */}
      <Tabs.Screen
        name="billing/index"
        options={{
          title: 'Billing',
          href: (showBilling ? '/(app)/(tabs)/billing' : null) as any,
          tabBarIcon: ({ color, size }) => <Receipt size={20} color={color} />,
        }}
      />

      {/* 👤 9. PROFILE & SETTINGS */}
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => {
            if (user?.photo) {
              return (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    overflow: 'hidden',
                    borderWidth: 1.5,
                    borderColor: focused ? (isSuperAdmin ? '#7E22CE' : Colors.primary) : '#94A3B8',
                  }}
                >
                  <Image
                    source={{ uri: user.photo }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              );
            }
            return <UserCircle size={20} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
