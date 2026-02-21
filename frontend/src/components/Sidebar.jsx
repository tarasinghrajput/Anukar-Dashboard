import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  FileText, 
  ScrollText, 
  Network, 
  Activity, 
  BookOpen,
  Lightbulb,
  Settings 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useThemeStore } from '../store';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Task Board', icon: FileText },
  { path: '/agents', label: 'Active Agents', icon: Bot },
  { path: '/knowledge', label: 'Knowledge Graph', icon: Network },
  { path: '/ideas', label: 'Ideas', icon: Lightbulb },
  { path: '/logs', label: 'System Logs', icon: ScrollText },
  { path: '/documents', label: 'Documents', icon: BookOpen },
  { path: '/learnings', label: 'Learnings', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ health }) {
  const location = useLocation();
  const { initTheme, theme } = useThemeStore();
  
  useEffect(() => {
    initTheme();
  }, []);
  
  const isDark = theme === 'dark';
  
  return (
    <aside className={`w-64 flex flex-col border-r shrink-0 h-full overflow-y-auto ${
      isDark ? 'border-slate-800 bg-[#111418]' : 'border-slate-200 bg-white'
    }`}>
      {/* Logo */}
      <div className={`p-4 flex items-center justify-between border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded bg-primary flex items-center justify-center">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <div className="flex flex-col">
            <span className={`font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ANUKAR CORE
            </span>
            <span className="text-xs text-slate-400">v1.0.0</span>
          </div>
        </div>
        <ThemeToggle />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
          System Control
        </div>
        
        {navItems.slice(0, 6).map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                isActive
                  ? isDark 
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
                  : isDark
                    ? 'text-slate-400 hover:bg-surface-dark hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
        
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2 px-3">
          Analytics
        </div>
        
        {navItems.slice(5).map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                isActive
                  ? isDark 
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
                  : isDark
                    ? 'text-slate-400 hover:bg-surface-dark hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
      
      {/* System Status */}
      <div className={`p-4 border-t ${
        isDark ? 'border-slate-800 bg-[#0e1216]' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
            <span className="text-white text-sm font-bold">TS</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Tara Singh
            </span>
            <span className="text-xs text-slate-400">Admin</span>
          </div>
        </div>
        
        {health && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Active Tasks</span>
                <span className="text-accent-cyan">{health.tasks?.active || 0}</span>
              </div>
              <div className={`h-1 w-full rounded-full overflow-hidden ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}>
                <div 
                  className="h-full bg-accent-cyan transition-all"
                  style={{ width: `${Math.min(health.tasks?.active / 10 * 100 || 0, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Agent Load</span>
                <span className="text-accent-amber">{health.agents?.avgLoad || 0}%</span>
              </div>
              <div className={`h-1 w-full rounded-full overflow-hidden ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}>
                <div 
                  className="h-full bg-accent-amber transition-all"
                  style={{ width: `${health.agents?.avgLoad || 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
