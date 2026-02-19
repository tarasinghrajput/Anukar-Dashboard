import { useThemeStore } from '../store';
import Sidebar from '../components/Sidebar';
import ConnectionStatus from '../components/ConnectionStatus';

export default function Settings() {
  const { initTheme, theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`h-14 border-b flex items-center justify-between px-6 ${
          isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-white'
        }`}>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
          <ConnectionStatus />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            <div className={`rounded-xl border p-6 mb-6 ${isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>System Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">API URL</label>
                  <input 
                    type="text" 
                    defaultValue="http://localhost:3000"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                      isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">MongoDB URI</label>
                  <input 
                    type="text" 
                    defaultValue="mongodb://localhost:27017/anukar-dashboard"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                      isDark ? 'bg-background-dark border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl border p-6 ${isDark ? 'bg-surface-dark border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>About</h2>
              <div className="space-y-2 text-slate-400">
                <p><span className={isDark ? 'text-white' : 'text-slate-900'}>Version:</span> 1.0.0</p>
                <p><span className={isDark ? 'text-white' : 'text-slate-900'}>Tech Stack:</span> React + Node.js + MongoDB</p>
                <p><span className={isDark ? 'text-white' : 'text-slate-900'}>Repository:</span> github.com/tarasinghrajput/Anukar-Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
