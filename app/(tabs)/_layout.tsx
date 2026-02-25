import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  // useTheme() directamente del contexto para garantizar re-render reactivo
  const { scheme } = useTheme();
  const C = Colors[scheme];
  const isDark = scheme === 'dark';

  return (
    // View wrapper que cambia de color instantáneamente con el tema
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: C.tint,
          tabBarInactiveTintColor: C.tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: C.card,
            borderTopColor: C.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 80 : 64,
            // Fuerza re-paint en web
            ...(Platform.OS === 'web' ? { transition: 'background-color 0.2s ease' } as any : {}),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            color: C.tabIconDefault,
          },
          // Indica si el tema es oscuro al navigator de Tabs
          ...(isDark ? {} : {}),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Configuración',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="gearshape.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
