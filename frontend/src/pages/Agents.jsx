import { useEffect } from 'react';
import { useAgentStore, useSocketStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Bot, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function Agents() {
  const { connect } = useSocketStore();
  const { agents, fetchAgents, loading } = useAgentStore();

  useSocketEvents();

  useEffect(() => {
    connect();
    fetchAgents();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-slate-800 bg-[#0e1216] flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Agent Management</h1>
          <ConnectionStatus />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent._id} agent={agent} />
            ))}
          </div>
          
          {agents.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 bg-surface-dark rounded-xl border border-slate-800">
              No agents registered
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AgentCard({ agent }) {
  const statusColors = {
    idle: 'bg-slate-500',
    active: 'bg-accent-cyan',
    blocked: 'bg-accent-amber',
  };

  return (
    <div className="bg-surface-dark rounded-xl border border-slate-800 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot size={24} className="text-primary" />
            </div>
            <div className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-surface-dark ${statusColors[agent.status]}`} />
          </div>
          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <p className="text-sm text-slate-400">{agent.role}</p>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>
      
      {/* Load Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Load</span>
          <span className="font-medium">{agent.load}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              agent.load > 80 ? 'bg-accent-red' :
              agent.load > 50 ? 'bg-accent-amber' : 'bg-accent-cyan'
            }`}
            style={{ width: `${agent.load}%` }}
          />
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800">
        <MetricItem 
          icon={<CheckCircle size={14} className="text-accent-green" />}
          label="Success"
          value={`${agent.performanceMetrics?.successRate || 0}%`}
        />
        <MetricItem 
          icon={<Clock size={14} className="text-accent-cyan" />}
          label="Avg Time"
          value={`${Math.round(agent.performanceMetrics?.avgExecutionTime / 1000 || 0)}s`}
        />
        <MetricItem 
          icon={<Activity size={14} className="text-accent-amber" />}
          label="Tasks"
          value={agent.performanceMetrics?.totalTasks || 0}
        />
      </div>
      
      {/* Current Task */}
      {agent.currentTaskId && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Current Task</p>
          <p className="text-sm truncate">{agent.currentTaskId.title || 'Processing...'}</p>
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

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function MetricItem({ icon, label, value }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
      </div>
      <p className="text-sm font-medium">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
