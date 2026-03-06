# Smart AI Todo System - Specification Document

## Project Overview

**Project Name:** SmartAI Todo
**Project Type:** Full-stack Web Application (React Vite + Node.js + MongoDB)
**Core Functionality:** A next-generation task management system with AI features, productivity intelligence, and advanced organization tools
**Target Users:** Professionals, students, and teams seeking advanced task management with productivity insights

---

## Technical Stack

### Frontend
- **Framework:** React 18 with Vite
- **State Management:** React Context + useReducer
- **Routing:** React Router v6
- **Styling:** Custom CSS with CSS Variables
- **Icons:** Lucide React
- **Charts:** Recharts
- **Drag & Drop:** @dnd-kit
- **Date Handling:** date-fns

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** express-validator

### Development/Production
- **Environment:** Node.js with dotenv
- **Mode Detection:** Automatic based on NODE_ENV

---

## UI/UX Specification

### Color Palette

#### Dark Theme (Default)
- **Background Primary:** #0a0a0f (Deep space black)
- **Background Secondary:** #12121a (Card backgrounds)
- **Background Tertiary:** #1a1a25 (Elevated surfaces)
- **Accent Primary:** #6366f1 (Indigo - main actions)
- **Accent Secondary:** #8b5cf6 (Purple - AI features)
- **Accent Gradient:** linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)
- **Success:** #10b981 (Emerald)
- **Warning:** #f59e0b (Amber)
- **Error:** #ef4444 (Red)
- **Critical:** #dc2626 (Deep red)
- **Text Primary:** #f8fafc (White-ish)
- **Text Secondary:** #94a3b8 (Muted)
- **Text Tertiary:** #64748b (Subtle)
- **Border:** #2d2d3a (Subtle borders)

#### Light Theme
- **Background Primary:** #fafbfc
- **Background Secondary:** #ffffff
- **Background Tertiary:** #f1f5f9
- **Text Primary:** #0f172a
- **Text Secondary:** #475569
- **Border:** #e2e8f0

### Typography

- **Font Family:** 'Outfit' for headings, 'DM Sans' for body text
- **Heading Sizes:**
  - H1: 2.5rem (40px), weight 700
  - H2: 2rem (32px), weight 600
  - H3: 1.5rem (24px), weight 600
  - H4: 1.25rem (20px), weight 500
- **Body:** 1rem (16px), weight 400
- **Small:** 0.875rem (14px)
- **Caption:** 0.75rem (12px)

### Spacing System
- **Base unit:** 4px
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96px

### Layout Structure

#### Main Layout
```
┌─────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                    │
├──────────┬──────────────────────────────────────────────┤
│          │                                               │
│  Side    │              Main Content Area               │
│  Panel   │                                               │
│  (280px) │                                               │
│          │                                               │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

#### Responsive Breakpoints
- **Desktop:** > 1024px (Full layout)
- **Tablet:** 768px - 1024px (Collapsed sidebar)
- **Mobile:** < 768px (Bottom navigation, full-width content)

### Visual Effects
- **Card shadows:** 0 4px 24px rgba(0, 0, 0, 0.3)
- **Hover transitions:** 200ms ease
- **Glass morphism:** backdrop-filter: blur(12px)
- **Border radius:** 8px (small), 12px (medium), 16px (large), 24px (XL)

---

## Feature Specifications

### 1. Core Task Management

#### Task Model
```javascript
{
  _id: ObjectId,
  title: String (required, max 200 chars),
  description: String (max 5000 chars),
  priority: Enum ['low', 'medium', 'high', 'critical'],
  status: Enum ['todo', 'in_progress', 'completed', 'archived'],
  dueDate: Date,
  reminder: Date,
  tags: [String],
  category: ObjectId (ref: Category),
  subtasks: [{
    _id: ObjectId,
    title: String,
    completed: Boolean
  }],
  recurring: {
    enabled: Boolean,
    type: Enum ['daily', 'weekly', 'monthly'],
    interval: Number
  },
  timeSpent: Number (minutes),
  dependencies: [ObjectId],
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Category Model
```javascript
{
  _id: ObjectId,
  name: String,
  color: String (hex),
  icon: String,
  order: Number
}
```

### 2. Views & Organization

#### List View
- Sortable by: due date, priority, created date, alphabetical
- Groupable by: category, priority, tags
- Filterable by: status, priority, tags, date range

#### Kanban Board
- Columns: To Do, In Progress, Completed
- Drag & drop between columns
- Drag & drop reordering within columns

#### Calendar View
- Monthly calendar with task dots
- Click to see tasks for that day
- Color-coded by priority

### 3. Productivity Intelligence

#### Statistics Dashboard
- Tasks completed (today/week/month/all-time)
- Completion rate percentage
- Average tasks per day
- Current streak (consecutive days with completed tasks)
- Best streak

#### Focus Timer (Pomodoro)
- Default: 25 min work, 5 min break
- Customizable durations
- Audio notification on completion
- Link timer to specific task
- Session logging

### 4. AI Features

#### Natural Language Task Creation
- Parse: "Finish report tomorrow at 5pm" → task with title + due date + time
- Parse: "Buy groceries every Monday" → recurring task
- Parse: "High priority call mom" → task with high priority

#### AI Task Suggestions
- Based on overdue tasks
- Suggested break times
- Optimal task order

### 5. Authentication & Security

#### User Model
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  avatar: String,
  settings: {
    theme: Enum ['dark', 'light'],
    pomodoroWork: Number (minutes),
    pomodoroBreak: Number (minutes),
    notifications: Boolean,
    emailReminders: Boolean
  },
  createdAt: Date
}
```

### 6. Data Management

#### Export Features
- Export to JSON
- Export to CSV

#### Backup
- Manual backup download
- All data in JSON format

---

## API Endpoints

### Auth Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Task Routes
- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/reorder` - Reorder tasks

### Category Routes
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Stats Routes
- `GET /api/stats` - Get productivity statistics
- `GET /api/stats/streak` - Get streak data
- `POST /api/timer/session` - Log pomodoro session

---

## Acceptance Criteria

### Core Functionality
- [ ] User can register and login
- [ ] User can create, edit, delete tasks
- [ ] User can set priority levels (Low, Medium, High, Critical)
- [ ] User can set due dates and times
- [ ] User can create subtasks
- [ ] User can add tags to tasks
- [ ] User can create and manage categories
- [ ] User can set recurring tasks

### Organization
- [ ] User can drag and drop to reorder tasks in list view
- [ ] User can view tasks in Kanban board
- [ ] User can view tasks in calendar
- [ ] User can switch between list/grid views
- [ ] User can filter by status, priority, tags
- [ ] User can search tasks by title

### Productivity
- [ ] User can see completion statistics
- [ ] User can track current streak
- [ ] User can use Pomodoro timer
- [ ] Timer logs time to selected task

### AI Features
- [ ] Natural language task creation works
- [ ] AI suggests task prioritization

### Data Management
- [ ] User can export tasks to JSON
- [ ] User can export tasks to CSV
- [ ] Data persists in MongoDB

### Personalization
- [ ] Dark/Light theme toggle works
- [ ] Settings are saved to database

### Security
- [ ] Passwords are hashed
- [ ] JWT authentication protects routes
- [ ] Users can only see their own data

---

## Development/Production Configuration

### Development Mode
- MongoDB: Local instance (mongodb://localhost:27017/smartai-todo)
- API: http://localhost:5173 (Vite proxy to backend)
- CORS enabled for localhost

### Production Mode
- MongoDB: Environment variable MONGODB_URI
- API: Same domain, server handles both frontend and API
- Optimized build

---

## File Structure

```
/smartai-todo
├── /client (React Vite)
│   ├── /src
│   │   ├── /components
│   │   │   ├── /auth
│   │   │   ├── /dashboard
│   │   │   ├── /tasks
│   │   │   ├── /calendar
│   │   │   ├── /kanban
│   │   │   ├── /stats
│   │   │   ├── /timer
│   │   │   ├── /layout
│   │   │   └── /ui
│   │   ├── /context
│   │   ├── /hooks
│   │   ├── /pages
│   │   ├── /services
│   │   ├── /utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── /server (Express)
│   ├── /config
│   ├── /controllers
│   ├── /middleware
│   ├── /models
│   ├── /routes
│   ├── /utils
│   ├── server.js
│   └── .env
│
├── package.json
└── SPEC.md
```

