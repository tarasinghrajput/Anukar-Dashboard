# 📄 Product Requirements Document (PRD)

# Anukar Control Dashboard

**Tech Stack:** React (Frontend) + Node.js + MongoDB
**Owner:** Anukar
**Purpose:** Operational Source of Truth for the Anukar Agent System

---

# 1. Overview

The **Anukar Control Dashboard** is a real-time operational interface that provides full visibility into:

* What the main agent is doing
* How the Core is routing decisions
* What sub-agents are executing
* Task states and dependencies
* System logs and memory
* Learnings and behavioral evolution

This dashboard is the **single source of truth** for the Anukar system.

---

# 2. Goals

## Primary Goals

1. Full system transparency
2. Real-time operational visibility
3. Complete task traceability
4. Observable decision-making
5. Structured memory inspection
6. Learning evolution tracking
7. Debuggability

## Non-Goals

* This is not a marketing dashboard
* This is not a static reporting tool
* This is not a simple task manager

This is an **operational control plane**.

---

# 3. User Persona

**Primary User:** System Operator (You)

Needs:

* Understand what Anukar is doing right now
* Inspect decision flow
* Audit sub-agent actions
* Debug failures
* Track system evolution
* View system health

---

# 4. Functional Requirements

---

## 4.1 Live System View (Real-Time Panel)

### Requirements:

* Display current active task
* Show active workflow tree
* Display current core decision
* Show active sub-agents
* Show system mode (Idle / Executing / Blocked / Learning)
* Show confidence score

### Updates:

* Must update in real-time (WebSocket)

---

## 4.2 Task Management & Task Graph

### Requirements:

* Create tasks (Human-triggered)
* View tasks (All states)
* Task states:

  * Queued
  * Active
  * Blocked
  * Completed
  * Failed
* Parent-child relationships
* Task dependency graph (visual)
* Execution timeline

### Filtering:

* By status
* By agent
* By date
* By source

---

## 4.3 Sub-Agent Monitoring

### Requirements:

* List all sub-agents
* Show:

  * Current task
  * Status
  * Load
  * Last output
  * Performance metrics
* View execution history
* Failure logs

---

## 4.4 Documents & Memory

### Requirements:

* Store system documents
* Categories:

  * Spec
  * Memory
  * Learning
  * Logs
  * Plans
* Version tracking
* Link documents to tasks
* Searchable
* Show last updated

---

## 4.5 Logs (Append-Only Event Log)

### Requirements:

* Every state change logged
* Actor
* Action
* Timestamp
* Reason summary
* Task ID
* Filterable
* Time-range queries

---

## 4.6 Learning Evolution Panel

### Requirements:

* Record behavioral changes
* New skills created
* Trigger events
* Affected agents
* Confidence score
* Version tracking

---

## 4.7 System Health Metrics

### Metrics:

* Total tasks
* Active tasks
* Blocked ratio
* Avg execution time
* Sub-agent load
* Error rate

---

# 5. Non-Functional Requirements

### Performance

* Real-time updates < 1s latency
* Support 100k+ tasks
* Efficient indexed queries

### Reliability

* No data loss
* Append-only logging
* Soft deletes only

### Security

* Authentication required
* Role-based access (future)

### Observability

* Every decision traceable
* No hidden state

---

# 6. Technical Architecture

---

## 6.1 Frontend

### Framework:

* React (Vite or Next.js)
* State management: Zustand or Redux
* WebSocket for live updates
* React Flow (for task graph)
* Chart.js / Recharts (metrics)

### Pages:

1. Dashboard (Live View)
2. Tasks
3. Agents
4. Documents
5. Logs
6. Learnings
7. System Health

---

## 6.2 Backend

### Stack:

* Node.js (Express)
* MongoDB
* Mongoose
* WebSocket server (Socket.io)

### Architecture:

Event-driven model

Flow:
Agent → Emits Event → Stored in MongoDB → WebSocket pushes to frontend

---

# 7. Database Schema (MongoDB)

---

## 7.1 Tasks Collection

```js
{
  _id: ObjectId,
  title: String,
  description: String,
  status: "queued | active | blocked | completed | failed",
  source: "human | core | sub-agent",
  assignedTo: String,
  parentTaskId: ObjectId,
  dependencyIds: [ObjectId],
  createdAt: Date,
  updatedAt: Date,
  logs: [ObjectId]
}
```

Indexes:

* status
* assignedTo
* createdAt
* parentTaskId

---

## 7.2 Agents Collection

```js
{
  _id: ObjectId,
  name: String,
  role: String,
  status: "idle | active | blocked",
  currentTaskId: ObjectId,
  load: Number,
  performanceMetrics: {
    successRate: Number,
    avgExecutionTime: Number
  },
  updatedAt: Date
}
```

---

## 7.3 Logs Collection (Append-Only)

```js
{
  _id: ObjectId,
  timestamp: Date,
  actor: String,
  action: String,
  reasoningSummary: String,
  taskId: ObjectId,
  metadata: Object
}
```

Indexes:

* timestamp
* taskId
* actor

---

## 7.4 Documents Collection

```js
{
  _id: ObjectId,
  title: String,
  type: "spec | memory | learning | log | plan",
  content: String,
  linkedTaskIds: [ObjectId],
  version: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 7.5 Learnings Collection

```js
{
  _id: ObjectId,
  description: String,
  triggerEventId: ObjectId,
  affectedAgents: [String],
  impactSummary: String,
  confidenceScore: Number,
  version: Number,
  createdAt: Date
}
```

---

## 7.6 SystemState Collection (Singleton)

```js
{
  _id: "system_state",
  currentMode: String,
  activeTaskId: ObjectId,
  coreDecision: String,
  confidence: Number,
  updatedAt: Date
}
```

---

# 8. Event Model

Every state change must emit an event:

Examples:

* TASK_CREATED
* TASK_STATUS_CHANGED
* AGENT_ASSIGNED
* AGENT_COMPLETED
* CORE_DECISION_MADE
* LEARNING_COMMITTED

Each event:

1. Stored in Logs
2. Updates relevant collections
3. Emits WebSocket update

---

# 9. State Machine Design

Task States:

Queued → Active → Completed
Queued → Active → Blocked → Active
Active → Failed

Agent States:

Idle → Active → Idle
Active → Blocked

System States:

Idle
Executing
Blocked
Learning

---

# 10. Example Execution Flow

1. Human creates task
2. TASK_CREATED event logged
3. Core routes task
4. TASK_STATUS_CHANGED → Active
5. AGENT_ASSIGNED
6. Agent executes
7. AGENT_COMPLETED
8. TASK_STATUS_CHANGED → Completed
9. Learning generated
10. LEARNING_COMMITTED event

All visible in dashboard in real-time.

---

# 11. Future Enhancements

* Multi-user roles
* Agent replay mode
* Performance heatmaps
* Time-travel debugging
* Version rollback
* AI-based anomaly detection

---

# 12. Success Metrics

* Operator can identify:

  * What is running now (under 5 seconds)
  * Why a task failed
  * What decision was made and why
  * What changed recently

If the operator never asks:

> “What is Anukar doing?”

The dashboard succeeds.

---