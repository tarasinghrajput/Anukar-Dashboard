import { useEffect } from 'react';
import { useSystemStore, useTaskStore, useAgentStore, useSocketStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Activity, Bot, FileText, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

export default function Dashboard() {
  const { connect } = useSocketStore();
  const { state, health, fetchState, fetchHealth } = useSystemStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { agents, fetchAgents } = useAgentStore();

  useSocketEvents();

  useEffect(() => {
    connect();
    fetchState();
    fetchHealth();
    fetchTasks({ limit: 10 });
    fetchAgents();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'idle': return 'text-slate-400';
      case 'executing': return 'text-accent-cyan';
      case 'blocked': return 'text-accent-amber';
      case 'learning': return 'text-accent-green';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar health={health} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-slate-800 bg-[#0e1216] flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">System Dashboard</h1>
          <ConnectionStatus />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* System Status Banner */}
          <div className="bg-surface-dark rounded-xl p-6 mb-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`size-3 rounded-full animate-pulse ${
                  state?.currentMode === 'executing' ? 'bg-accent-cyan' :
                  state?.currentMode === 'blocked' ? 'bg-accent-amber' :
                  state?.currentMode === 'learning' ? 'bg-accent-green' : 'bg-slate-500'
                }`} />
                <div>
                  <h2 className="text-xl font-semibold capitalize">{state?.currentMode || 'Idle'}</h2>
                  <p className="text-sm text-slate-400">
                    {state?.coreDecision || 'No active decision'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Confidence</div>
                <div className="text-2xl font-bold text-primary">{state?.confidence || 0}%</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<FileText size={20} />}
              label="Total Tasks"
              value={health?.tasks?.total || 0}
              color="primary"
            />
            <StatCard
              icon={<Activity size={20} />}
              label="Active Tasks"
              value={health?.tasks?.active || 0}
              color="cyan"
            />
            <StatCard
              icon={<Bot size={20} />}
              label="Active Agents"
              value={health?.agents?.active || 0}
              color="green"
            />
            <StatCard
              icon={<AlertTriangle size={20} />}
              label="Blocked"
              value={health?.tasks?.blocked || 0}
              color="amber"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Tasks */}
            <div className="bg-surface-dark rounded-xl border border-slate-800">
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock size={18} className="text-accent-cyan" />
                  Recent Tasks
                </h3>
              </div>
              <div className="divide-y divide-slate-800">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="p-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-slate-400">{task.assignedTo || 'Unassigned'}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    No tasks yet
                  </div>
                )}
              </div>
            </div>

            {/* Active Agents */}
            <div className="bg-surface-dark rounded-xl border border-slate-800">
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap size={18} className="text-accent-amber" />
                  Active Agents
                </h3>
              </div>
              <div className="divide-y divide-slate-800">
                {agents.filter(a => a.status === 'active').slice(0, 5).map((agent) => (
                  <div key={agent._id} className="p-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Bot size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-slate-400">{agent.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{agent.load}%</div>
                        <div className="h-1 w-16 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent-cyan"
                            style={{ width: `${agent.load}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {agents.filter(a => a.status === 'active').length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    No active agents
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary/20 text-primary',
    cyan: 'bg-accent-cyan/20 text-accent-cyan',
    green: 'bg-accent-green/20 text-accent-green',
    amber: 'bg-accent-amber/20 text-accent-amber',
  };

  return (
    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    queued: 'bg-slate-500/20 text-slate-400',
    active: 'bg-accent-cyan/20 text-accent-cyan',
    blocked: 'bg-accent-amber/20 text-accent-amber',
    completed: 'bg-accent-green/20 text-accent-green',
    failed: 'bg-accent-red/20 text-accent-red',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.queued}`}>
      {status}
    </span>
  );
}
