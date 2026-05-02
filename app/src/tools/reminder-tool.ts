import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function createReminder(text: string, triggerDate: Date): Promise<string> {
  const granted = await ensureNotificationPermission();
  if (!granted) return 'Notification permission not granted.';

  const now = new Date();
  const secondsFromNow = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));

  if (secondsFromNow <= 0) return 'That time has already passed.';

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lyla Reminder',
      body: text,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  const timeStr = triggerDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = triggerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Reminder set: "${text}" on ${dateStr} at ${timeStr}`;
}

export async function listReminders(): Promise<string> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (scheduled.length === 0) return 'No active reminders.';

  const lines = scheduled.map(n => {
    const trigger = n.trigger as Notifications.DateTriggerInput;
    const date = trigger.date ? new Date(trigger.date) : null;
    const dateStr = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'unknown time';
    return `- ${dateStr}: ${n.content.body}`;
  });

  return `Active reminders:\n${lines.join('\n')}`;
}
