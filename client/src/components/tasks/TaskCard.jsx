import { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { 
  Check, 
  Clock, 
  Flag, 
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  Archive
} from 'lucide-react';
import TaskModal from './TaskModal';
import './TaskCard.css';

function TaskCard({ task, compact = false, showDate = false }) {
  const { updateTask, deleteTask } = useTasks();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  
  const formatDueDate = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
  };

  const handleToggleComplete = async () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    await updateTask(task._id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task._id);
    }
    setShowMenu(false);
  };

  const handleArchive = async () => {
    await updateTask(task._id, { status: 'archived' });
    setShowMenu(false);
  };

  const priorityColors = {
    low: '#94a3b8',
    medium: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444'
  };

  return (
    <>
      <div className={`task-card ${compact ? 'task-card-compact' : ''} ${task.status === 'completed' ? 'completed' : ''}`}>
        <div className="task-card-left">
          <button 
            className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
            onClick={handleToggleComplete}
          >
            {task.status === 'completed' && <Check size={14} />}
          </button>
          
          <div className="task-content">
            <span className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
              {task.title}
            </span>
            
            {!compact && task.description && (
              <p className="task-description">{task.description}</p>
            )}
            
            <div className="task-meta">
              <span 
                className="task-priority"
                style={{ color: priorityColors[task.priority] }}
              >
                <Flag size={12} />
                {task.priority}
              </span>
              
              {task.category && (
                <span className="task-category" style={{ background: task.category.color + '20', color: task.category.color }}>
                  {task.category.name}
                </span>
              )}
              
              {task.tags && task.tags.length > 0 && (
                <span className="task-tags">
                  {task.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="task-tag">#{tag}</span>
                  ))}
                  {task.tags.length > 2 && <span className="task-tag-more">+{task.tags.length - 2}</span>}
                </span>
              )}
              
              {showDate && task.dueDate && (
                <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
                  <Calendar size={12} />
                  {formatDueDate(task.dueDate)}
                </span>
              )}
              
              {task.timeSpent > 0 && (
                <span className="task-time">
                  <Clock size={12} />
                  {Math.floor(task.timeSpent / 60)}h {task.timeSpent % 60}m
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="task-card-right">
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="subtask-progress">
              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
            </span>
          )}
          
          <div className="task-menu-wrapper">
            <button 
              className="task-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="task-menu">
                <button onClick={() => { setShowEditModal(true); setShowMenu(false); }}>
                  <Edit size={14} /> Edit
                </button>
                <button onClick={handleArchive}>
                  <Archive size={14} /> Archive
                </button>
                <button className="danger" onClick={handleDelete}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <TaskModal task={task} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}

export default TaskCard;

