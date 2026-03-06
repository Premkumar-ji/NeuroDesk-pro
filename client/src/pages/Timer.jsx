import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Check } from 'lucide-react';
import './Timer.css';

function Timer() {
  const { user } = useAuth();
  const { tasks, updateTask } = useTasks();
  
  const [mode, setMode] = useState('work'); // 'work' | 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessions, setSessions] = useState([]);
  
  const [workDuration, setWorkDuration] = useState(user?.settings?.pomodoroWork || 25);
  const [breakDuration, setBreakDuration] = useState(user?.settings?.pomodoroBreak || 5);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');

  useEffect(() => {
    if (mode === 'work') {
      setTimeLeft(workDuration * 60);
    } else {
      setTimeLeft(breakDuration * 60);
    }
    setIsRunning(false);
  }, [mode, workDuration, breakDuration]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    
    // Play notification sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Log session if it was a work session
    if (mode === 'work') {
      const newSession = {
        id: Date.now(),
        taskId: selectedTask?._id,
        taskTitle: selectedTask?.title || 'Unassigned',
        duration: workDuration,
        completedAt: new Date().toISOString()
      };
      setSessions(prev => [newSession, ...prev]);

      // Update task time spent
      if (selectedTask) {
        await updateTask(selectedTask._id, {
          timeSpent: (selectedTask.timeSpent || 0) + workDuration
        });
      }

      // Save to backend
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/timer/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            task: selectedTask?._id,
            type: 'work',
            duration: workDuration
          })
        });
      } catch (error) {
        console.error('Failed to save timer session:', error);
      }

      // Switch to break mode
      setMode('break');
    } else {
      // Switch back to work mode
      setMode('work');
    }
  }, [mode, workDuration, selectedTask, soundEnabled, updateTask]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setTimeLeft(workDuration * 60);
    } else {
      setTimeLeft(breakDuration * 60);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work' 
    ? ((workDuration * 60 - timeLeft) / (workDuration * 60)) * 100
    : ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;

  const totalSeconds = mode === 'work' ? workDuration * 60 : breakDuration * 60;

  return (
    <div className="timer-page">
      {/* Hidden audio element for notification */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleBYAOaHU5LSAMBCUsc/RrHAuIEmJvdnPoH1FFEmVx9m2f0oZTYW6082yejQRj7PN1reAShmEicnXsoA6FIWEy+Cyfz8YfIPG3b6APBqCf8Xju4FCH4F+weO8gT8ggX3A4byBPYCBfcFhvIE9gIF9wWG8gT2AgX3BYbyBPYCBfcFhvIE9gIF9wWG8gT2AgX3BYbyBPYCBfcF" />

      <div className="page-header">
        <div className="page-title">
          <h1>Focus Timer</h1>
          <span className="timer-subtitle">Pomodoro Technique</span>
        </div>
        <div className="timer-actions">
          <button 
            className={`btn btn-icon ${soundEnabled ? '' : 'muted'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="setting-item">
            <label>Work Duration (minutes)</label>
            <input
              type="number"
              className="input"
              value={workDuration}
              onChange={(e) => setWorkDuration(Math.max(1, parseInt(e.target.value) || 25))}
              min="1"
              max="60"
            />
          </div>
          <div className="setting-item">
            <label>Break Duration (minutes)</label>
            <input
              type="number"
              className="input"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Math.max(1, parseInt(e.target.value) || 5))}
              min="1"
              max="30"
            />
          </div>
        </div>
      )}

      <div className="timer-container">
        {/* Timer Display */}
        <div className="timer-display">
          {/* Mode Tabs */}
          <div className="mode-tabs">
            <button 
              className={`mode-tab ${mode === 'work' ? 'active' : ''}`}
              onClick={() => handleModeChange('work')}
            >
              Focus
            </button>
            <button 
              className={`mode-tab ${mode === 'break' ? 'active' : ''}`}
              onClick={() => handleModeChange('break')}
            >
              Break
            </button>
          </div>

          {/* Timer Circle */}
          <div className="timer-circle">
            <svg viewBox="0 0 200 200">
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="none" 
                stroke="var(--border)" 
                strokeWidth="8"
              />
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="none" 
                stroke={mode === 'work' ? 'var(--accent-primary)' : 'var(--success)'} 
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${progress * 5.65} 565`}
                transform="rotate(-90 100 100)"
                className="timer-progress"
              />
            </svg>
            <div className="timer-time">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Timer Controls */}
          <div className="timer-controls">
            {!isRunning ? (
              <button className="btn btn-primary btn-lg" onClick={handleStart}>
                <Play size={24} />
                Start
              </button>
            ) : (
              <button className="btn btn-warning btn-lg" onClick={handlePause}>
                <Pause size={24} />
                Pause
              </button>
            )}
            <button className="btn btn-secondary btn-lg" onClick={handleReset}>
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Task Selection */}
        <div className="task-selection">
          <h3>Link to a Task</h3>
          <p className="task-selection-hint">Time will be logged to the selected task</p>
          
          <div className="task-list">
            <button 
              className={`task-option ${!selectedTask ? 'selected' : ''}`}
              onClick={() => setSelectedTask(null)}
            >
              <div className="task-option-icon">
                <Check size={16} />
              </div>
              <div className="task-option-content">
                <span className="task-option-title">No task selected</span>
              </div>
            </button>
            
            {activeTasks.map(task => (
              <button 
                key={task._id}
                className={`task-option ${selectedTask?._id === task._id ? 'selected' : ''}`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="task-option-icon">
                  {selectedTask?._id === task._id && <Check size={16} />}
                </div>
                <div className="task-option-content">
                  <span className="task-option-title">{task.title}</span>
                  <span className="task-option-meta">
                    {task.timeSpent > 0 && `${Math.floor(task.timeSpent / 60)}h ${task.timeSpent % 60}m logged`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="sessions-panel">
          <h3>Recent Sessions</h3>
          <div className="sessions-list">
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <span className="session-task">{session.taskTitle}</span>
                  <span className="session-time">
                    {new Date(session.completedAt).toLocaleTimeString()}
                  </span>
                </div>
                <span className="session-duration">{session.duration} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Timer;

