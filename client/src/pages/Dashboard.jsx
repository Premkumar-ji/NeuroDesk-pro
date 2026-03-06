import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { 
  ListTodo, 
  TrendingUp, 
  Clock, 
  Flame,
  Target,
  Sparkles,
  ArrowRight,
  Calendar,
  Flag
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import TaskCard from '../components/tasks/TaskCard';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, stats, fetchAISuggestions, aiSuggestions, fetchStats } = useTasks();
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    fetchAISuggestions();
    fetchStats();
    
    // Fetch insights
    const fetchInsights = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/stats/insights', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setInsights(data.insights || []);
        }
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      }
    };
    
    fetchInsights();
  }, []);

  // Safe check for tasks
  const taskList = tasks || [];
  const activeTasks = taskList.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const completedToday = taskList.filter(t => 
    t.status === 'completed' && 
    t.completedAt && 
    isToday(new Date(t.completedAt))
  ).length;

  const overdueTasks = taskList.filter(t => 
    t.status !== 'completed' && 
    t.dueDate && 
    isPast(new Date(t.dueDate)) &&
    !isToday(new Date(t.dueDate))
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDueDate = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header animate-slideUp">
        <div className="greeting">
          <h1>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted">Here's your productivity overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card animate-slideUp stagger-1">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <ListTodo size={22} color="#6366f1" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeTasks.length}</span>
            <span className="stat-label">Active Tasks</span>
          </div>
        </div>

        <div className="stat-card animate-slideUp stagger-2">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <TrendingUp size={22} color="#10b981" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{completedToday}</span>
            <span className="stat-label">Completed Today</span>
          </div>
        </div>

        <div className="stat-card animate-slideUp stagger-3">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <Clock size={22} color="#ef4444" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{overdueTasks.length}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>

        <div className="stat-card animate-slideUp stagger-4">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <Flame size={22} color="#f59e0b" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{user?.streakData?.currentStreak || 0}</span>
            <span className="stat-label">Day Streak 🔥</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* AI Suggestions */}
        <div className="dashboard-card ai-suggestions-card animate-slideUp stagger-2">
          <div className="card-header">
            <div className="card-title-row">
              <Sparkles size={20} className="card-icon ai-icon" />
              <h3>AI Suggestions</h3>
            </div>
          </div>
          
          {insights && insights.length > 0 && (
            <div className="ai-insights">
              {insights.slice(0, 3).map((insight, index) => (
                <p key={index} className="insight-item">{insight}</p>
              ))}
            </div>
          )}

          {(aiSuggestions && aiSuggestions.length > 0) && (
            <div className="suggested-tasks">
              <h4>Suggested Tasks</h4>
              <div className="suggested-list">
                {aiSuggestions.slice(0, 3).map(task => (
                  <div key={task._id} className="suggested-task">
                    <div className="suggested-priority">
                      <Flag size={12} className={`priority-${task.priority}`} />
                    </div>
                    <div className="suggested-content">
                      <span className="suggested-title">{task.title}</span>
                      {task.dueDate && (
                        <span className="suggested-date">
                          <Calendar size={12} />
                          {formatDueDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!aiSuggestions || aiSuggestions.length === 0) && (
            <div className="empty-suggestions">
              <p>No pending tasks to suggest. Create some tasks to get AI recommendations!</p>
            </div>
          )}
        </div>

        {/* Priority Tasks */}
        <div className="dashboard-card priority-tasks-card animate-slideUp stagger-3">
          <div className="card-header">
            <div className="card-title-row">
              <Flag size={20} className="card-icon" />
              <h3>Priority Tasks</h3>
            </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/tasks')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="priority-list">
            {activeTasks
              .filter(t => t.priority === 'critical' || t.priority === 'high')
              .slice(0, 5)
              .map(task => (
                <TaskCard key={task._id} task={task} compact />
              ))
            }
            
            {activeTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length === 0 && (
              <div className="empty-state-small">
                <Target size={32} />
                <p>No high priority tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="dashboard-card upcoming-tasks-card animate-slideUp stagger-4">
          <div className="card-header">
            <div className="card-title-row">
              <Calendar size={20} className="card-icon" />
              <h3>Upcoming</h3>
            </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/calendar')}
            >
              Calendar <ArrowRight size={14} />
            </button>
          </div>

          <div className="upcoming-list">
            {activeTasks
              .filter(t => t.dueDate)
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              .slice(0, 5)
              .map(task => (
                <TaskCard key={task._id} task={task} compact showDate />
              ))
            }

            {activeTasks.filter(t => t.dueDate).length === 0 && (
              <div className="empty-state-small">
                <Calendar size={32} />
                <p>No upcoming tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {stats && (
        <div className="progress-section animate-slideUp stagger-5">
          <div className="progress-card">
            <div className="progress-header">
              <h3>Weekly Progress</h3>
              <span className="progress-percentage">{stats.overview?.completionRate || 0}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${stats.overview?.completionRate || 0}%` }}
              />
            </div>
            <div className="progress-stats">
              <span>{stats.overview?.completedTasks || 0} completed</span>
              <span>{stats.overview?.totalTasks || 0} total</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

