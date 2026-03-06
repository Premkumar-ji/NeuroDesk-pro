import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

const TaskContext = createContext(null);

const initialState = {
  tasks: [],
  categories: [],
  loading: false,
  error: null,
  filters: {
    status: 'active',
    priority: '',
    category: '',
    tag: '',
    search: '',
    sortBy: 'order',
    sortOrder: 'asc'
  },
  stats: null,
  aiSuggestions: []
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task._id === action.payload._id ? action.payload : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task._id !== action.payload)
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat._id === action.payload._id ? action.payload : cat
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat._id !== action.payload)
      };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_AI_SUGGESTIONS':
      return { ...state, aiSuggestions: action.payload };
    case 'REORDER_TASKS':
      return { ...state, tasks: action.payload };
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const { token, user } = useAuth();
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Fetch tasks when filters change or user logs in
  useEffect(() => {
    if (token && user) {
      fetchTasks();
      fetchCategories();
      fetchStats();
    }
  }, [token, user, state.filters]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const queryParams = new URLSearchParams();
      const { filters } = state;
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.tag) queryParams.append('tag', filters.tag);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`${API_URL}/api/tasks?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_TASKS', payload: data.tasks });
      } else {
        const error = await response.json();
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch tasks' });
    }
  }, [token, state.filters]);

  // Create task
  const createTask = async (taskData) => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'ADD_TASK', payload: data });
        fetchStats();
        return { success: true, task: data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to create task' };
    }
  };

  // Update task
  const updateTask = async (taskId, updates) => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'UPDATE_TASK', payload: data });
        fetchStats();
        return { success: true, task: data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to update task' };
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        fetchStats();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to delete task' };
    }
  };

  // Reorder tasks
  const reorderTasks = async (tasks) => {
    if (!token) return { success: false };

    try {
      const response = await fetch(`${API_URL}/api/tasks/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tasks })
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'REORDER_TASKS', payload: data });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_CATEGORIES', payload: data });
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Create category
  const createCategory = async (categoryData) => {
    if (!token) return { success: false };

    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'ADD_CATEGORY', payload: data });
        return { success: true, category: data };
      }
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: 'Failed to create category' };
    }
  };

  // Update category
  const updateCategory = async (categoryId, updates) => {
    if (!token) return { success: false };

    try {
      const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'UPDATE_CATEGORY', payload: data });
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false };
    }
  };

  // Delete category
  const deleteCategory = async (categoryId) => {
    if (!token) return { success: false };

    try {
      const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
        fetchTasks(); // Refresh tasks to update category reference
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  // Fetch stats
  const fetchStats = async (period = 'all') => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/stats?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_STATS', payload: data });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Fetch AI suggestions
  const fetchAISuggestions = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/tasks/ai/suggestions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_AI_SUGGESTIONS', payload: data.suggestions });
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
    }
  };

  // Parse natural language
  const parseNaturalLanguage = async (input) => {
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/api/tasks/parse-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ input })
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  };

  // Update filters
  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  // Export tasks
  const exportTasks = async (format) => {
    if (!token) return { success: false };

    try {
      const response = await fetch(`${API_URL}/api/tasks/export/${format}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Use xlsx extension for excel format
        const fileExt = format === 'excel' ? 'xlsx' : format;
        a.download = `tasks.${fileExt}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true };
      } else {
        console.error('Export failed:', response.status);
        return { success: false };
      }
    } catch (error) {
      console.error('Export error:', error);
      return { success: false };
    }
  };

  const value = {
    ...state,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchStats,
    fetchAISuggestions,
    parseNaturalLanguage,
    setFilters,
    exportTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

export default TaskContext;

