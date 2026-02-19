import { useEffect, useState } from 'react';
import { useTaskStore, useAgentStore, useSocketStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Plus, Filter, Search, Clock, User } from 'lucide-react';

export default function Tasks() {
  const { connect } = useSocketStore();
  const { tasks, fetchTasks, createTask, updateTaskStatus, loading } = useTaskStore();
  const { agents, fetchAgents } = useAgentStore();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState({ status: '', assignedTo: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useSocketEvents();

  useEffect(() => {
    connect();
    fetchTasks();
    fetchAgents();
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.assignedTo && task.assignedTo !== filter.assignedTo) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await createTask({
      title: formData.get('title'),
      description: formData.get('description'),
      source: 'human',
    });
    setShowCreate(false);
    e.target.reset();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus, `Status changed to ${newStatus}`);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-slate-800 bg-[#0e1216] flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Task Board</h1>
          <ConnectionStatus />
        </header>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-surface-dark flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-dark border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          
          <select
            value={filter.status}
            onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 bg-background-dark border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="queued">Queued</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-surface-dark rounded-xl border border-slate-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Task</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Assigned To</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Source</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Created</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-slate-400 truncate max-w-xs">{task.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span>{task.assignedTo || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-slate-800 text-xs capitalize">{task.source}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock size={14} />
                        {new Date(task.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="px-2 py-1 bg-background-dark border border-slate-800 rounded text-xs focus:outline-none"
                      >
                        <option value="queued">Queued</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTasks.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400">
                No tasks found
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-dark rounded-xl border border-slate-800 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 bg-background-dark border border-slate-800 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 bg-background-dark border border-slate-800 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
