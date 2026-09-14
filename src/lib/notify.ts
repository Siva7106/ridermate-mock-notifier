import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * The only module that posts a notification. Everything else builds a
 * payload object and hands it over. See CLAUDE.md §6 and §7.
 */

export const VELOXA_CHANNEL_ID = 'veloxa_orders';

export type MockNotification = {
  id: number;
  channelId: typeof VELOXA_CHANNEL_ID;
  title: string;
  body: string;
  largeBody?: string;
  summaryText?: string;
  group?: string;
  groupSummary?: boolean;
  extra?: Record<string, unknown>;
};

let channelReady: Promise<void> | null = null;

function ensureChannel(): Promise<void> {
  if (!channelReady) {
    channelReady = LocalNotifications.createChannel({
      id: VELOXA_CHANNEL_ID,
      name: 'Veloxa Orders',
      description: 'Simulated ride order notifications',
      importance: 4, // IMPORTANCE_HIGH
      visibility: 1,
      vibration: true,
      lights: true,
    });
  }
  return channelReady;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const status = await LocalNotifications.checkPermissions();
  if (status.display === 'granted') {
    return true;
  }
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === 'granted';
}

/**
 * Call once on app launch: creates the channel and requests the
 * Android 13+ POST_NOTIFICATIONS permission up front, so the demo
 * never shows a permission dialog on stage.
 */
export async function initNotifications(): Promise<void> {
  await ensureChannel();
  await ensureNotificationPermission();
}

export async function postMockNotification(
  payload: MockNotification,
  delayMs = 0
): Promise<void> {
  await ensureChannel();

  const granted = await ensureNotificationPermission();
  if (!granted) {
    throw new Error('Notification permission was not granted.');
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: payload.id,
        channelId: payload.channelId,
        title: payload.title,
        body: payload.body,
        largeBody: payload.largeBody,
        summaryText: payload.summaryText,
        group: payload.group,
        groupSummary: payload.groupSummary,
        extra: payload.extra,
        schedule: delayMs > 0 ? { at: new Date(Date.now() + delayMs) } : undefined,
      },
    ],
  });
}
