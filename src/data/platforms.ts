/**
 * The three fictional platform notification formats, per CLAUDE.md §7.
 * Deliberately varied field order/labels/leg count, so RiderMate's parser
 * table has to be a real table rather than one hardcoded regex.
 */

export type PlatformId = 'veloxa' | 'nimbo' | 'karam';

export interface PlatformTemplate {
  title: string;
  body: string;
  largeBody?: string;
}

export interface Platform {
  id: PlatformId;
  label: string;
  template: PlatformTemplate;
}

export const PLATFORMS: Platform[] = [
  {
    id: 'veloxa',
    label: 'Veloxa Rides',
    template: {
      title: 'New ride · ₹{total}',
      body: 'Pickup {pickupKm} km · Drop {dropKm} km · {pickupArea} → {dropArea}',
      largeBody:
        'Fare ₹{fare} + ₹{cash} collect\nPickup: {pickupArea} ({pickupKm} km)\nDrop: {dropArea} ({dropKm} km)',
    },
  },
  {
    id: 'nimbo',
    label: 'Nimbo Mart',
    template: {
      title: 'New order #{orderId}',
      body: '₹{total} · {dropKm} km · {storeName}',
    },
  },
  {
    id: 'karam',
    label: 'Karam Eats',
    template: {
      title: 'Order available',
      body: '₹{total} payout · {dropKm} km · {dropArea}',
    },
  },
];

export function getPlatform(id: PlatformId): Platform {
  const platform = PLATFORMS.find((p) => p.id === id);
  if (!platform) {
    throw new Error(`Unknown platform: ${id}`);
  }
  return platform;
}
