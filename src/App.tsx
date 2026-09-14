import { useEffect } from 'react';
import { initNotifications } from './lib/notify';
import OrderCard from './screens/OrderCard';

function App() {
  useEffect(() => {
    initNotifications().catch((err) => {
      console.error('Failed to initialize notifications', err);
    });
  }, []);

  return <OrderCard />;
}

export default App;
