import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { Moon, Sun, Bell, Mail, Download, Upload, Trash2, Database } from 'lucide-react';
import './Settings.css';

function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { exportTasks, importTasks } = useTasks();
  const [settings, setSettings] = useState({
    theme: 'dark',
    pomodoroWork: 25,
    pomodoroBreak: 5,
    notifications: true,
    emailReminders: false
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: newSettings })
      });
      
      if (response.ok) {
        // Apply theme change immediately
        if (key === 'theme') {
          document.documentElement.setAttribute('data-theme', value);
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleExport = async (format) => {
    await exportTasks(format);
    setMessage({ type: 'success', text: `Tasks exported as ${format.toUpperCase()}` });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const result = await importTasks(data);
      
      if (result.success) {
        setMessage({ type: 'success', text: `Successfully imported ${result.count} tasks` });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid file format' });
    }
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    if (!window.confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        logout();
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Settings</h1>
        </div>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-sections">
        {/* Appearance */}
        <div className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-icon">
                {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <span className="setting-label">Theme</span>
                <span className="setting-description">Choose your preferred color scheme</span>
              </div>
            </div>
            <div className="theme-selector">
              <button 
                className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleSettingChange('theme', 'dark')}
              >
                <Moon size={16} />
                Dark
              </button>
              <button 
                className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => handleSettingChange('theme', 'light')}
              >
                <Sun size={16} />
                Light
              </button>
            </div>
          </div>
        </div>

        {/* Pomodoro Timer */}
        <div className="settings-section">
          <h2>Pomodoro Timer</h2>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-icon"><span className="icon-text">🎯</span></div>
              <div>
                <span className="setting-label">Work Duration</span>
                <span className="setting-description">Length of focus sessions</span>
              </div>
            </div>
            <div className="setting-input-group">
              <input
                type="number"
                className="input"
                value={settings.pomodoroWork}
                onChange={(e) => handleSettingChange('pomodoroWork', parseInt(e.target.value) || 25)}
                min="1"
                max="60"
              />
              <span>minutes</span>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-icon"><span className="icon-text">☕</span></div>
              <div>
                <span className="setting-label">Break Duration</span>
                <span className="setting-description">Length of break periods</span>
              </div>
            </div>
            <div className="setting-input-group">
              <input
                type="number"
                className="input"
                value={settings.pomodoroBreak}
                onChange={(e) => handleSettingChange('pomodoroBreak', parseInt(e.target.value) || 5)}
                min="1"
                max="30"
              />
              <span>minutes</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h2>Notifications</h2>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-icon"><Bell size={20} /></div>
              <div>
                <span className="setting-label">Push Notifications</span>
                <span className="setting-description">Receive reminders for due tasks</span>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-icon"><Mail size={20} /></div>
              <div>
                <span className="setting-label">Email Reminders</span>
                <span className="setting-description">Receive email for important deadlines</span>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.emailReminders}
                onChange={(e) => handleSettingChange('emailReminders', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-section">
          <h2>Data Management</h2>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-icon"><Download size={20} /></div>
              <div>
                <span className="setting-label">Export Data</span>
                <span className="setting-description">Download all your tasks</span>
              </div>
            </div>
            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => handleExport('json')}>
                JSON
              </button>
              <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
                CSV
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-icon"><Upload size={20} /></div>
              <div>
                <span className="setting-label">Import Data</span>
                <span className="setting-description">Restore from a backup</span>
              </div>
            </div>
            <label className="btn btn-secondary import-btn">
              <Upload size={16} />
              Choose File
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="setting-row danger">
            <div className="setting-info">
              <div className="setting-icon"><Trash2 size={20} /></div>
              <div>
                <span className="setting-label">Delete Account</span>
                <span className="setting-description">Permanently delete all your data</span>
              </div>
            </div>
            <button className="btn btn-danger" onClick={handleDeleteAccount}>
              Delete
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="settings-section">
          <h2>Account</h2>
          <div className="account-info">
            <div className="avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="account-details">
              <span className="account-name">{user?.name}</span>
              <span className="account-email">{user?.email}</span>
            </div>
          </div>
          <button className="btn btn-secondary logout-btn" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;

