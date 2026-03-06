import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/stats
// @desc    Get productivity statistics
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = { completedAt: { $gte: todayStart } };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        dateFilter = { completedAt: { $gte: weekStart } };
        break;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setMonth(monthStart.getMonth() - 1);
        dateFilter = { completedAt: { $gte: monthStart } };
        break;
      default:
        dateFilter = {};
    }

    // Get user
    const user = await User.findById(req.user._id);

    // Get all tasks for user
    const allTasks = await Task.find({ user: req.user._id });
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const activeTasks = allTasks.filter(t => t.status !== 'completed' && t.status !== 'archived');

    // Get completed tasks in period
    const completedInPeriod = await Task.find({
      user: req.user._id,
      status: 'completed',
      ...dateFilter
    });

    // Priority distribution
    const priorityDistribution = {
      critical: allTasks.filter(t => t.priority === 'critical').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length
    };

    // Status distribution
    const statusDistribution = {
      todo: allTasks.filter(t => t.status === 'todo').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: completedTasks
    };

    // Calculate completion rate
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // Calculate average tasks per day
    const userCreationDate = user.createdAt;
    const daysSinceRegistration = Math.max(1, Math.floor((new Date() - userCreationDate) / (1000 * 60 * 60 * 24)));
    const avgTasksPerDay = (completedTasks / daysSinceRegistration).toFixed(1);

    // Get time spent
    const totalTimeSpent = allTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
    const hours = Math.floor(totalTimeSpent / 60);
    const minutes = totalTimeSpent % 60;

    // Get recent completed tasks
    const recentCompleted = await Task.find({
      user: req.user._id,
      status: 'completed'
    })
    .sort({ completedAt: -1 })
    .limit(5)
    .populate('category', 'name color');

    res.json({
      overview: {
        totalTasks,
        completedTasks,
        activeTasks: activeTasks.length,
        completionRate: parseFloat(completionRate),
        avgTasksPerDay: parseFloat(avgTasksPerDay)
      },
      priorityDistribution,
      statusDistribution,
      streak: {
        currentStreak: user.streakData.currentStreak,
        bestStreak: user.streakData.bestStreak,
        lastCompletedDate: user.streakData.lastCompletedDate
      },
      timeSpent: {
        total: totalTimeSpent,
        formatted: `${hours}h ${minutes}m`
      },
      recentCompleted
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/daily
// @desc    Get daily statistics for charts
// @access  Private
router.get('/daily', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    
    const dailyData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const created = await Task.countDocuments({
        user: req.user._id,
        createdAt: { $gte: date, $lt: nextDate }
      });

      const completed = await Task.countDocuments({
        user: req.user._id,
        status: 'completed',
        completedAt: { $gte: date, $lt: nextDate }
      });

      dailyData.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[date.getDay()],
        created,
        completed
      });
    }

    res.json(dailyData);
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/streak
// @desc    Get streak data
// @access  Private
router.get('/streak', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      currentStreak: user.streakData.currentStreak,
      bestStreak: user.streakData.bestStreak,
      lastCompletedDate: user.streakData.lastCompletedDate
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/insights
// @desc    Get productivity insights
// @access  Private
router.get('/insights', protect, async (req, res) => {
  try {
    const allTasks = await Task.find({ user: req.user._id });
    const user = await User.findById(req.user._id);
    
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const overdueTasks = allTasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    
    // Calculate average focus time
    const TimerSession = (await import('../models/TimerSession.js')).default;
    const sessions = await TimerSession.find({ user: req.user._id });
    const avgFocusTime = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
      : 0;
    
    const stats = {
      completionRate,
      streak: {
        currentStreak: user.streakData.currentStreak
      },
      overdueTasks,
      avgFocusTime
    };
    
    const { generateInsights } = await import('../utils/aiParser.js');
    const insights = generateInsights(stats);
    
    res.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

