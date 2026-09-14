import { useEffect, useState } from 'react';
import { initNotifications, postMockNotification } from './lib/notify';

const SAMPLE_NOTIFICATION = {
  id: 1,
  channelId: 'veloxa_orders' as const,
  title: 'New ride · ₹60',
  body: 'Pickup 1.0 km · Drop 3.4 km · Koramangala → Indiranagar',
  largeBody:
    'Fare ₹48 + ₹12 collect\nPickup: Koramangala (1.0 km)\nDrop: Indiranagar (3.4 km)',
};

function App() {
  const [status, setStatus] = useState('Initializing…');

  useEffect(() => {
    initNotifications()
      .then(() => setStatus('Ready'))
      .catch((err) => setStatus(`Init failed: ${String(err)}`));
  }, []);

  const handleFire = async () => {
    setStatus('Firing…');
    try {
      await postMockNotification(SAMPLE_NOTIFICATION);
      setStatus('Fired — check the notification shade.');
    } catch (err) {
      setStatus(`Fire failed: ${String(err)}`);
    }
  };

  return (
    <div>
      <h1>Veloxa</h1>
      <p>M1 notification core test — no styling yet.</p>
      <p>Status: {status}</p>
      <button onClick={handleFire}>Fire</button>
    </div>
  );
}

export default App;
