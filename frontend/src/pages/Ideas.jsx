import { useState, useEffect } from 'react';
import { Lightbulb, Plus, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useThemeStore, useSocketStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import ConnectionStatus from '../components/ConnectionStatus';

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981'
};

const statusIcons = {
  idea: '💡',
  building: '🔨',
  done: '✅',
  paused: '⏸️'
};

const statusLabels = {
  idea: 'Idea',
  building: 'Building',
  done: 'Done',
  paused: 'Paused'
};

export default function Ideas() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', priority: 'medium', category: 'automation', status: 'idea' });
  
  const { connect } = useSocketStore();
  const { initTheme, theme } = useThemeStore();
  
  useSocketEvents();
  
  useEffect(() => {
    initTheme();
    connect();
    fetchIdeas();
  }, []);

  const isDark = theme === 'dark';

  const fetchIdeas = async () => {
    try {
      const res = await fetch('/api/ideas');
      const data = await res.json();
      setIdeas(data);
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newIdea.title.trim()) return;
    
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIdea)
      });
      const created = await res.json();
      setIdeas([created, ...ideas]);
      setNewIdea({ title: '', description: '', priority: 'medium', category: 'automation', status: 'idea' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create idea:', err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setIdeas(ideas.map(idea => 
        idea._id === id ? { ...idea, status: newStatus } : idea
      ));
    } catch (err) {
      console.error('Failed to update idea:', err);
    }
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Lightbulb className="text-accent-amber" size={20} />
            Ideas
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              New Idea
            </button>
            <ConnectionStatus />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* New Idea Form */}
          {showForm && (
            <div className={`rounded-xl p-6 mb-6 border ${
              isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  New Idea
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={newIdea.title}
                    onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="Enter idea title..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={newIdea.description}
                    onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border resize-none ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    rows={3}
                    placeholder="Describe your automation idea..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Priority
                    </label>
                    <select
                      value={newIdea.priority}
                      onChange={(e) => setNewIdea({ ...newIdea, priority: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Category
                    </label>
                    <select
                      value={newIdea.category}
                      onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="automation">Automation</option>
                      <option value="integration">Integration</option>
                      <option value="ai">AI/ML</option>
                      <option value="ui">UI/UX</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Status
                    </label>
                    <select
                      value={newIdea.status}
                      onChange={(e) => setNewIdea({ ...newIdea, status: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="idea">💡 Idea</option>
                      <option value="building">🔨 Building</option>
                      <option value="paused">⏸️ Paused</option>
                      <option value="done">✅ Done</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={`px-4 py-2 rounded-lg ${
                      isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Create Idea
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Loading ideas...
            </div>
          ) : (
            <div className="grid gap-4">
              {ideas.map(idea => (
                <div 
                  key={idea._id} 
                  className={`border rounded-xl p-5 transition-colors ${
                    isDark 
                      ? 'bg-surface-dark border-slate-800 hover:border-slate-700' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{statusIcons[idea.status]}</span>
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {idea.title}
                        </h2>
                      </div>
                      <p className={`mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {idea.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span 
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{ 
                            backgroundColor: priorityColors[idea.priority] + '20', 
                            color: priorityColors[idea.priority] 
                          }}
                        >
                          {idea.priority} priority
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idea.category}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <select
                        value={idea.status}
                        onChange={(e) => updateStatus(idea._id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white' 
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="idea">💡 Idea</option>
                        <option value="building">🔨 Building</option>
                        <option value="paused">⏸️ Paused</option>
                        <option value="done">✅ Done</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              {ideas.length === 0 && (
                <div className={`text-center py-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No ideas yet</p>
                  <p className="text-sm">Start by adding your first automation idea!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
