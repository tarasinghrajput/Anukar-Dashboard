import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';
import { Network } from 'lucide-react';

export default function KnowledgeGraph() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-slate-800 bg-[#0e1216] flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Knowledge Graph</h1>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="bg-surface-dark rounded-xl border border-slate-800 h-full flex items-center justify-center">
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
