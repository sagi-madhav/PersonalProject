import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme';
import { learnRepo } from '../../src/db/repos/learnRepo';

import { AppIcon } from '../../src/components';

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
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'today' : 'today-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'calendar' : 'calendar-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'timer' : 'timer-outline'}
              color={color}
              size={22}
            />
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
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'school' : 'school-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'barbell' : 'barbell-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />
    </Tabs>
  );
}
