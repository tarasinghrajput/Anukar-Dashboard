# Anukar Control Dashboard

Operational dashboard for the Anukar (OpenClaw) agent system.

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS + Zustand + Socket.io
- **Backend:** Node.js + Express + MongoDB + Socket.io

## Project Structure

```
Anukar-Dashboard/
├── backend/           # Node.js API server
│   ├── models/        # Mongoose schemas
│   ├── routes/        # REST API endpoints
│   ├── socket/        # WebSocket handlers
│   └── server.js      # Entry point
├── frontend/          # React application
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── store/     # Zustand stores
└── PRD.md            # Product requirements
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configure MongoDB URI
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Features

- 📊 Real-time system status monitoring
- 🤖 Sub-agent management
- 📋 Task tracking with dependency graphs
- 📝 Document management
- 📜 Event logging
- 🧠 Learning evolution tracking

## API Endpoints

- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id/status` - Update task status
- `GET /api/agents` - List all agents
- `GET /api/logs` - Query system logs
- `GET /api/documents` - List documents
- `GET /api/learnings` - List learnings
- `GET /api/system` - Get system state
- `GET /api/system/health` - Get health metrics

## WebSocket Events

- `TASK_CREATED`, `TASK_STATUS_CHANGED`, `TASK_DELETED`
- `AGENT_CREATED`, `AGENT_STATUS_CHANGED`, `AGENT_DELETED`
- `LOG_CREATED`
- `SYSTEM_STATE_CHANGED`
- `LEARNING_COMMITTED`

## License

MIT
