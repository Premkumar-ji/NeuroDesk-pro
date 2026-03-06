import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import KanbanColumn from '../components/kanban/KanbanColumn';
import KanbanTask from '../components/kanban/KanbanTask';
import TaskModal from '../components/tasks/TaskModal';
import './Kanban.css';

function Kanban() {
  const { tasks, updateTask, createTask } = useTasks();
  const [activeId, setActiveId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');

  const columns = [
    { id: 'todo', title: 'To Do', color: '#94a3b8' },
    { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
    { id: 'completed', title: 'Completed', color: '#10b981' }
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t._id === active.id);
    
    // Check if dropping on a column
    if (columns.find(c => c.id === over.id)) {
      updateTask(active.id, { status: over.id });
      return;
    }

    const overTask = tasks.find(t => t._id === over.id);
    if (!overTask || !activeTask) return;

    // If dropped on a different status column
    if (activeTask.status !== overTask.status) {
      updateTask(active.id, { status: overTask.status });
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(t => t._id === active.id);
    if (!activeTask) return;

    // Check if dragging over a column
    const overColumn = columns.find(c => c.id === over.id);
    if (overColumn && activeTask.status !== overColumn.id) {
      updateTask(active.id, { status: overColumn.id });
    }
  };

  const handleAddTask = (status) => {
    setNewTaskStatus(status);
    setShowTaskModal(true);
  };

  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

  return (
    <div className="kanban-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Kanban Board</h1>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="kanban-board">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id)}
              onAddTask={() => handleAddTask(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanTask task={activeTask} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {showTaskModal && (
        <TaskModal 
          onClose={() => setShowTaskModal(false)}
          initialStatus={newTaskStatus}
        />
      )}
    </div>
  );
}

export default Kanban;

