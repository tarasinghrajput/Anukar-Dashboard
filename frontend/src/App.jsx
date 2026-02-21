import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Agents from './pages/Agents';
import Logs from './pages/Logs';
import Documents from './pages/Documents';
import Learnings from './pages/Learnings';
import KnowledgeGraph from './pages/KnowledgeGraph';
import Ideas from './pages/Ideas';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/learnings" element={<Learnings />} />
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/knowledge" element={<KnowledgeGraph />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
