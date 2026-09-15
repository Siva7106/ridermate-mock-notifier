import { useEffect, useState } from 'react';
import { initNotifications, postMockNotification } from './lib/notify';
import { buildScenarioNotifications } from './lib/templating';
import { buildReplayNotification, type CaptureEntry } from './lib/capturePack';
import { SCENARIOS, type OrderFields, type ScenarioPreset } from './data/scenarios';
import type { PlatformId } from './data/platforms';
import OrderCard from './screens/OrderCard';
import ControlPanel, { type FireDelayMs } from './screens/ControlPanel';
import ReplayTab from './screens/ReplayTab';

interface PanelState {
  scenarioId: string | null;
  platform: PlatformId;
  fields: OrderFields;
  fireDelayMs: FireDelayMs;
}

const STORAGE_KEY = 'veloxa.panelState';

function defaultPanelState(): PanelState {
  const initial = SCENARIOS[0];
  return {
    scenarioId: initial.id,
    platform: initial.platform,
    fields: initial.display,
    fireDelayMs: 0,
  };
}

function loadPanelState(): PanelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultPanelState(), ...(JSON.parse(raw) as Partial<PanelState>) };
    }
  } catch {
    // Corrupt or unavailable storage — fall back to defaults.
  }
  return defaultPanelState();
}

let nextNotificationId = 1;

const VIEWS = ['card', 'panel', 'replay'] as const;
type View = (typeof VIEWS)[number];

function App() {
  const [view, setView] = useState<View>('card');
  const [panelState, setPanelState] = useState<PanelState>(loadPanelState);

  useEffect(() => {
    initNotifications().catch((err) => {
      console.error('Failed to initialize notifications', err);
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(panelState));
    } catch {
      // Best-effort persistence only.
    }
  }, [panelState]);

  const applyScenario = (scenarioId: string) => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    setPanelState((s) => ({
      ...s,
      scenarioId,
      platform: scenario.platform,
      fields: scenario.display,
    }));
  };

  const fireCurrent = async () => {
    const matchedScenario = panelState.scenarioId
      ? SCENARIOS.find((s) => s.id === panelState.scenarioId)
      : undefined;

    // A matched, untouched preset keeps its special behavior (the
    // notificationOverride / burstCount of truncated / burst_of_three).
    // Hand-edited fields fall through to plain templating, since the
    // override text no longer represents whatever was actually edited.
    const preset: ScenarioPreset = matchedScenario
      ? { ...matchedScenario, platform: panelState.platform, display: panelState.fields }
      : {
          id: 'custom',
          label: 'Custom',
          description: '',
          platform: panelState.platform,
          display: panelState.fields,
        };

    const notifications = buildScenarioNotifications(preset, nextNotificationId);
    nextNotificationId += notifications.length;

    for (const notification of notifications) {
      await postMockNotification(notification, panelState.fireDelayMs);
    }
  };

  const fireReplay = async (entry: CaptureEntry) => {
    const notification = buildReplayNotification(entry, nextNotificationId);
    nextNotificationId += 1;
    await postMockNotification(notification, panelState.fireDelayMs);
  };

  const nextView = VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length];

  return (
    <>
      {view === 'card' && (
        <OrderCard fields={panelState.fields} onAccept={fireCurrent} />
      )}
      {view === 'panel' && (
        <ControlPanel
          scenarioId={panelState.scenarioId}
          platform={panelState.platform}
          fields={panelState.fields}
          fireDelayMs={panelState.fireDelayMs}
          onSelectScenario={applyScenario}
          onFieldsChange={(fields) =>
            setPanelState((s) => ({ ...s, fields, scenarioId: null }))
          }
          onPlatformChange={(platform) =>
            setPanelState((s) => ({ ...s, platform, scenarioId: null }))
          }
          onDelayChange={(fireDelayMs) =>
            setPanelState((s) => ({ ...s, fireDelayMs }))
          }
          onFire={fireCurrent}
        />
      )}
      {view === 'replay' && <ReplayTab onFire={fireReplay} />}
      <button
        type="button"
        className="veloxa-view-tab"
        onClick={() => setView(nextView)}
      >
        {nextView.toUpperCase()}
      </button>
    </>
  );
}

export default App;
