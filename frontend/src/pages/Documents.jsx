import { useEffect } from 'react';
import { useDocumentStore, useSocketStore, useThemeStore } from '../store';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { FileText, BookOpen, Brain, ScrollText, GitBranch } from 'lucide-react';

export default function Documents() {
  const { connect } = useSocketStore();
  const { documents, fetchDocuments, loading } = useDocumentStore();
  const { initTheme, theme } = useThemeStore();

  useEffect(() => {
    initTheme();
    connect();
    fetchDocuments();
  }, []);

  const isDark = theme === 'dark';

  const getTypeIcon = (type) => {
    switch (type) {
      case 'spec': return <FileText size={18} />;
      case 'memory': return <Brain size={18} />;
      case 'learning': return <BookOpen size={18} />;
      case 'log': return <ScrollText size={18} />;
      case 'plan': return <GitBranch size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'spec': return 'bg-primary/20 text-primary';
      case 'memory': return 'bg-accent-cyan/20 text-accent-cyan';
      case 'learning': return 'bg-accent-green/20 text-accent-green';
      case 'log': return 'bg-accent-amber/20 text-accent-amber';
      case 'plan': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Documents</h1>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc._id} className={`rounded-xl border p-5 transition-colors ${
                isDark ? 'bg-surface-dark border-slate-800 hover:border-primary/50' : 'bg-white border-slate-200 hover:border-primary/50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(doc.type)}`}>{getTypeIcon(doc.type)}</div>
                  <span className="text-xs text-slate-400">v{doc.version}</span>
                </div>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{doc.content?.substring(0, 150)}...</p>
                <div className={`mt-4 pt-4 border-t flex items-center justify-between text-xs text-slate-400 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <span className="capitalize">{doc.type}</span>
                  <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          
          {documents.length === 0 && !loading && (
            <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'} text-slate-400`}>
              No documents yet
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
