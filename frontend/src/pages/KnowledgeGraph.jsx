import { useThemeStore } from '../store';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Network } from 'lucide-react';

export default function KnowledgeGraph() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Knowledge Graph</h1>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className={`rounded-xl border h-full flex items-center justify-center ${
            isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="text-center text-slate-400">
              <Network size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Knowledge Graph visualization coming soon</p>
              <p className="text-sm mt-2">Task dependencies and relationships will be displayed here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
