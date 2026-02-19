import { useSocketStore, useThemeStore } from '../store';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const connected = useSocketStore((state) => state.connected);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      connected 
        ? 'bg-accent-green/20 text-accent-green' 
        : 'bg-accent-red/20 text-accent-red'
    }`}>
      {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
      {connected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
