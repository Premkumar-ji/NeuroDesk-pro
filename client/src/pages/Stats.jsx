import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Flame, Target, TrendingUp, Clock, Calendar } from 'lucide-react';
import './Stats.css';

function Stats() {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const [period, setPeriod] = useState('all');
  const [stats, setStats] = useState(null);
  const [dailyData, setDailyData] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchDailyData();
  }, [period]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stats?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchDailyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stats/daily?days=7', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDailyData(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily data:', error);
    }
  };

  const priorityData = stats ? [
    { name: 'Critical', value: stats.priorityDistribution?.critical || 0, color: '#ef4444' },
    { name: 'High', value: stats.priorityDistribution?.high || 0, color: '#f59e0b' },
    { name: 'Medium', value: stats.priorityDistribution?.medium || 0, color: '#3b82f6' },
    { name: 'Low', value: stats.priorityDistribution?.low || 0, color: '#94a3b8' }
  ] : [];

  const statusData = stats ? [
    { name: 'To Do', value: stats.statusDistribution?.todo || 0, color: '#94a3b8' },
    { name: 'In Progress', value: stats.statusDistribution?.in_progress || 0, color: '#3b82f6' },
    { name: 'Completed', value: stats.statusDistribution?.completed || 0, color: '#10b981' }
  ] : [];

  return (
    <div className="stats-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Statistics</h1>
        </div>
        <div className="period-selector">
          <select 
            className="select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card-large">
          <div className="stat-card-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <Target size={24} color="#6366f1" />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.overview?.totalTasks || 0}</span>
            <span className="stat-card-label">Total Tasks</span>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <TrendingUp size={24} color="#10b981" />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.overview?.completedTasks || 0}</span>
            <span className="stat-card-label">Completed</span>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <Flame size={24} color="#f59e0b" />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.streak?.currentStreak || 0}</span>
            <span className="stat-card-label">Current Streak 🔥</span>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
            <Clock size={24} color="#3b82f6" />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats?.timeSpent?.formatted || '0h 0m'}</span>
            <span className="stat-card-label">Time Spent</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Weekly Activity */}
        <div className="chart-card">
          <h3>Weekly Activity</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dayName" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="created" fill="#6366f1" radius={[4, 4, 0, 0]} name="Created" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="chart-card">
          <h3>Priority Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {priorityData.map((item, index) => (
                <div key={index} className="legend-item">
                  <span className="legend-color" style={{ background: item.color }} />
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="chart-card">
          <h3>Status Overview</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {statusData.map((item, index) => (
                <div key={index} className="legend-item">
                  <span className="legend-color" style={{ background: item.color }} />
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Completion Rate Trend */}
        <div className="chart-card">
          <h3>Completion Rate</h3>
          <div className="chart-container">
            <div className="completion-rate-display">
              <div className="completion-circle">
                <svg viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="var(--border)" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="url(#gradient)" 
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats?.overview?.completionRate || 0) * 2.83} 283`}
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="completion-value">
                  {stats?.overview?.completionRate || 0}%
                </div>
              </div>
              <div className="completion-details">
                <div className="completion-stat">
                  <span className="completion-label">Total Tasks</span>
                  <span className="completion-number">{stats?.overview?.totalTasks || 0}</span>
                </div>
                <div className="completion-stat">
                  <span className="completion-label">Completed</span>
                  <span className="completion-number success">{stats?.overview?.completedTasks || 0}</span>
                </div>
                <div className="completion-stat">
                  <span className="completion-label">Avg/Day</span>
                  <span className="completion-number">{stats?.overview?.avgTasksPerDay || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Completed */}
      {stats?.recentCompleted && stats.recentCompleted.length > 0 && (
        <div className="recent-completed">
          <h3>Recently Completed</h3>
          <div className="recent-list">
            {stats.recentCompleted.map(task => (
              <div key={task._id} className="recent-item">
                <span className="recent-title">{task.title}</span>
                <span className={`recent-priority priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Stats;

