import { useEffect, useState } from 'react';
import { useLogStore, useSocketStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Filter, Clock, User, FileText } from 'lucide-react';

export default function Logs() {
  const { connect } = useSocketStore();
  const { logs, fetchLogs, loading } = useLogStore();
  const [filter, setFilter] = useState({ action: '', actor: '' });

  useSocketEvents();

  useEffect(() => {
    connect();
    fetchLogs({ limit: 100 });
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter.action && !log.action.toLowerCase().includes(filter.action.toLowerCase())) return false;
    if (filter.actor && log.actor !== filter.actor) return false;
    return true;
  });

  const getActionColor = (action) => {
    if (action.includes('CREATED')) return 'text-accent-green';
    if (action.includes('DELETED')) return 'text-accent-red';
    if (action.includes('FAILED')) return 'text-accent-red';
    if (action.includes('CHANGED')) return 'text-accent-amber';
    if (action.includes('ASSIGNED')) return 'text-accent-cyan';
    return 'text-slate-300';
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-slate-800 bg-[#0e1216] flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">System Logs</h1>
          <ConnectionStatus />
        </header>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-surface-dark flex items-center gap-4">
          <input
            type="text"
            placeholder="Filter by action..."
            value={filter.action}
            onChange={(e) => setFilter(f => ({ ...f, action: e.target.value }))}
            className="px-3 py-2 bg-background-dark border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Filter by actor..."
            value={filter.actor}
            onChange={(e) => setFilter(f => ({ ...f, actor: e.target.value }))}
            className="px-3 py-2 bg-background-dark border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-auto">
          <div className="font-mono text-sm">
            {filteredLogs.map((log) => (
              <div 
                key={log._id} 
                className="px-6 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-400 shrink-0">[{log.actor}]</span>
                  <span className={`font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </div>
                {log.reasoningSummary && (
                  <p className="mt-1 text-slate-300 pl-32">{log.reasoningSummary}</p>
                )}
              </div>
            ))}
          </div>
          
          {filteredLogs.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400">
              No logs found
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
