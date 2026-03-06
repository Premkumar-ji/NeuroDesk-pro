import mongoose from 'mongoose';

const timerSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  type: {
    type: String,
    enum: ['work', 'break'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
timerSessionSchema.index({ user: 1, completedAt: -1 });
timerSessionSchema.index({ user: 1, task: 1 });

const TimerSession = mongoose.model('TimerSession', timerSessionSchema);

export default TimerSession;

