import { useRef, useState } from 'react';
import { loadCapturePack, importCaptures, type CaptureEntry } from '../lib/capturePack';
import '../styles/replay.css';

interface ReplayTabProps {
  onFire: (entry: CaptureEntry) => Promise<void>;
}

function ReplayTab({ onFire }: ReplayTabProps) {
  const [entries, setEntries] = useState<CaptureEntry[]>(() => loadCapturePack());
  const [status, setStatus] = useState('');
  const [firingId, setFiringId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const result = importCaptures(text);
    setEntries(loadCapturePack());
    const skipped = result.errors.length;
    setStatus(
      `Imported: ${result.added} added, ${result.replaced} replaced` +
        (skipped > 0 ? `, ${skipped} skipped.` : '.')
    );
  };

  const handleFire = async (entry: CaptureEntry) => {
    setFiringId(entry.id);
    setStatus(`Firing "${entry.title}"…`);
    try {
      await onFire(entry);
      setStatus('Fired — check the notification shade.');
    } catch (err) {
      setStatus(`Failed: ${String(err)}`);
    } finally {
      setFiringId(null);
    }
  };

  return (
    <div className="veloxa-replay">
      <h1 className="veloxa-panel-title">Replay — Real Captures</h1>
      <p className="veloxa-field-hint">
        Fires captured notification text verbatim, with no templating — see CLAUDE.md §2.
      </p>

      <button
        type="button"
        className="veloxa-segmented-btn veloxa-replay-import-btn"
        onClick={() => fileInputRef.current?.click()}
      >
        Import JSON…
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
          e.target.value = '';
        }}
      />

      {entries.length === 0 ? (
        <div className="veloxa-replay-empty">
          No captures yet. Capture real order notifications on-device (CLAUDE.md §2) and import the
          JSON export above, or drop a <code>capture-pack.json</code> into <code>src/data/</code> and
          rebuild.
        </div>
      ) : (
        <ul className="veloxa-replay-list">
          {entries.map((entry) => (
            <li key={entry.id} className="veloxa-replay-item">
              <div className="veloxa-replay-item-header">
                <span className="veloxa-replay-platform">{entry.platform}</span>
                <span className="veloxa-field-hint">{entry.capturedAt}</span>
              </div>
              <div className="veloxa-replay-title">{entry.title}</div>
              <div className="veloxa-replay-body">{entry.body}</div>
              {entry.notes && <div className="veloxa-field-hint">{entry.notes}</div>}
              <button
                type="button"
                className="veloxa-fire-btn veloxa-replay-fire"
                disabled={firingId === entry.id}
                onClick={() => handleFire(entry)}
              >
                Fire
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="veloxa-panel-status">{status}</div>
    </div>
  );
}

export default ReplayTab;
