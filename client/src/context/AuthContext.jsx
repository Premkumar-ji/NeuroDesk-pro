import { createContext, useContext, useReducer, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
  theme: 'dark'
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        theme: action.payload.user?.settings?.theme || 'dark'
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        user: {
          ...state.user,
          settings: { ...state.user.settings, ...action.payload }
        },
        theme: action.payload.theme || state.theme
      };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const user = await response.json();
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user, token }
            });
          } else {
            localStorage.removeItem('token');
            dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
          }
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
        }
      } else {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: null, token: null } });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data, token: data.token }
        });
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: data.message });
        return { success: false, error: data.message };
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Network error' });
      return { success: false, error: 'Network error' };
    }
  };

  // Register function
  const register = async (name, email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data, token: data.token }
        });
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: data.message || data.errors?.[0]?.msg });
        return { success: false, error: data.message || data.errors?.[0]?.msg };
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Network error' });
      return { success: false, error: 'Network error' };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  // Update user settings
  const updateSettings = async (settings) => {
    const token = state.token;
    try {
      const response = await fetch(`${API_URL}/api/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Update profile
  const updateProfile = async (data) => {
    const token = state.token;
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Toggle theme
  const toggleTheme = async () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    await updateSettings({ theme: newTheme });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateSettings,
    updateProfile,
    toggleTheme,
    clearError,
    dispatch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

