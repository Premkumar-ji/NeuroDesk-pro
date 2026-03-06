import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import {
  LayoutDashboard,
  ListTodo,
  Kanban,
  Calendar,
  BarChart3,
  Timer,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Sparkles,
  Bell,
  Moon,
  Sun,
  Plus
} from 'lucide-react';
import TaskModal from '../tasks/TaskModal';
import './Layout.css';

function Layout() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { tasks, filters, setFilters } = useTasks();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/kanban', icon: Kanban, label: 'Kanban' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/stats', icon: BarChart3, label: 'Statistics' },
    { path: '/timer', icon: Timer, label: 'Focus Timer' },
  ];

  const activeTasks = tasks.filter(t => t.status !== 'completed').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    setFilters({ search: e.target.value });
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <Sparkles size={24} />
            </div>
            <span className="logo-text">SmartAI Todo</span>
          </div>
          <button 
            className="sidebar-close-mobile"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Menu</span>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.path === '/tasks' && activeTasks > 0 && (
                  <span className="nav-badge">{activeTasks}</span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-section-title">System</span>
            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="btn btn-ghost btn-icon menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="topbar-right">
            <button 
              className="btn btn-primary"
              onClick={() => setShowTaskModal(true)}
            >
              <Plus size={18} />
              <span className="btn-text">New Task</span>
            </button>

            <button 
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              className="btn btn-ghost btn-icon"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              {activeTasks > 0 && <span className="notification-dot" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal onClose={() => setShowTaskModal(false)} />
      )}
    </div>
  );
}

export default Layout;

