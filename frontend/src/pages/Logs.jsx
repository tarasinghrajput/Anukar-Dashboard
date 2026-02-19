import { useEffect, useState } from 'react';
import { useLogStore, useSocketStore, useThemeStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';

export default function Logs() {
  const { connect } = useSocketStore();
  const { logs, fetchLogs, loading } = useLogStore();
  const { initTheme, theme } = useThemeStore();
  const [filter, setFilter] = useState({ action: '', actor: '' });

  useSocketEvents();

  useEffect(() => {
    initTheme();
    connect();
    fetchLogs({ limit: 100 });
  }, []);

  const isDark = theme === 'dark';

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
    return isDark ? 'text-slate-300' : 'text-slate-700';
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>System Logs</h1>
          <ConnectionStatus />
        </header>

        <div className={`p-4 border-b flex items-center gap-4 ${
          isDark ? 'border-slate-800 bg-surface-dark' : 'border-slate-200 bg-slate-50'
        }`}>
          <input
            type="text"
            placeholder="Filter by action..."
            value={filter.action}
            onChange={(e) => setFilter(f => ({ ...f, action: e.target.value }))}
            className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary ${
              isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
          <input
            type="text"
            placeholder="Filter by actor..."
            value={filter.actor}
            onChange={(e) => setFilter(f => ({ ...f, actor: e.target.value }))}
            className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary ${
              isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
        </div>

        <div className="flex-1 overflow-auto">
          <div className="font-mono text-sm">
            {filteredLogs.map((log) => (
              <div key={log._id} className={`px-6 py-3 border-b transition-colors ${
                isDark ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-start gap-4">
                  <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="text-slate-400 shrink-0">[{log.actor}]</span>
                  <span className={`font-medium ${getActionColor(log.action)}`}>{log.action}</span>
                </div>
                {log.reasoningSummary && (
                  <p className={`mt-1 pl-32 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{log.reasoningSummary}</p>
                )}
              </div>
            ))}
          </div>
          
          {filteredLogs.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400">No logs found</div>
          )}
        </div>
      </main>
    </div>
  );
}
