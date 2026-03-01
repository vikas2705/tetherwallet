import React from 'react'
import { Tabs } from 'expo-router'
import { View, StyleSheet, Text } from 'react-native'
import { Colors } from '../../src/theme/colors'

function TabIcon({
  focused,
  emoji,
}: {
  focused: boolean
  emoji: string
}) {
  return (
    <View style={[styles.tabBarIcon, focused && styles.tabBarIconFocused]}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.6 }]}>{emoji}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="💼" />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🔄" />,
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: 'Wallets',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👛" />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBarIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarIconFocused: {
    backgroundColor: Colors.primaryMuted,
  },
  tabEmoji: {
    fontSize: 20,
  },
})
