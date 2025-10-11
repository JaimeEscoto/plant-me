import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

const EventTypeContext = createContext();

export const EventTypeProvider = ({ children }) => {
  const { token, api, authHeaders } = useAuth();
  const { language, t } = useLanguage();
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEventTypes = useCallback(
    async (requestedLanguage = language) => {
      if (!token) {
        setEventTypes([]);
        setError(null);
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/jardin/tipos-evento', {
          headers: authHeaders,
          params: { lang: requestedLanguage },
        });
        const types = Array.isArray(data) ? data : [];
        setEventTypes(types);
        setError(null);
        return types;
      } catch (err) {
        const message = err?.response?.data?.error || t('gardenEventTypesLoadError');
        setError(message);
        setEventTypes([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api, authHeaders, language, t, token]
  );

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes, language, token]);

  const getLabelForType = useCallback(
    (code) => eventTypes.find((eventType) => eventType.code === code)?.label || code,
    [eventTypes]
  );

  const getEventTypeByCode = useCallback(
    (code) => eventTypes.find((eventType) => eventType.code === code) || null,
    [eventTypes]
  );

  const value = useMemo(
    () => ({
      eventTypes,
      loading,
      error,
      refreshEventTypes: fetchEventTypes,
      getLabelForType,
      getEventTypeByCode,
    }),
    [eventTypes, loading, error, fetchEventTypes, getLabelForType, getEventTypeByCode]
  );

  return <EventTypeContext.Provider value={value}>{children}</EventTypeContext.Provider>;
};

export const useEventTypes = () => {
  const context = useContext(EventTypeContext);
  if (!context) {
    throw new Error('useEventTypes debe usarse dentro de EventTypeProvider');
  }
  return context;
};
