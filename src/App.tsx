import { useEffect, useState } from 'react';
import CutProgressDashboard from './CutProgressDashboard';
import type { DashboardDataLoadResult } from './types';
import { loadDashboardData } from './utils/runtimeData';

function App() {
  const [result, setResult] = useState<DashboardDataLoadResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadDashboardData()
      .then((loaded) => {
        if (!cancelled) setResult(loaded);
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            dataSource: 'error',
            errorMessage: err instanceof Error ? err.message : 'Failed to load dashboard data.',
            data: null,
            syncMetadata: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Loading dashboard data...
      </div>
    );
  }

  if (!result.data || !result.syncMetadata) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-red-200">
          <p className="font-semibold">Unable to load dashboard data.</p>
          <p className="text-sm mt-2 text-red-100/90">{result.errorMessage ?? 'No recovery snapshot is available.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <CutProgressDashboard
        rawData={result.data}
        syncMetadata={result.syncMetadata}
        dataSource={result.dataSource}
        dataUrl={result.dataUrl}
        errorMessage={result.errorMessage}
      />
    </div>
  );
}

export default App;
