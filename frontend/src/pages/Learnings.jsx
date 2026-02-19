import { useEffect } from 'react';
import { useLearningStore, useSocketStore, useThemeStore } from '../store';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Brain, TrendingUp } from 'lucide-react';

export default function Learnings() {
  const { connect } = useSocketStore();
  const { learnings, fetchLearnings, loading } = useLearningStore();
  const { initTheme, theme } = useThemeStore();

  useEffect(() => {
    initTheme();
    connect();
    fetchLearnings();
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Learning Evolution</h1>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {learnings.map((learning) => (
              <div key={learning._id} className={`rounded-xl border p-5 ${isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent-green/20">
                      <Brain size={20} className="text-accent-green" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Learning v{learning.version}</h3>
                      <p className="text-sm text-slate-400">{new Date(learning.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-accent-cyan" />
                    <span className="text-lg font-bold text-accent-cyan">{learning.confidenceScore}%</span>
                  </div>
                </div>
                
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{learning.description}</p>
                
                {learning.affectedAgents?.length > 0 && (
                  <div className={`flex flex-wrap gap-2 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    {learning.affectedAgents.map((agent, i) => (
                      <span key={i} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>{agent}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {learnings.length === 0 && !loading && (
            <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'} text-slate-400`}>
              No learnings recorded yet
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
