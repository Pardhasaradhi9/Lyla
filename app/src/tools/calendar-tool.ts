import * as Calendar from 'expo-calendar';

export async function ensureCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getTodayEvents(): Promise<string> {
  const granted = await ensureCalendarPermission();
  if (!granted) return 'Calendar permission not granted. Please enable it in Settings.';

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const eventCalendars = calendars.filter(c => c.allowsModifications || c.source.name !== 'Birthdays');

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const events = await Calendar.getEventsAsync(
    eventCalendars.map(c => c.id),
    startOfDay,
    endOfDay
  );

  if (events.length === 0) return "You have no events scheduled for today.";

  const lines = events
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map(e => {
      const start = new Date(e.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const end = new Date(e.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `- ${start} - ${end}: ${e.title}${e.location ? ` (${e.location})` : ''}`;
    });

  return `Today's schedule:\n${lines.join('\n')}`;
}

export async function getUpcomingEvents(days: number = 7): Promise<string> {
  const granted = await ensureCalendarPermission();
  if (!granted) return '';

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const eventCalendars = calendars.filter(c => c.allowsModifications || c.source.name !== 'Birthdays');

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days + 1);

  const events = await Calendar.getEventsAsync(
    eventCalendars.map(c => c.id),
    start,
    end
  );

  if (events.length === 0) return '';

  const lines = events
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 15)
    .map(e => {
      const date = new Date(e.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const time = new Date(e.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `- ${date} ${time}: ${e.title}`;
    });

  return `Upcoming:\n${lines.join('\n')}`;
}

export async function createEvent(title: string, startDate: Date, endDate: Date, location?: string): Promise<string> {
  const granted = await ensureCalendarPermission();
  if (!granted) return 'Calendar permission not granted.';

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar = calendars.find(c => c.allowsModifications && c.source.name === 'iCloud')
    || calendars.find(c => c.allowsModifications);

  if (!defaultCalendar) return 'No writable calendar found.';

  const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
    title,
    startDate,
    endDate,
    location: location || undefined,
  });

  const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `Created: "${title}" on ${dateStr} at ${timeStr}`;
}
