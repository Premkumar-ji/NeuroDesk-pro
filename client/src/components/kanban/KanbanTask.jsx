import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MoreVertical, Trash2, Edit, Archive } from 'lucide-react';
import { isToday, isTomorrow, isPast, format } from 'date-fns';
import { useTasks } from '../../context/TaskContext';
import TaskModal from '../tasks/TaskModal';

function KanbanTask({ task, isDragging = false }) {
  const { updateTask, deleteTask } = useTasks();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';

  const formatDueDate = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`kanban-task ${isDragging || isSortableDragging ? 'dragging' : ''}`}
      >
        <div className="kanban-task-header">
          <span className="kanban-task-title">{task.title}</span>
          <span className={`kanban-task-priority ${task.priority}`}>
            {task.priority}
          </span>
        </div>

        <div className="kanban-task-meta">
          {task.dueDate && (
            <span className={`kanban-task-due ${isOverdue ? 'overdue' : ''}`}>
              <Calendar size={12} />
              {formatDueDate(task.dueDate)}
            </span>
          )}

          {task.category && (
            <span 
              className="kanban-task-category"
              style={{ 
                background: task.category.color + '20', 
                color: task.category.color 
              }}
            >
              {task.category.name}
            </span>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="kanban-task-tags">
              {task.tags.slice(0, 2).map(tag => (
                <span key={tag} className="kanban-task-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="kanban-task-actions">
          <button 
            className="task-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
          >
            <Edit size={14} />
          </button>
          <button 
            className="task-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <div className="kanban-task-menu" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setShowEditModal(true); setShowMenu(false); }}>
                <Edit size={12} /> Edit
              </button>
              <button onClick={handleArchive}>
                <Archive size={12} /> Archive
              </button>
              <button className="danger" onClick={handleDelete}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <TaskModal task={task} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}

export default KanbanTask;

