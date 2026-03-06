import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import TaskModal from '../components/tasks/TaskModal';
import './Calendar.css';

function Calendar() {
  const { tasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day) => {
    return tasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), day)
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  const handleAddTask = (day) => {
    setSelectedDate(day);
    setShowTaskModal(true);
  };

  const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate) : [];

  const priorityColors = {
    low: '#94a3b8',
    medium: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444'
  };

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Calendar</h1>
        </div>
      </div>

      <div className="calendar-container">
        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Month Navigation */}
          <div className="calendar-header">
            <button 
              className="btn btn-ghost btn-icon"
              onClick={handlePrevMonth}
            >
              <ChevronLeft size={20} />
            </button>
            <h2>{format(currentDate, 'MMMM yyyy')}</h2>
            <button 
              className="btn btn-ghost btn-icon"
              onClick={handleNextMonth}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="calendar-days">
            {days.map(day => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="day-header">
                    <span className="day-number">{format(day, 'd')}</span>
                    <button 
                      className="day-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddTask(day);
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  {dayTasks.length > 0 && (
                    <div className="day-tasks">
                      {dayTasks.slice(0, 3).map(task => (
                        <div
                          key={task._id}
                          className="day-task"
                          style={{ borderLeftColor: priorityColors[task.priority] }}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="day-more">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Panel */}
        <div className="calendar-sidebar">
          <div className="sidebar-header">
            {selectedDate ? (
              <h3>{format(selectedDate, 'EEEE, MMMM d')}</h3>
            ) : (
              <h3>Select a day</h3>
            )}
          </div>

          <div className="sidebar-tasks">
            {selectedDate ? (
              selectedDayTasks.length > 0 ? (
                selectedDayTasks.map(task => (
                  <div key={task._id} className="sidebar-task">
                    <div 
                      className="task-priority-indicator"
                      style={{ background: priorityColors[task.priority] }}
                    />
                    <div className="task-details">
                      <span className="task-title">{task.title}</span>
                      {task.category && (
                        <span 
                          className="task-category"
                          style={{ 
                            background: task.category.color + '20', 
                            color: task.category.color 
                          }}
                        >
                          {task.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="sidebar-empty">
                  <p>No tasks scheduled</p>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowTaskModal(true)}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>
              )
            ) : (
              <div className="sidebar-empty">
                <p>Click on a day to view tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal 
          onClose={() => setShowTaskModal(false)}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}

export default Calendar;

