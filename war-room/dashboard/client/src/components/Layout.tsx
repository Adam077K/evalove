import { useState } from 'react';
import { useStore } from '../store';
import { CeoCardGrid } from './CeoCardGrid';
import { EventTimeline } from './EventTimeline';
import { FileConflicts } from './FileConflicts';
import { CostSummary } from './CostSummary';
import { RecentCommits } from './RecentCommits';
import { OfficeCanvas } from '../office/OfficeCanvas';
import { formatCost } from '../lib/format';

export function Layout() {
  const { isConnected, isRunning, ceos, totalCostUsd, recentCommits, fileConflicts, recentEvents } = useStore();
  const [showOffice, setShowOffice] = useState(true);

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="border-b border-surface0 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-peach font-bold text-lg">{{PROJECT_NAME_UPPER}} WAR ROOM</h1>
          {isRunning ? (
            <span className="text-xs bg-green/10 text-green px-2 py-1 rounded">
              {ceos.length} CEO{ceos.length !== 1 ? 's' : ''} active
            </span>
          ) : (
            <span className="text-xs bg-surface0 text-overlay0 px-2 py-1 rounded">
              No war room running
            </span>
          )}
          <button
            onClick={() => setShowOffice(!showOffice)}
            className="text-xs px-2 py-1 rounded bg-surface0 text-subtext0 hover:bg-surface1 transition-colors"
          >
            {showOffice ? 'Hide Office' : 'Show Office'}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-peach font-mono font-bold">{formatCost(totalCostUsd)}</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green' : 'bg-red animate-pulse'}`} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* Main area */}
        <main className="flex-1 p-6">
          {/* 2D Office */}
          {showOffice && isRunning && (
            <div className="mb-6 w-full">
              <OfficeCanvas />
            </div>
          )}

          {/* CEO Cards */}
          <CeoCardGrid ceos={ceos} />
        </main>

        {/* Sidebar */}
        <aside className="w-80 border-l border-surface0 p-4 space-y-4 hidden lg:block">
          <CostSummary ceos={ceos} totalCost={totalCostUsd} />
          <FileConflicts conflicts={fileConflicts} />
          <RecentCommits commits={recentCommits} />
          <EventTimeline events={recentEvents} />
        </aside>
      </div>
    </div>
  );
}
