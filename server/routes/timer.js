import express from 'express';
import TimerSession from '../models/TimerSession.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/timer/session
// @desc    Log a pomodoro session
// @access  Private
router.post('/session', protect, async (req, res) => {
  try {
    const { task, type, duration } = req.body;

    const session = await TimerSession.create({
      user: req.user._id,
      task,
      type,
      duration
    });

    // If it's a work session and linked to a task, update task time
    if (type === 'work' && task) {
      await Task.findByIdAndUpdate(task, {
        $inc: { timeSpent: duration }
      });
    }

    res.status(201).json(session);
  } catch (error) {
    console.error('Log timer session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timer/sessions
// @desc    Get timer sessions
// @access  Private
router.get('/sessions', protect, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const sessions = await TimerSession.find({ user: req.user._id })
      .populate('task', 'title')
      .sort({ completedAt: -1 })
      .limit(parseInt(limit));

    res.json(sessions);
  } catch (error) {
    console.error('Get timer sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

