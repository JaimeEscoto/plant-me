import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';

const ROLE_ALIASES = {
  admin: 'admin',
  administrador: 'admin',
  administradora: 'admin',
  administrator: 'admin',
  superadmin: 'admin',
  usuario: 'usuario',
  user: 'usuario',
  participante: 'usuario',
};

const normalizeRole = (role) => {
  if (typeof role === 'string') {
    const normalized = role.trim().toLowerCase();
    if (normalized) {
      return ROLE_ALIASES[normalized] || normalized;
    }
  }

  return role;
};

const normalizeUser = (rawUser) => {
  if (!rawUser) {
    return null;
  }

  return {
    ...rawUser,
    rol: normalizeRole(rawUser.rol) || rawUser.rol,
  };
};

const AuthContext = createContext();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
});

export const AuthProvider = ({ children }) => {
  const { t } = useLanguage();
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    return normalizeUser(parsedUser);
  });
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setSession = (sessionToken, sessionUser) => {
    setToken(sessionToken);
    const normalizedUser = normalizeUser(sessionUser);
    setUser(normalizedUser);
    if (sessionToken) {
      localStorage.setItem('token', sessionToken);
    } else {
      localStorage.removeItem('token');
    }
    if (normalizedUser) {
      localStorage.setItem('user', JSON.stringify(normalizedUser));
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

  const getSeedTransferHistory = useCallback(async () => {
    if (!token) return { transferencias: [] };
    const { data } = await api.get('/economia/semillas/historial', { headers: authHeaders });
    return data;
  }, [authHeaders, token]);

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

  const getAdminDashboard = useCallback(async () => {
    if (!token) return null;
    const { data } = await api.get('/admin/dashboard', { headers: authHeaders });
    return data;
  }, [authHeaders, token]);

  const getAdminUsers = useCallback(async () => {
    if (!token) return [];
    const { data } = await api.get('/admin/usuarios', { headers: authHeaders });
    return data?.usuarios || [];
  }, [authHeaders, token]);

  const grantSeeds = useCallback(
    async (userId, payload) => {
      if (!token) return null;
      const { data } = await api.post(`/admin/usuarios/${userId}/semillas`, payload, {
        headers: authHeaders,
      });
      return data;
    },
    [authHeaders, token]
  );

  const getAdminEventTypes = useCallback(async () => {
    if (!token) return [];
    const { data } = await api.get('/admin/config/event-types', { headers: authHeaders });
    return data?.eventTypes || [];
  }, [authHeaders, token]);

  const createAdminEventType = useCallback(
    async (payload) => {
      if (!token) return null;
      const { data } = await api.post('/admin/config/event-types', payload, { headers: authHeaders });
      return data?.eventType || null;
    },
    [authHeaders, token]
  );

  const updateAdminEventType = useCallback(
    async (eventTypeId, payload) => {
      if (!token) return null;
      const { data } = await api.put(`/admin/config/event-types/${eventTypeId}`, payload, {
        headers: authHeaders,
      });
      return data?.eventType || null;
    },
    [authHeaders, token]
  );

  const deleteAdminEventType = useCallback(
    async (eventTypeId) => {
      if (!token) return null;
      await api.delete(`/admin/config/event-types/${eventTypeId}`, { headers: authHeaders });
      return true;
    },
    [authHeaders, token]
  );

  const getAdminEventCategories = useCallback(async () => {
    if (!token) return [];
    const { data } = await api.get('/admin/config/event-categories', { headers: authHeaders });
    return data?.eventCategories || [];
  }, [authHeaders, token]);

  const createAdminEventCategory = useCallback(
    async (payload) => {
      if (!token) return null;
      const { data } = await api.post('/admin/config/event-categories', payload, { headers: authHeaders });
      return data?.eventCategory || null;
    },
    [authHeaders, token]
  );

  const updateAdminEventCategory = useCallback(
    async (eventCategoryId, payload) => {
      if (!token) return null;
      const { data } = await api.put(`/admin/config/event-categories/${eventCategoryId}`, payload, {
        headers: authHeaders,
      });
      return data?.eventCategory || null;
    },
    [authHeaders, token]
  );

  const deleteAdminEventCategory = useCallback(
    async (eventCategoryId) => {
      if (!token) return null;
      await api.delete(`/admin/config/event-categories/${eventCategoryId}`, { headers: authHeaders });
      return true;
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
    getSeedTransferHistory,
    acceptSeedTransfer,
    rejectSeedTransfer,
    getAdminDashboard,
    getAdminUsers,
    grantSeeds,
    getAdminEventTypes,
    createAdminEventType,
    updateAdminEventType,
    deleteAdminEventType,
    getAdminEventCategories,
    createAdminEventCategory,
    updateAdminEventCategory,
    deleteAdminEventCategory,
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
