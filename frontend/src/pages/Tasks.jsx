import { useEffect, useState } from 'react';
import { useTaskStore, useAgentStore, useSocketStore, useThemeStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Plus, Search, Clock, User } from 'lucide-react';

export default function Tasks() {
  const { connect } = useSocketStore();
  const { tasks, fetchTasks, createTask, updateTaskStatus, loading } = useTaskStore();
  const { agents, fetchAgents } = useAgentStore();
  const { initTheme, theme } = useThemeStore();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState({ status: '', assignedTo: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useSocketEvents();

  useEffect(() => {
    initTheme();
    connect();
    fetchTasks();
    fetchAgents();
  }, []);

  const isDark = theme === 'dark';

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
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Task Board</h1>
          <ConnectionStatus />
        </header>

        {/* Toolbar */}
        <div className={`p-4 border-b flex items-center gap-4 ${
          isDark ? 'border-slate-800 bg-surface-dark' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="relative flex-1 max-w-md">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary ${
                isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>
          
          <select
            value={filter.status}
            onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
            className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary ${
              isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
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
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors text-white"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-auto p-6">
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Task</th>
                  <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                  <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Assigned To</th>
                  <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Source</th>
                  <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Created</th>
                  <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {filteredTasks.map((task) => (
                  <tr key={task._id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                    <td className="p-4">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-slate-400 truncate max-w-xs">{task.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={task.status} /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className={isDark ? 'text-white' : 'text-slate-900'}>{task.assignedTo || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>{task.source}</span>
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
                        className={`px-2 py-1 border rounded text-xs focus:outline-none ${
                          isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
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
              <div className="p-8 text-center text-slate-400">No tasks found</div>
            )}
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-xl border p-6 w-full max-w-md ${
            isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                      isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                      isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors text-white"
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
