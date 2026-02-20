import { useEffect, useState } from 'react';
import { useSocketStore, useThemeStore } from '../store';
import { useSocketEvents } from '../hooks/useSocketEvents';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Brain, FileText, Calendar, Tag, FolderOpen, ExternalLink } from 'lucide-react';

export default function KnowledgeGraph() {
  const { connect } = useSocketStore();
  const { theme } = useThemeStore();
  const [learnings, setLearnings] = useState([]);
  const [selectedLearning, setSelectedLearning] = useState(null);
  const [loading, setLoading] = useState(true);

  useSocketEvents();

  useEffect(() => {
    connect();
    fetchLearnings();
  }, []);

  const fetchLearnings = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/learnings/files');
      const data = await res.json();
      setLearnings(data.learnings || []);
    } catch (error) {
      console.error('Failed to fetch learnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  const getCategoryColor = (category) => {
    const colors = {
      technical: 'bg-accent-cyan/20 text-accent-cyan',
      workflows: 'bg-accent-green/20 text-accent-green',
      context: 'bg-accent-amber/20 text-accent-amber',
      mistakes: 'bg-accent-red/20 text-accent-red',
      general: 'bg-slate-500/20 text-slate-400',
    };
    return colors[category] || colors.general;
  };

  const renderMarkdown = (content) => {
    // Simple markdown rendering
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className={`text-xl font-semibold mt-6 mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{line.slice(3)}</h2>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className={`mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className={`ml-4 mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{line.slice(2)}</li>;
        }
        if (line.trim() === '---') {
          return <hr key={i} className={`my-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />;
        }
        if (line.trim() === '') {
          return null;
        }
        return <p key={i} className={`mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{line}</p>;
      });
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <Brain size={20} className="text-primary" />
            <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Knowledge Graph
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
            }`}>
              {learnings.length} learnings
            </span>
          </div>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Learnings List */}
          <div className={`w-80 border-r overflow-y-auto ${
            isDark ? 'border-slate-800 bg-surface-dark' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                <FolderOpen size={16} />
                <span>Stored in ~/workspace/learnings/</span>
              </div>
              
              {loading ? (
                <div className="text-center py-8 text-slate-400">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {learnings.map((learning) => (
                    <div
                      key={learning.id}
                      onClick={() => setSelectedLearning(learning)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedLearning?.id === learning.id
                          ? isDark ? 'bg-primary/20 border border-primary/50' : 'bg-primary/10 border border-primary/30'
                          : isDark ? 'bg-background-dark hover:bg-slate-800' : 'bg-white hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText size={16} className="text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {learning.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getCategoryColor(learning.category)}`}>
                              {learning.category}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar size={10} />
                              {learning.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {learnings.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Brain size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No learnings yet</p>
                      <p className="text-xs mt-1">Learnings will appear here as I work</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Learning Detail */}
          <div className={`flex-1 overflow-y-auto p-6 ${
            isDark ? 'bg-background-dark' : 'bg-white'
          }`}>
            {selectedLearning ? (
              <div className={`max-w-3xl mx-auto rounded-xl border p-6 ${
                isDark ? 'bg-surface-dark border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={16} className="text-slate-400" />
                  <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(selectedLearning.category)}`}>
                    {selectedLearning.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedLearning.filename}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(selectedLearning.content)}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Brain size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a learning to view details</p>
                  <p className="text-sm mt-2">
                    I store what I learn in markdown files for easy access and version control
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
