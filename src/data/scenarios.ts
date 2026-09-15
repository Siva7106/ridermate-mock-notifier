import type { PlatformId } from './platforms';

/**
 * Named scenario presets, per CLAUDE.md §9. This is the demo script: each
 * preset demonstrates a specific RiderMate behavior (profit glance, warning
 * flags, both-legs calculation, degraded-input fallback).
 *
 * Real captures are replayed separately — see `lib/capturePack.ts` and
 * `screens/ReplayTab.tsx` — since they fire verbatim with no templating.
 */

export interface OrderFields {
  fare: number;
  cash: number;
  total: number;
  payment: 'CASH' | 'ONLINE';
  pickupKm: number;
  dropKm: number;
  pickupArea: string;
  dropArea: string;
  orderId?: string;
  storeName?: string;
}

export interface NotificationOverride {
  title: string;
  body: string;
  largeBody?: string;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  platform: PlatformId;
  /** Always the full/accurate order — drives the order card's UI. */
  display: OrderFields;
  /**
   * When set, this is what actually gets sent instead of the templated
   * text — even though `display` still shows the real order. Used for the
   * deliberately-degraded scenarios (truncated / minimal_info).
   */
  notificationOverride?: NotificationOverride;
  /** Fires this many copies sharing one notification group (burst_of_three). */
  burstCount?: number;
}

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'good_order',
    label: 'Good order',
    description: 'Profit glance shows healthy net ₹',
    platform: 'veloxa',
    display: {
      fare: 75,
      cash: 20,
      total: 95,
      payment: 'CASH',
      pickupKm: 1.2,
      dropKm: 3.0,
      pickupArea: 'HSR Layout',
      dropArea: 'Sarjapur Road',
    },
  },
  {
    id: 'bad_order',
    label: 'Bad order',
    description: "Profit warning fires — below rider's ₹/km baseline",
    platform: 'veloxa',
    display: {
      fare: 30,
      cash: 8,
      total: 38,
      payment: 'CASH',
      pickupKm: 2.5,
      dropKm: 9.4,
      pickupArea: 'Whitefield',
      dropArea: 'Electronic City',
    },
  },
  {
    id: 'unusual_payout',
    label: 'Unusual payout',
    description: 'Unusual-payout flag',
    platform: 'veloxa',
    display: {
      fare: 25,
      cash: 5,
      total: 30,
      payment: 'CASH',
      pickupKm: 0.5,
      dropKm: 7.0,
      pickupArea: 'Indiranagar',
      dropArea: 'Hebbal',
    },
  },
  {
    id: 'long_pickup_trap',
    label: 'Long pickup trap',
    description:
      'Both-legs calculation matters — looks fine on drop distance alone, bad on total',
    platform: 'veloxa',
    display: {
      fare: 55,
      cash: 15,
      total: 70,
      payment: 'CASH',
      pickupKm: 6.0,
      dropKm: 1.5,
      pickupArea: 'Yelahanka',
      dropArea: 'Hebbal',
    },
  },
  {
    id: 'burst_of_three',
    label: 'Burst of three',
    description: "Android grouping/collapse — RiderMate's degraded-input handling",
    platform: 'veloxa',
    display: {
      fare: 20,
      cash: 5,
      total: 25,
      payment: 'CASH',
      pickupKm: 0.8,
      dropKm: 1.5,
      pickupArea: 'Koramangala',
      dropArea: 'Indiranagar',
    },
    burstCount: 3,
  },
  {
    id: 'truncated',
    label: 'Truncated',
    description: 'Partial parse → manual-entry fallback prompt',
    platform: 'veloxa',
    display: {
      fare: 40,
      cash: 12,
      total: 52,
      payment: 'CASH',
      pickupKm: 1.8,
      dropKm: 4.2,
      pickupArea: 'Jayanagar',
      dropArea: 'Malleswaram',
    },
    notificationOverride: {
      title: 'New ride · ₹52',
      body: 'Pickup 1.8 km · Drop 4.2 km · Jayanagar → Malles',
    },
  },
  {
    id: 'minimal_info',
    label: 'Minimal info',
    description: 'Full fallback path — manual entry card',
    platform: 'veloxa',
    display: {
      fare: 0,
      cash: 0,
      total: 0,
      payment: 'CASH',
      pickupKm: 0,
      dropKm: 0,
      pickupArea: '—',
      dropArea: '—',
    },
    notificationOverride: {
      title: 'New ride available',
      body: '',
    },
  },
];

export function getScenario(id: string): ScenarioPreset | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
