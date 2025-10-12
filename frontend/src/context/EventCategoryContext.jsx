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

const EventCategoryContext = createContext();

export const EventCategoryProvider = ({ children }) => {
  const { token, api, authHeaders } = useAuth();
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(
    async (requestedLanguage = language) => {
      if (!token) {
        setCategories([]);
        setError(null);
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/jardin/categorias-evento', {
          headers: authHeaders,
          params: { lang: requestedLanguage },
        });
        const list = Array.isArray(data) ? data : [];
        setCategories(list);
        setError(null);
        return list;
      } catch (err) {
        const message = err?.response?.data?.error || t('gardenEventCategoriesLoadError');
        setError(message);
        setCategories([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api, authHeaders, language, t, token]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, language, token]);

  const getLabelForCategory = useCallback(
    (code) => categories.find((category) => category.code === code)?.label || code,
    [categories]
  );

  const getCategoryByCode = useCallback(
    (code) => categories.find((category) => category.code === code) || null,
    [categories]
  );

  const value = useMemo(
    () => ({
      categories,
      loading,
      error,
      refreshCategories: fetchCategories,
      getLabelForCategory,
      getCategoryByCode,
    }),
    [categories, loading, error, fetchCategories, getLabelForCategory, getCategoryByCode]
  );

  return <EventCategoryContext.Provider value={value}>{children}</EventCategoryContext.Provider>;
};

export const useEventCategories = () => {
  const context = useContext(EventCategoryContext);
  if (!context) {
    throw new Error('useEventCategories debe usarse dentro de EventCategoryProvider');
  }
  return context;
};
