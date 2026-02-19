import { useEffect } from 'react';
import { useAgentStore, useSocketStore, useThemeStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Bot, Activity, Clock, CheckCircle } from 'lucide-react';

export default function Agents() {
  const { connect } = useSocketStore();
  const { agents, fetchAgents, loading } = useAgentStore();
  const { initTheme, theme } = useThemeStore();

  useSocketEvents();

  useEffect(() => {
    initTheme();
    connect();
    fetchAgents();
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Agent Management</h1>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent._id} agent={agent} isDark={isDark} />
            ))}
          </div>
          
          {agents.length === 0 && !loading && (
            <div className={`p-8 text-center rounded-xl border ${
              isDark ? 'bg-surface-dark border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              No agents registered
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AgentCard({ agent, isDark }) {
  const statusColors = {
    idle: 'bg-slate-500',
    active: 'bg-accent-cyan',
    blocked: 'bg-accent-amber',
  };

  return (
    <div className={`rounded-xl border p-5 ${isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`size-12 rounded-full flex items-center justify-center ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <Bot size={24} className="text-primary" />
            </div>
            <div className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 ${isDark ? 'border-surface-dark' : 'border-white'} ${statusColors[agent.status]}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{agent.name}</h3>
            <p className="text-sm text-slate-400">{agent.role}</p>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Load</span>
          <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{agent.load}%</span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div 
            className={`h-full transition-all ${
              agent.load > 80 ? 'bg-accent-red' : agent.load > 50 ? 'bg-accent-amber' : 'bg-accent-cyan'
            }`}
            style={{ width: `${agent.load}%` }}
          />
        </div>
      </div>
      
      <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <MetricItem icon={<CheckCircle size={14} className="text-accent-green" />} label="Success" value={`${agent.performanceMetrics?.successRate || 0}%`} />
        <MetricItem icon={<Clock size={14} className="text-accent-cyan" />} label="Avg Time" value={`${Math.round(agent.performanceMetrics?.avgExecutionTime / 1000 || 0)}s`} />
        <MetricItem icon={<Activity size={14} className="text-accent-amber" />} label="Tasks" value={agent.performanceMetrics?.totalTasks || 0} />
      </div>
      
      {agent.currentTaskId && (
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <p className="text-xs text-slate-400 mb-1">Current Task</p>
          <p className={`text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{agent.currentTaskId.title || 'Processing...'}</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    idle: 'bg-slate-500/20 text-slate-400',
    active: 'bg-accent-cyan/20 text-accent-cyan',
    blocked: 'bg-accent-amber/20 text-accent-amber',
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function MetricItem({ icon, label, value }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <p className="text-sm font-medium">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
