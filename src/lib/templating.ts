import { VELOXA_CHANNEL_ID, type MockNotification } from './notify';
import { getPlatform } from '../data/platforms';
import type { OrderFields, ScenarioPreset } from '../data/scenarios';

/**
 * Fills `{placeholder}` tokens in a format string. Unknown placeholders are
 * left as-is rather than throwing, so a template referencing a field a
 * scenario doesn't provide fails loud and visible instead of crashing.
 */
export function fillTemplate(
  template: string,
  fields: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = fields[key];
    return value === undefined ? match : String(value);
  });
}

function toTemplateFields(display: OrderFields): Record<string, string | number> {
  return {
    total: display.total,
    fare: display.fare,
    cash: display.cash,
    pickupKm: display.pickupKm.toFixed(1),
    dropKm: display.dropKm.toFixed(1),
    pickupArea: display.pickupArea,
    dropArea: display.dropArea,
    orderId: display.orderId ?? '',
    storeName: display.storeName ?? '',
  };
}

/**
 * Builds the notification(s) a scenario actually posts. Field-driven
 * scenarios get their platform's template filled from `display`; scenarios
 * with a `notificationOverride` (truncated / minimal_info) send that literal
 * text instead, regardless of what the order card is showing. Expands to
 * `burstCount` copies sharing one group for burst scenarios.
 */
export function buildScenarioNotifications(
  preset: ScenarioPreset,
  baseId: number
): MockNotification[] {
  const count = preset.burstCount ?? 1;
  const group = count > 1 ? `veloxa_${preset.id}` : undefined;

  const content = preset.notificationOverride ?? (() => {
    const platform = getPlatform(preset.platform);
    const fields = toTemplateFields(preset.display);
    return {
      title: fillTemplate(platform.template.title, fields),
      body: fillTemplate(platform.template.body, fields),
      largeBody: platform.template.largeBody
        ? fillTemplate(platform.template.largeBody, fields)
        : undefined,
    };
  })();

  return Array.from({ length: count }, (_, i) => ({
    id: baseId + i,
    channelId: VELOXA_CHANNEL_ID,
    title: content.title,
    body: content.body,
    largeBody: content.largeBody,
    group,
  }));
}
