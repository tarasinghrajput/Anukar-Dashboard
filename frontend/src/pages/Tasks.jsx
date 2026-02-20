import { useEffect, useState } from 'react';
import { useTaskStore, useSocketStore, useThemeStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Plus, GripVertical, Clock, AlertCircle, CheckCircle2, XCircle, Pause, Loader2 } from 'lucide-react';

const COLUMNS = [
  { id: 'queued', label: 'Queued', icon: Pause, color: 'slate' },
  { id: 'active', label: 'Active', icon: Loader2, color: 'cyan' },
  { id: 'blocked', label: 'Blocked', icon: AlertCircle, color: 'amber' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'green' },
  { id: 'failed', label: 'Failed', icon: XCircle, color: 'red' },
];

export default function Tasks() {
  const { connect } = useSocketStore();
  const { tasks, fetchTasks, createTask, updateTaskStatus, loading } = useTaskStore();
  const { initTheme, theme } = useThemeStore();
  const [showCreate, setShowCreate] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);

  useSocketEvents();

  useEffect(() => {
    initTheme();
    connect();
    fetchTasks();
  }, []);

  const isDark = theme === 'dark';

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      await updateTaskStatus(draggedTask._id, newStatus, `Moved to ${newStatus}`);
    }
    setDraggedTask(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await createTask({
      title: formData.get('title'),
      description: formData.get('description'),
      source: 'core',
      status: 'queued',
    });
    setShowCreate(false);
    e.target.reset();
  };

  const getColumnColor = (color, isDark) => {
    const colors = {
      slate: isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-300 bg-slate-100',
      cyan: isDark ? 'border-accent-cyan/50 bg-accent-cyan/10' : 'border-cyan-300 bg-cyan-50',
      amber: isDark ? 'border-accent-amber/50 bg-accent-amber/10' : 'border-amber-300 bg-amber-50',
      green: isDark ? 'border-accent-green/50 bg-accent-green/10' : 'border-green-300 bg-green-50',
      red: isDark ? 'border-accent-red/50 bg-accent-red/10' : 'border-red-300 bg-red-50',
    };
    return colors[color];
  };

  const getIconColor = (color) => {
    const colors = {
      slate: 'text-slate-400',
      cyan: 'text-accent-cyan',
      amber: 'text-accent-amber',
      green: 'text-accent-green',
      red: 'text-accent-red',
    };
    return colors[color];
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Task Board - Kanban
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors text-white"
            >
              <Plus size={18} />
              <span>New Task</span>
            </button>
            <ConnectionStatus />
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              const Icon = column.icon;
              
              return (
                <div
                  key={column.id}
                  className={`w-80 flex-shrink-0 flex flex-col rounded-xl border-2 ${getColumnColor(column.color, isDark)}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={`${getIconColor(column.color)} ${column.id === 'active' ? 'animate-spin' : ''}`} />
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {column.label}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tasks */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {columnTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        className={`p-4 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
                          isDark 
                            ? 'bg-surface-dark border-slate-700 hover:border-slate-600' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        } ${draggedTask?._id === task._id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="text-slate-500 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <Clock size={12} />
                              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                            {task.assignedTo && (
                              <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {task.assignedTo}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {columnTasks.length === 0 && (
                      <div className={`text-center py-8 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-xl border p-6 w-full max-w-md ${
            isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Create New Task
            </h2>
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
