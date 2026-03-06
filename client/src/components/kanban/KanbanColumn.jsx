import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import KanbanTask from './KanbanTask';

function KanbanColumn({ column, tasks, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id
  });

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <span 
            className="column-indicator" 
            style={{ background: column.color }}
          />
          <h3>{column.title}</h3>
          <span className="kanban-column-count">{tasks.length}</span>
        </div>
        <button className="kanban-column-add" onClick={onAddTask}>
          <Plus size={18} />
        </button>
      </div>

      <div 
        ref={setNodeRef}
        className={`kanban-column-content ${isOver ? 'drag-over' : ''}`}
      >
        <SortableContext 
          items={tasks.map(t => t._id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <KanbanTask key={task._id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="kanban-empty">
            <p>No tasks in this column</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;

