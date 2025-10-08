import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';

const AuthContext = createContext();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setSession = (sessionToken, sessionUser) => {
    setToken(sessionToken);
    setUser(sessionUser);
    if (sessionToken) {
      localStorage.setItem('token', sessionToken);
    } else {
      localStorage.removeItem('token');
    }
    if (sessionUser) {
      localStorage.setItem('user', JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const authHeaders = useMemo(
    () => ({ Authorization: token ? `Bearer ${token}` : '' }),
    [token]
  );

  const register = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post('/auth/register', payload);
        setSession(data.token, data.user);
        setGarden(data.user.jardin);
        return data.user;
      } catch (err) {
        setError(err.response?.data?.error || 'Error al registrar.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const login = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post('/auth/login', payload);
        setSession(data.token, data.user);
        setGarden(data.user.jardin);
        return data.user;
      } catch (err) {
        setError(err.response?.data?.error || 'Error al iniciar sesión.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setSession(null, null);
    setGarden(null);
  }, []);

  const fetchGarden = useCallback(async () => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/jardin', { headers: authHeaders });
      setGarden(data);
      return data;
    } catch (err) {
      setError('No se pudo obtener el jardín.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  const value = {
    token,
    user,
    garden,
    loading,
    error,
    register,
    login,
    logout,
    fetchGarden,
    setGarden,
    authHeaders,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
