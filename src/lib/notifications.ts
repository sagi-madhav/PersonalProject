import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior for when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return requested.granted;
}

export async function scheduleTimerEndNotification(
  triggerEpochMs: number,
  title: string,
  body: string
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const secondsFromNow = Math.max(1, Math.round((triggerEpochMs - Date.now()) / 1000));

    // Cap pending notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.length >= 50) {
      // Remove oldest
      await Notifications.cancelScheduledNotificationAsync(scheduled[0].identifier);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
      },
    });

    return id;
  } catch (err) {
    console.warn('Failed to schedule local notification:', err);
    return null;
  }
}

export async function cancelNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('Failed to cancel notification:', err);
  }
}
