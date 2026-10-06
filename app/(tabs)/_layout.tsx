import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '../../src/theme';
import { learnRepo } from '../../src/db/repos/learnRepo';

export default function TabLayout() {
  const { colors } = useTheme();
  const [hasDueReviews, setHasDueReviews] = useState(false);

  useEffect(() => {
    let ignore = false;
    learnRepo
      .getDueReviews(Date.now())
      .then((dues) => {
        if (!ignore) {
          setHasDueReviews(dues.length > 0);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.hairline,
          borderTopWidth: 0.5,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <SymbolView name="calendar.day.timeline.left" tintColor={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <SymbolView name="calendar" tintColor={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color }) => (
            <SymbolView name="timer" tintColor={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarBadge: hasDueReviews ? '●' : undefined,
          tabBarBadgeStyle: {
            fontSize: 8,
            color: colors.accent,
            backgroundColor: 'transparent',
          },
          tabBarIcon: ({ color }) => (
            <SymbolView name="book" tintColor={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => (
            <SymbolView name="dumbbell" tintColor={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
