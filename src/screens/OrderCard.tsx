import { useEffect, useRef, useState } from 'react';
import { postMockNotification } from '../lib/notify';
import '../styles/order-card.css';

const TOTAL_SECONDS = 15;
const RING_RADIUS = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Same strings the M1 notification-core test already verified on-device
// (exact android.title / android.text / android.bigText match). Scenario
// templating arrives in M3 — this card just demonstrates the real UI.
const ORDER = {
  fare: 48,
  cash: 12,
  total: 60,
  payment: 'CASH',
  pickupKm: 1.0,
  dropKm: 3.4,
  pickupArea: 'Koramangala',
  dropArea: 'Indiranagar',
};

const SAMPLE_NOTIFICATION = {
  id: 1,
  channelId: 'veloxa_orders' as const,
  title: `New ride · ₹${ORDER.total}`,
  body: `Pickup ${ORDER.pickupKm.toFixed(1)} km · Drop ${ORDER.dropKm.toFixed(1)} km · ${ORDER.pickupArea} → ${ORDER.dropArea}`,
  largeBody: `Fare ₹${ORDER.fare} + ₹${ORDER.cash} collect\nPickup: ${ORDER.pickupArea} (${ORDER.pickupKm.toFixed(1)} km)\nDrop: ${ORDER.dropArea} (${ORDER.dropKm.toFixed(1)} km)`,
};

function playAppearChime() {
  try {
    const ctx = new AudioContext();
    void ctx.resume();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });
    setTimeout(() => void ctx.close(), 500);
  } catch {
    // Sound is a nice-to-have for the demo, never block on it.
  }
}

function OrderCard() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [appearanceKey, setAppearanceKey] = useState(0);
  const [status, setStatus] = useState('');
  const statusTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const rearm = () => {
    setSecondsLeft(TOTAL_SECONDS);
    setAppearanceKey((k) => k + 1);
  };

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setAppearanceKey((k) => k + 1);
          return TOTAL_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    playAppearChime();
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [appearanceKey]);

  const showStatus = (message: string) => {
    setStatus(message);
    clearTimeout(statusTimeout.current);
    statusTimeout.current = setTimeout(() => setStatus(''), 4000);
  };

  const handleReject = () => {
    showStatus('');
    rearm();
  };

  const handleAccept = async () => {
    showStatus('Posting notification…');
    try {
      await postMockNotification(SAMPLE_NOTIFICATION);
      showStatus('Order accepted — check the notification shade.');
    } catch (err) {
      showStatus(`Failed: ${String(err)}`);
    }
    rearm();
  };

  const dashOffset = RING_CIRCUMFERENCE * (1 - secondsLeft / TOTAL_SECONDS);

  return (
    <div className="veloxa-backdrop">
      <div className="veloxa-card" key={appearanceKey}>
        <div className="veloxa-header">
          <span className="veloxa-pill">🔷 New Order</span>
          <div className="veloxa-countdown">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle
                className="veloxa-countdown-track"
                cx="22"
                cy="22"
                r={RING_RADIUS}
              />
              <circle
                className="veloxa-countdown-progress"
                cx="22"
                cy="22"
                r={RING_RADIUS}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <span className="veloxa-countdown-label">{secondsLeft}</span>
          </div>
        </div>

        <div className="veloxa-fare-row">
          <span className="veloxa-fare">₹{ORDER.total}</span>
          <span className="veloxa-payment-chip">{ORDER.payment}</span>
        </div>

        <div className="veloxa-route">
          <div className="veloxa-route-markers">
            <span className="veloxa-marker-filled" />
            <span className="veloxa-connector" />
            <span className="veloxa-marker-hollow" />
          </div>
          <div className="veloxa-route-legs">
            <div className="veloxa-leg">
              <div className="veloxa-leg-distance">
                {ORDER.pickupKm.toFixed(1)} km
              </div>
              <div className="veloxa-leg-address">{ORDER.pickupArea}</div>
            </div>
            <div className="veloxa-leg">
              <div className="veloxa-leg-distance">
                {ORDER.dropKm.toFixed(1)} km
              </div>
              <div className="veloxa-leg-address">{ORDER.dropArea}</div>
            </div>
          </div>
        </div>

        <div className="veloxa-total">
          {(ORDER.pickupKm + ORDER.dropKm).toFixed(1)} km total
        </div>

        <div className="veloxa-actions">
          <button
            type="button"
            className="veloxa-reject-btn"
            aria-label="Reject order"
            onClick={handleReject}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M4 4L14 14M14 4L4 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="veloxa-accept-btn"
            onClick={handleAccept}
          >
            ACCEPT
          </button>
        </div>

        <div className="veloxa-status">{status}</div>
      </div>

      <span className="veloxa-watermark">SIMULATOR</span>
    </div>
  );
}

export default OrderCard;
