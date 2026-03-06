# SmartAI Todo - Advanced Task Management System

A modern, AI-powered task management system built with React Vite, Node.js, and MongoDB.

## Features

### Core Task Management
- ✅ Create, edit, delete tasks
- ✅ Priority levels (Low, Medium, High, Critical)
- ✅ Due dates and deadlines
- ✅ Subtasks / nested tasks
- ✅ Tags / labels
- ✅ Task categories
- ✅ Recurring tasks

### Smart Organization
- ✅ Drag-and-drop task ordering
- ✅ Kanban board view
- ✅ Calendar view
- ✅ List/Grid view switching
- ✅ Filter by priority, status, tags
- ✅ Instant search

### Productivity Intelligence
- ✅ Progress tracking
- ✅ Completion statistics
- ✅ Streak tracking
- ✅ Focus timer (Pomodoro)
- ✅ Time spent on tasks

### AI Features
- ✅ Natural language task creation
  - "Finish report tomorrow at 5pm" → Creates task with deadline
  - "Buy groceries every Monday" → Creates recurring task
  - "High priority call mom" → Creates task with high priority

### Data Management
- ✅ Export to JSON/CSV
- ✅ Import tasks
- ✅ Data backup

### Personalization
- ✅ Dark/Light theme
- ✅ Custom settings
- ✅ Pomodoro customization

---

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)

---

## Installation

### 1. Clone the repository
```bash
cd smartai-todo
```

### 2. Install all dependencies
```bash
npm run install-all
```

Or manually:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Configure MongoDB

#### Option A: Local MongoDB
Make sure MongoDB is running locally, then update the `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/smartai-todo
```

#### Option B: MongoDB Atlas (Production)
1. Create a MongoDB Atlas account
2. Create a cluster and get the connection string
3. Update the `.env` file:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartai-todo
```

### 4. Start the application

#### Development Mode
```bash
npm run dev
```
This starts both the server (port 5000) and client (port 5173).

#### Production Mode
```bash
# Build the client
npm run build

# Start the server
npm run start
```

---

## Usage

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Start creating tasks!

### AI Task Creation Examples
- `Finish report tomorrow at 5pm` → Creates task with deadline
- `Buy groceries every Monday` → Creates weekly recurring task
- `High priority call mom` → Creates high priority task
- `Review notes #work #important` → Creates task with tags

---

## Project Structure

```
smartai-todo/
├── client/                 # React Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React Context (Auth, Tasks)
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   └── ...
├── server/                 # Express.js backend
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   └── utils/             # Utility functions
└── package.json
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/ai` - Create task from natural language

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category

### Stats
- `GET /api/stats` - Get productivity statistics
- `GET /api/stats/daily` - Get daily stats

---

## Tech Stack

### Frontend
- React 18 + Vite
- React Router v6
- @dnd-kit (Drag & Drop)
- Recharts (Charts)
- date-fns
- Lucide React (Icons)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs

---

## License

MIT

