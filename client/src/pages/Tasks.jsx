import { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  Plus, 
  Filter, 
  SortAsc, 
  LayoutGrid, 
  List,
  Download,
  FolderPlus,
  ListTodo
} from 'lucide-react';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import CategoryModal from '../components/tasks/CategoryModal';
import './Tasks.css';

function Tasks() {
  const { 
    tasks, 
    categories, 
    filters, 
    setFilters, 
    loading,
    exportTasks,
    createCategory
  } = useTasks();
  
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeTasks = tasks.filter(t => t.status !== 'archived');

  const handleExport = async (format) => {
    await exportTasks(format);
    setShowExportMenu(false);
  };

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Tasks</h1>
          <span className="task-count">{activeTasks.length} tasks</span>
        </div>

        <div className="page-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>

          <div className="export-dropdown">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={18} />
              Export
            </button>
              {showExportMenu && (
              <div className="dropdown-menu">
                <button onClick={() => handleExport('excel')}>Export as Excel</button>
              </div>
            )}
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setShowTaskModal(true)}
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel animate-slideUp">
          <div className="filter-group">
            <label>Status</label>
            <select 
              className="select"
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select 
              className="select"
              value={filters.priority}
              onChange={(e) => setFilters({ priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select 
              className="select"
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select 
              className="select"
              value={filters.sortBy}
              onChange={(e) => setFilters({ sortBy: e.target.value })}
            >
              <option value="order">Custom Order</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>
        </div>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="categories-section">
          <div className="section-header">
            <h3>Categories</h3>
          </div>
          <div className="categories-list">
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`category-chip ${filters.category === cat._id ? 'active' : ''}`}
                onClick={() => setFilters({ category: filters.category === cat._id ? '' : cat._id })}
                style={{ 
                  '--cat-color': cat.color,
                  background: filters.category === cat._id ? cat.color : cat.color + '20',
                  color: filters.category === cat._id ? 'white' : cat.color
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className={`tasks-container ${viewMode}`}>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ListTodo size={40} />
            </div>
            <h3 className="empty-state-title">No tasks yet</h3>
            <p className="empty-state-description">
              Create your first task to get started with SmartAI Todo
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowTaskModal(true)}
            >
              <Plus size={18} />
              Create Task
            </button>
          </div>
        ) : (
          <div className={`tasks-list ${viewMode}`}>
            {activeTasks.map(task => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal onClose={() => setShowTaskModal(false)} />
      )}
    </div>
  );
}

export default Tasks;

