import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, Bot } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useThemeStore, useSocketStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import ConnectionStatus from '../components/ConnectionStatus';
import ReactMarkdown from 'react-markdown';

const statusColors = {
  queued: '#64748b',
  active: '#3b82f6',
  blocked: '#f59e0b',
  completed: '#10b981',
  failed: '#ef4444'
};

const statusIcons = {
  queued: '⏳',
  active: '🔄',
  blocked: '🚫',
  completed: '✅',
  failed: '❌'
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const { connect } = useSocketStore();
  const { initTheme, theme } = useThemeStore();

  useSocketEvents();

  useEffect(() => {
    initTheme();
    connect();
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}/result`);
      const data = await res.json();
      setTask(data);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className={`text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Loading task...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className={`text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Task not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/tasks')}
              className={`p-2 rounded hover:bg-slate-100 ${isDark ? 'hover:bg-slate-800 text-white' : ''}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Task Details
            </h1>
          </div>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Task Header */}
            <div className={`rounded-xl border p-6 ${
              isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {task.title}
                  </h2>
                  {task.agentName && (
                    <div className="flex items-center gap-2 mt-2">
                      <Bot className="w-4 h-4 text-slate-500" />
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {task.agentName}
                      </span>
                    </div>
                  )}
                </div>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: statusColors[task.status] + '20',
                    color: statusColors[task.status]
                  }}
                >
                  {statusIcons[task.status]} {task.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {task.tokensUsed > 0 && (
                  <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{task.tokensUsed.toLocaleString()} tokens</span>
                  </div>
                )}
                {task.outputType && (
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Type: {task.outputType}
                  </div>
                )}
              </div>
            </div>

            {/* Result Summary */}
            {task.result && (
              <div className={`rounded-xl border p-6 ${
                isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Summary
                </h3>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{task.result}</p>
              </div>
            )}

            {/* Full Result */}
            {task.fullResult && (
              <div className={`rounded-xl border p-6 ${
                isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Full Result
                </h3>
                <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{task.fullResult}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* File Error */}
            {task.fileError && (
              <div className="rounded-xl border p-6 border-yellow-500 bg-yellow-50">
                <p className="text-yellow-700">{task.fileError}</p>
              </div>
            )}

            {/* Output File Link */}
            {task.outputFile && !task.fullResult && (
              <div className={`rounded-xl border p-6 ${
                isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Output saved to: <code className="text-sm">{task.outputFile}</code>
                </p>
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div className={`rounded-xl border p-6 ${
                isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Description
                </h3>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{task.description}</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
