import { useEffect } from 'react';
import { useSocketStore, useTaskStore, useAgentStore, useLogStore, useSystemStore } from '../store';

export function useSocketEvents() {
  const socket = useSocketStore((state) => state.socket);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const removeTask = useTaskStore((state) => state.removeTask);
  const addAgent = useAgentStore((state) => state.addAgent);
  const updateAgent = useAgentStore((state) => state.updateAgent);
  const removeAgent = useAgentStore((state) => state.removeAgent);
  const addLog = useLogStore((state) => state.addLog);
  const updateState = useSystemStore((state) => state.updateState);

  useEffect(() => {
    if (!socket) return;

    // Task events
    socket.on('TASK_CREATED', addTask);
    socket.on('TASK_STATUS_CHANGED', updateTask);
    socket.on('AGENT_ASSIGNED', updateTask);
    socket.on('TASK_DELETED', removeTask);

    // Agent events
    socket.on('AGENT_CREATED', addAgent);
    socket.on('AGENT_STATUS_CHANGED', updateAgent);
    socket.on('AGENT_METRICS_UPDATED', updateAgent);
    socket.on('AGENT_DELETED', removeAgent);

    // Log events
    socket.on('LOG_CREATED', addLog);

    // System events
    socket.on('SYSTEM_STATE_CHANGED', updateState);

    return () => {
      socket.off('TASK_CREATED', addTask);
      socket.off('TASK_STATUS_CHANGED', updateTask);
      socket.off('AGENT_ASSIGNED', updateTask);
      socket.off('TASK_DELETED', removeTask);
      socket.off('AGENT_CREATED', addAgent);
      socket.off('AGENT_STATUS_CHANGED', updateAgent);
      socket.off('AGENT_METRICS_UPDATED', updateAgent);
      socket.off('AGENT_DELETED', removeAgent);
      socket.off('LOG_CREATED', addLog);
      socket.off('SYSTEM_STATE_CHANGED', updateState);
    };
  }, [socket]);
}
