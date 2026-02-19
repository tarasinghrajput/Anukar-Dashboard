import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Theme store
export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'dark',
  
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
    set({ theme: newTheme });
  },
  
  initTheme: () => {
    const theme = get().theme;
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  },
}));

// Socket store
export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  
  connect: () => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });
    
    socket.on('connect', () => {
      console.log('[Socket] Connected');
      socket.emit('subscribe:system');
      set({ connected: true });
    });
    
    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      set({ connected: false });
    });
    
    set({ socket });
    return socket;
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },
}));

// Tasks store
export const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  loading: false,
  
  fetchTasks: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_URL}/api/tasks?${params}`);
      const data = await res.json();
      set({ tasks: data.tasks, loading: false });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      set({ loading: false });
    }
  },
  
  fetchTask: async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`);
      const task = await res.json();
      set({ currentTask: task });
      return task;
    } catch (error) {
      console.error('Failed to fetch task:', error);
    }
  },
  
  createTask: async (taskData) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      const task = await res.json();
      set(state => ({ tasks: [task, ...state.tasks] }));
      return task;
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  },
  
  updateTaskStatus: async (id, status, reason) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      const task = await res.json();
      set(state => ({
        tasks: state.tasks.map(t => t._id === id ? task : t),
        currentTask: state.currentTask?._id === id ? task : state.currentTask,
      }));
      return task;
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  },
  
  addTask: (task) => set(state => ({ tasks: [task, ...state.tasks] })),
  updateTask: (task) => set(state => ({
    tasks: state.tasks.map(t => t._id === task._id ? task : t),
    currentTask: state.currentTask?._id === task._id ? task : state.currentTask,
  })),
  removeTask: (taskId) => set(state => ({
    tasks: state.tasks.filter(t => t._id !== taskId),
    currentTask: state.currentTask?._id === taskId ? null : state.currentTask,
  })),
}));

// Agents store
export const useAgentStore = create((set) => ({
  agents: [],
  loading: false,
  
  fetchAgents: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/api/agents`);
      const agents = await res.json();
      set({ agents, loading: false });
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      set({ loading: false });
    }
  },
  
  addAgent: (agent) => set(state => ({ agents: [...state.agents, agent] })),
  updateAgent: (agent) => set(state => ({
    agents: state.agents.map(a => a._id === agent._id ? agent : a),
  })),
  removeAgent: (agentId) => set(state => ({
    agents: state.agents.filter(a => a._id !== agentId),
  })),
}));

// Logs store
export const useLogStore = create((set) => ({
  logs: [],
  loading: false,
  
  fetchLogs: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_URL}/api/logs?${params}`);
      const data = await res.json();
      set({ logs: data.logs, loading: false });
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      set({ loading: false });
    }
  },
  
  addLog: (log) => set(state => ({ logs: [log, ...state.logs] })),
}));

// System state store
export const useSystemStore = create((set) => ({
  state: null,
  health: null,
  loading: false,
  
  fetchState: async () => {
    try {
      const res = await fetch(`${API_URL}/api/system`);
      const state = await res.json();
      set({ state });
    } catch (error) {
      console.error('Failed to fetch system state:', error);
    }
  },
  
  fetchHealth: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/api/system/health`);
      const health = await res.json();
      set({ health, loading: false });
    } catch (error) {
      console.error('Failed to fetch health:', error);
      set({ loading: false });
    }
  },
  
  updateState: (state) => set({ state }),
}));

// Documents store
export const useDocumentStore = create((set) => ({
  documents: [],
  loading: false,
  
  fetchDocuments: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_URL}/api/documents?${params}`);
      const data = await res.json();
      set({ documents: data.documents, loading: false });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      set({ loading: false });
    }
  },
  
  addDocument: (doc) => set(state => ({ documents: [doc, ...state.documents] })),
  updateDocument: (doc) => set(state => ({
    documents: state.documents.map(d => d._id === doc._id ? doc : d),
  })),
  removeDocument: (docId) => set(state => ({
    documents: state.documents.filter(d => d._id !== docId),
  })),
}));

// Learnings store
export const useLearningStore = create((set) => ({
  learnings: [],
  loading: false,
  
  fetchLearnings: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_URL}/api/learnings?${params}`);
      const data = await res.json();
      set({ learnings: data.learnings, loading: false });
    } catch (error) {
      console.error('Failed to fetch learnings:', error);
      set({ loading: false });
    }
  },
  
  addLearning: (learning) => set(state => ({ learnings: [learning, ...state.learnings] })),
}));
