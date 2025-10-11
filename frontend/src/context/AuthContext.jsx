import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';

const AuthContext = createContext();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
});

export const AuthProvider = ({ children }) => {
  const { t } = useLanguage();
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
        setError(err.response?.data?.error || t('authErrorRegister'));
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
        setError(err.response?.data?.error || t('authErrorLogin'));
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
      setError(t('authErrorFetchGarden'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  const searchUsers = useCallback(
    async (query) => {
      if (!token) return [];
      const { data } = await api.get('/usuarios/buscar', {
        headers: authHeaders,
        params: { q: query },
      });
      return data.resultados || [];
    },
    [authHeaders, token]
  );

  const addFriend = useCallback(
    async (friendId) => {
      if (!token) return null;
      const { data } = await api.post(`/usuarios/${friendId}/amigos`, null, {
        headers: authHeaders,
      });
      return data.amigo || null;
    },
    [authHeaders, token]
  );

  const getFriends = useCallback(
    async () => {
      if (!token) return [];
      const { data } = await api.get('/usuarios/amigos', { headers: authHeaders });
      return data.amigos || [];
    },
    [authHeaders, token]
  );

  const getUserProfile = useCallback(
    async (userId) => {
      if (!token) return null;
      const { data } = await api.get(`/usuarios/${userId}/perfil`, { headers: authHeaders });
      return data;
    },
    [authHeaders, token]
  );

  const togglePlantLike = useCallback(
    async (plantId) => {
      if (!token) return null;
      const { data } = await api.post(`/usuarios/plantas/${plantId}/likes`, null, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

  const createPlantComment = useCallback(
    async (plantId, payload) => {
      if (!token) return null;
      const { data } = await api.post(`/usuarios/plantas/${plantId}/comentarios`, payload, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

  const toggleCommentLike = useCallback(
    async (commentId) => {
      if (!token) return null;
      const { data } = await api.post(`/usuarios/comentarios/${commentId}/likes`, null, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

  const getEconomyOverview = useCallback(async () => {
    if (!token) return null;
    const { data } = await api.get('/economia/resumen', { headers: authHeaders });
    return data;
  }, [authHeaders, token]);

  const purchaseAccessory = useCallback(
    async (accessoryId) => {
      if (!token) return null;
      const { data } = await api.post(`/economia/accesorios/${accessoryId}/comprar`, null, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

  const sellAccessory = useCallback(
    async (accessoryId, payload = {}) => {
      if (!token) return null;
      const { data } = await api.post(`/economia/accesorios/${accessoryId}/vender`, payload, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

  const transferAccessory = useCallback(
    async (accessoryId, payload) => {
      if (!token) return null;
      const { data } = await api.post(`/economia/accesorios/${accessoryId}/transferir`, payload, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

  const acceptAccessoryTransfer = useCallback(
    async (transferId) => {
      if (!token) return null;
      const { data } = await api.post(
        `/economia/accesorios/transferencias/${transferId}/aceptar`,
        null,
        {
          headers: authHeaders,
        }
      );
      return data;
    },
    [authHeaders, token]
  );

  const rejectAccessoryTransfer = useCallback(
    async (transferId) => {
      if (!token) return null;
      const { data } = await api.post(
        `/economia/accesorios/transferencias/${transferId}/rechazar`,
        null,
        {
          headers: authHeaders,
        }
      );
      return data;
    },
    [authHeaders, token]
  );

  const transferSeeds = useCallback(
    async (payload) => {
      if (!token) return null;
      const { data } = await api.post('/economia/semillas/transferir', payload, { headers: authHeaders });
      return data;
    },
    [authHeaders, token]
  );

  const acceptSeedTransfer = useCallback(
    async (transferId) => {
      if (!token) return null;
      const { data } = await api.post(`/economia/semillas/${transferId}/aceptar`, null, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

  const rejectSeedTransfer = useCallback(
    async (transferId) => {
      if (!token) return null;
      const { data } = await api.post(`/economia/semillas/${transferId}/rechazar`, null, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

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
    searchUsers,
    addFriend,
    getFriends,
    getUserProfile,
    togglePlantLike,
    createPlantComment,
    toggleCommentLike,
    getEconomyOverview,
    purchaseAccessory,
    sellAccessory,
    transferAccessory,
    acceptAccessoryTransfer,
    rejectAccessoryTransfer,
    transferSeeds,
    acceptSeedTransfer,
    rejectSeedTransfer,
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
