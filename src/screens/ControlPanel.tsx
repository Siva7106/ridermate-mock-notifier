import { useState } from 'react';
import { PLATFORMS, type PlatformId } from '../data/platforms';
import { SCENARIOS, type OrderFields } from '../data/scenarios';
import '../styles/control-panel.css';

export type FireDelayMs = 0 | 5000 | 10000;

const DELAY_OPTIONS: { label: string; value: FireDelayMs }[] = [
  { label: '0s', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
];

interface ControlPanelProps {
  scenarioId: string | null;
  platform: PlatformId;
  fields: OrderFields;
  fireDelayMs: FireDelayMs;
  onSelectScenario: (id: string) => void;
  onFieldsChange: (fields: OrderFields) => void;
  onPlatformChange: (platform: PlatformId) => void;
  onDelayChange: (delay: FireDelayMs) => void;
  onFire: () => Promise<void>;
}

function ControlPanel({
  scenarioId,
  platform,
  fields,
  fireDelayMs,
  onSelectScenario,
  onFieldsChange,
  onPlatformChange,
  onDelayChange,
  onFire,
}: ControlPanelProps) {
  const [status, setStatus] = useState('');
  const [firing, setFiring] = useState(false);

  const updateField = <K extends keyof OrderFields>(
    key: K,
    value: OrderFields[K]
  ) => {
    const next = { ...fields, [key]: value };
    if (key === 'fare' || key === 'cash') {
      next.total = next.fare + next.cash;
    }
    onFieldsChange(next);
  };

  const handleFire = async () => {
    setFiring(true);
    setStatus('Firing…');
    try {
      await onFire();
      setStatus('Fired — check the notification shade.');
    } catch (err) {
      setStatus(`Failed: ${String(err)}`);
    } finally {
      setFiring(false);
    }
  };

  return (
    <div className="veloxa-panel">
      <h1 className="veloxa-panel-title">Control Panel</h1>

      <label className="veloxa-field">
        <span>Scenario preset</span>
        <select
          value={scenarioId ?? ''}
          onChange={(e) => onSelectScenario(e.target.value)}
        >
          <option value="" disabled>
            Custom (hand-edited)
          </option>
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {scenarioId && (
          <span className="veloxa-field-hint">
            {SCENARIOS.find((s) => s.id === scenarioId)?.description}
          </span>
        )}
      </label>

      <label className="veloxa-field">
        <span>Platform</span>
        <select
          value={platform}
          onChange={(e) => onPlatformChange(e.target.value as PlatformId)}
        >
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className="veloxa-field-row">
        <label className="veloxa-field">
          <span>Fare (₹)</span>
          <input
            type="number"
            value={fields.fare}
            onChange={(e) => updateField('fare', Number(e.target.value))}
          />
        </label>
        <label className="veloxa-field">
          <span>Cash (₹)</span>
          <input
            type="number"
            value={fields.cash}
            onChange={(e) => updateField('cash', Number(e.target.value))}
          />
        </label>
      </div>
      <div className="veloxa-field-hint">Total: ₹{fields.total}</div>

      <div className="veloxa-field-row">
        <label className="veloxa-field">
          <span>Pickup (km)</span>
          <input
            type="number"
            step="0.1"
            value={fields.pickupKm}
            onChange={(e) => updateField('pickupKm', Number(e.target.value))}
          />
        </label>
        <label className="veloxa-field">
          <span>Drop (km)</span>
          <input
            type="number"
            step="0.1"
            value={fields.dropKm}
            onChange={(e) => updateField('dropKm', Number(e.target.value))}
          />
        </label>
      </div>

      <div className="veloxa-field-row">
        <label className="veloxa-field">
          <span>Pickup area</span>
          <input
            type="text"
            value={fields.pickupArea}
            onChange={(e) => updateField('pickupArea', e.target.value)}
          />
        </label>
        <label className="veloxa-field">
          <span>Drop area</span>
          <input
            type="text"
            value={fields.dropArea}
            onChange={(e) => updateField('dropArea', e.target.value)}
          />
        </label>
      </div>

      {platform === 'nimbo' && (
        <div className="veloxa-field-row">
          <label className="veloxa-field">
            <span>Order ID</span>
            <input
              type="text"
              value={fields.orderId ?? ''}
              onChange={(e) => updateField('orderId', e.target.value)}
            />
          </label>
          <label className="veloxa-field">
            <span>Store name</span>
            <input
              type="text"
              value={fields.storeName ?? ''}
              onChange={(e) => updateField('storeName', e.target.value)}
            />
          </label>
        </div>
      )}

      <div className="veloxa-field">
        <span>Fire delay</span>
        <div className="veloxa-segmented">
          {DELAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={
                fireDelayMs === opt.value
                  ? 'veloxa-segmented-btn active'
                  : 'veloxa-segmented-btn'
              }
              onClick={() => onDelayChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="veloxa-fire-btn"
        onClick={handleFire}
        disabled={firing}
      >
        Fire
      </button>

      <div className="veloxa-panel-status">{status}</div>
    </div>
  );
}

export default ControlPanel;
