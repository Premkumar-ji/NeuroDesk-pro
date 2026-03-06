import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';
import { parseTaskWithAI } from '../utils/aiParser.js';
import * as XLSX from 'xlsx';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// @route   GET /api/tasks/export/:format
// @desc    Export tasks to Excel
// @access  Private
router.get('/export/:format', protect, async (req, res) => {
  try {
    const { format } = req.params;
    
    // Fetch all tasks for the user
    const tasks = await Task.find({ user: req.user._id })
      .populate('category', 'name color')
      .sort({ order: 1 });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found to export' });
    }

    // Transform tasks for export
    const exportData = tasks.map(task => ({
      'Title': task.title,
      'Description': task.description || '',
      'Status': task.status,
      'Priority': task.priority,
      'Category': task.category?.name || '',
      'Due Date': task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
      'Tags': task.tags?.join(', ') || '',
      'Created At': new Date(task.createdAt).toLocaleDateString(),
      'Completed At': task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Title
      { wch: 40 }, // Description
      { wch: 15 }, // Status
      { wch: 12 }, // Priority
      { wch: 15 }, // Category
      { wch: 15 }, // Due Date
      { wch: 20 }, // Tags
      { wch: 15 }, // Created At
      { wch: 15 }  // Completed At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Set headers
    const filename = `tasks_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Export tasks error:', error);
    res.status(500).json({ message: 'Failed to export tasks' });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks for user with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      category, 
      tags, 
      search,
      sortBy = 'order',
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = { user: req.user._id };
    
    if (status && status !== '' && status !== 'all') {
      if (status === 'active') {
        query.status = { $in: ['todo', 'in_progress'] };
      } else {
        query.status = status;
      }
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'dueDate') {
      sortOptions.dueDate = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'priority') {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      sortOptions.priority = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'order') {
      sortOptions.order = sortOrder === 'asc' ? 1 : -1;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('category', 'name color')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/ai-parse
// @desc    Parse task with AI from natural language
// @access  Private
router.get('/ai-parse', protect, async (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const parsed = parseTaskWithAI(text);
    res.json(parsed);
  } catch (error) {
    console.error('AI parse error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks/parse-ai
// @desc    Parse task with AI from natural language
// @access  Private
router.post('/parse-ai', protect, async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({ message: 'Input is required' });
    }

    const parsed = parseTaskWithAI(input);
    res.json(parsed);
  } catch (error) {
    console.error('AI parse error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/ai/suggestions
// @desc    Get AI-powered task suggestions
// @access  Private
router.get('/ai/suggestions', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id, status: { $ne: 'completed' } })
      .sort({ priority: -1, dueDate: 1 })
      .limit(5);
    
    const suggestions = tasks.map((task, index) => {
      let suggestion = '';
      if (task.priority === 'critical') {
        suggestion = `🔴 Priority: Complete "${task.title}" ASAP`;
      } else if (task.dueDate && new Date(task.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        suggestion = `⏰ "${task.title}" is due soon`;
      } else if (index === 0) {
        suggestion = `💡 Start with "${task.title}" - it's your highest priority`;
      } else {
        suggestion = `✓ Next up: "${task.title}"`;
      }
      return suggestion;
    });
    
    res.json({ suggestions });
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', [
  protect,
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 })
], validate, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      status,
      dueDate, 
      reminder,
      tags,
      category,
      subtasks,
      recurring,
      dependencies
    } = req.body;

    // Get max order for the user
    const maxOrderTask = await Task.findOne({ user: req.user._id }).sort({ order: -1 });
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate,
      reminder,
      tags: tags || [],
      category,
      subtasks: subtasks || [],
      recurring: recurring || { enabled: false },
      dependencies: dependencies || [],
      order
    });

    // Populate category
    await task.populate('category', 'name color');

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks/ai
// @desc    Create task from AI-parsed natural language
// @access  Private
router.post('/ai', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Parse with AI
    const parsed = parseTaskWithAI(text);

    // Get max order for the user
    const maxOrderTask = await Task.findOne({ user: req.user._id }).sort({ order: -1 });
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      user: req.user._id,
      title: parsed.title,
      description: parsed.description || '',
      priority: parsed.priority || 'medium',
      status: 'todo',
      dueDate: parsed.dueDate,
      reminder: parsed.reminder,
      tags: parsed.tags || [],
      recurring: parsed.recurring || { enabled: false },
      order
    });

    await task.populate('category', 'name color');

    res.status(201).json(task);
  } catch (error) {
    console.error('Create AI task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { 
      title, 
      description, 
      priority, 
      status,
      dueDate, 
      reminder,
      tags,
      category,
      subtasks,
      recurring,
      dependencies,
      order,
      timeSpent
    } = req.body;

    // Check if task is being completed
    const wasCompleted = task.status === 'completed';
    const isNowCompleted = status === 'completed';

    task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        priority,
        status,
        dueDate,
        reminder,
        tags,
        category,
        subtasks,
        recurring,
        dependencies,
        order,
        timeSpent
      },
      { new: true, runValidators: true }
    ).populate('category', 'name color');

    // Update streak if task completed
    if (!wasCompleted && isNowCompleted) {
      await updateStreak(req.user._id);
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/reorder
// @desc    Reorder tasks
// @access  Private
router.put('/reorder', [
  protect,
  body('tasks').isArray().withMessage('Tasks array is required')
], validate, async (req, res) => {
  try {
    const { tasks } = req.body;

    // Update order for each task
    for (const item of tasks) {
      await Task.findOneAndUpdate(
        { _id: item.id, user: req.user._id },
        { order: item.order }
      );
    }

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to update streak
async function updateStreak(userId) {
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCompleted = user.streakData.lastCompletedDate;
  
  if (!lastCompleted) {
    // First task ever completed
    user.streakData.currentStreak = 1;
    user.streakData.bestStreak = 1;
    user.streakData.lastCompletedDate = today;
  } else {
    const lastDate = new Date(lastCompleted);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, no change
    } else if (diffDays === 1) {
      // Consecutive day
      user.streakData.currentStreak += 1;
      if (user.streakData.currentStreak > user.streakData.bestStreak) {
        user.streakData.bestStreak = user.streakData.currentStreak;
      }
      user.streakData.lastCompletedDate = today;
    } else {
      // Streak broken
      user.streakData.currentStreak = 1;
      user.streakData.lastCompletedDate = today;
    }
  }

  await user.save();
}

export default router;

