import { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { X, Plus, Trash2, Calendar, Flag, Tag, RotateCcw, Sparkles } from 'lucide-react';
import './TaskModal.css';

function TaskModal({ task = null, onClose }) {
  const { createTask, updateTask, categories, parseNaturalLanguage } = useTasks();
  const [loading, setLoading] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    dueTime: '',
    tags: [],
    category: '',
    subtasks: [],
    recurring: { enabled: false, type: 'daily', interval: 1 }
  });

  const [tagInput, setTagInput] = useState('');
  const [aiInput, setAiInput] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        dueTime: task.dueDate ? task.dueDate.split('T')[1]?.slice(0, 5) : '',
        tags: task.tags || [],
        category: task.category?._id || task.category || '',
        subtasks: task.subtasks || [],
        recurring: task.recurring || { enabled: false, type: 'daily', interval: 1 }
      });
    }
  }, [task]);

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    
    setAiParsing(true);
    const result = await parseNaturalLanguage(aiInput);
    setAiParsing(false);
    
    if (result) {
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        priority: result.priority || prev.priority,
        dueDate: result.dueDate ? result.dueDate.split('T')[0] : prev.dueDate,
        dueTime: result.dueDate ? result.dueDate.split('T')[1]?.slice(0, 5) : prev.dueTime,
        tags: [...new Set([...prev.tags, ...result.tags])],
        recurring: result.recurring.enabled ? result.recurring : prev.recurring
      }));
      setShowAiInput(false);
      setAiInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);

    let dueDate = null;
    if (formData.dueDate) {
      dueDate = formData.dueDate;
      if (formData.dueTime) {
        dueDate += `T${formData.dueTime}:00`;
      }
    }

    const taskData = {
      ...formData,
      dueDate,
      category: formData.category || null
    };

    let result;
    if (task) {
      result = await updateTask(task._id, taskData);
    } else {
      result = await createTask(taskData);
    }

    setLoading(false);

    if (result.success) {
      onClose();
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addSubtask = () => {
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { title: '', completed: false }]
    }));
  };

  const updateSubtask = (index, value) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((st, i) => 
        i === index ? { ...st, title: value } : st
      )
    }));
  };

  const removeSubtask = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          {/* AI Input Toggle */}
          {!task && (
            <div className="ai-input-section">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAiInput(!showAiInput)}
              >
                <Sparkles size={16} />
                AI Create
              </button>
              
              {showAiInput && (
                <div className="ai-input-wrapper">
                  <input
                    type="text"
                    className="input"
                    placeholder='Try: "Finish report tomorrow at 5pm #work"'
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiParse()}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAiParse}
                    disabled={aiParsing}
                  >
                    {aiParsing ? 'Parsing...' : 'Create'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea
              className="input textarea"
              placeholder="Add a description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Priority & Status */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                <Flag size={14} /> Priority
              </label>
              <select
                className="select"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Status</label>
              <select
                className="select"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                <Calendar size={14} /> Due Date
              </label>
              <input
                type="date"
                className="input"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Due Time</label>
              <input
                type="time"
                className="input"
                value={formData.dueTime}
                onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Category */}
          <div className="input-group">
            <label className="input-label">Category</label>
            <select
              className="select"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">No Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="input-group">
            <label className="input-label">
              <Tag size={14} /> Tags
            </label>
            <div className="tags-input-wrapper">
              <div className="tags-list">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input
                  type="text"
                  className="input"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Recurring */}
          <div className="input-group">
            <label className="checkbox-wrapper">
              <div 
                className={`checkbox ${formData.recurring.enabled ? 'checked' : ''}`}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  recurring: { ...prev.recurring, enabled: !prev.recurring.enabled } 
                }))}
              >
                {formData.recurring.enabled && <RotateCcw size={12} />}
              </div>
              <span>Recurring Task</span>
            </label>
            
            {formData.recurring.enabled && (
              <div className="recurring-options">
                <select
                  className="select"
                  value={formData.recurring.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recurring: { ...prev.recurring, type: e.target.value } 
                  }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div className="input-group">
            <label className="input-label">Subtasks</label>
            <div className="subtasks-list">
              {formData.subtasks.map((subtask, index) => (
                <div key={index} className="subtask-item">
                  <input
                    type="text"
                    className="input"
                    placeholder={`Subtask ${index + 1}`}
                    value={subtask.title}
                    onChange={(e) => updateSubtask(index, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => removeSubtask(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addSubtask}
              >
                <Plus size={14} /> Add Subtask
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;

