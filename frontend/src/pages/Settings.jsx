import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';

export default function Settings() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-slate-800 bg-[#0e1216] flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Settings</h1>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            <div className="bg-surface-dark rounded-xl border border-slate-800 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">System Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">API URL</label>
                  <input 
                    type="text" 
                    defaultValue="http://localhost:3000"
                    className="w-full px-3 py-2 bg-background-dark border border-slate-800 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">MongoDB URI</label>
                  <input 
                    type="text" 
                    defaultValue="mongodb://localhost:27017/anukar-dashboard"
                    className="w-full px-3 py-2 bg-background-dark border border-slate-800 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-surface-dark rounded-xl border border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <div className="space-y-2 text-slate-400">
                <p><span className="text-white">Version:</span> 1.0.0</p>
                <p><span className="text-white">Tech Stack:</span> React + Node.js + MongoDB</p>
                <p><span className="text-white">Repository:</span> github.com/tarasinghrajput/Anukar-Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
