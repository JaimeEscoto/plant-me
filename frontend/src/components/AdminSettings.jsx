import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEventTypes } from '../context/EventTypeContext';
import { useEventCategories } from '../context/EventCategoryContext';

const buildEmptyTypeForm = (languages) => {
  const labels = languages.reduce((acc, language) => {
    acc[language.id] = '';
    return acc;
  }, {});

  return {
    code: '',
    plantDelta: 0,
    removeDelta: 0,
    position: 0,
    labels,
  };
};

const buildEmptyCategoryForm = (languages) => {
  const labels = languages.reduce((acc, language) => {
    acc[language.id] = '';
    return acc;
  }, {});

  return {
    code: '',
    position: 0,
    labels,
  };
};

const AdminSettings = () => {
  const {
    getAdminEventTypes,
    createAdminEventType,
    updateAdminEventType,
    deleteAdminEventType,
    getAdminEventCategories,
    createAdminEventCategory,
    updateAdminEventCategory,
    deleteAdminEventCategory,
  } = useAuth();
  const { t, languages, language } = useLanguage();
  const { refreshEventTypes } = useEventTypes();
  const { refreshCategories } = useEventCategories();

  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [eventTypesError, setEventTypesError] = useState(null);
  const [eventTypeForm, setEventTypeForm] = useState(() => buildEmptyTypeForm(languages));
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [eventTypeSaving, setEventTypeSaving] = useState(false);
  const [eventTypeFeedback, setEventTypeFeedback] = useState(null);
  const [eventTypeFormError, setEventTypeFormError] = useState(null);

  const [eventCategories, setEventCategories] = useState([]);
  const [eventCategoriesLoading, setEventCategoriesLoading] = useState(true);
  const [eventCategoriesError, setEventCategoriesError] = useState(null);
  const [eventCategoryForm, setEventCategoryForm] = useState(() => buildEmptyCategoryForm(languages));
  const [selectedEventCategory, setSelectedEventCategory] = useState(null);
  const [eventCategorySaving, setEventCategorySaving] = useState(false);
  const [eventCategoryFeedback, setEventCategoryFeedback] = useState(null);
  const [eventCategoryFormError, setEventCategoryFormError] = useState(null);

  const currentLanguage = language;

  const resetEventTypeForm = () => {
    setSelectedEventType(null);
    setEventTypeForm(buildEmptyTypeForm(languages));
    setEventTypeFormError(null);
    setEventTypeFeedback(null);
  };

  const resetEventCategoryForm = () => {
    setSelectedEventCategory(null);
    setEventCategoryForm(buildEmptyCategoryForm(languages));
    setEventCategoryFormError(null);
    setEventCategoryFeedback(null);
  };

  const loadEventTypes = useCallback(async () => {
    setEventTypesLoading(true);
    setEventTypesError(null);
    try {
      const data = await getAdminEventTypes();
      setEventTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setEventTypesError(err?.response?.data?.error || t('adminEventTypeError'));
      setEventTypes([]);
    } finally {
      setEventTypesLoading(false);
    }
  }, [getAdminEventTypes, t]);

  const loadEventCategories = useCallback(async () => {
    setEventCategoriesLoading(true);
    setEventCategoriesError(null);
    try {
      const data = await getAdminEventCategories();
      setEventCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setEventCategoriesError(err?.response?.data?.error || t('adminEventCategoryError'));
      setEventCategories([]);
    } finally {
      setEventCategoriesLoading(false);
    }
  }, [getAdminEventCategories, t]);

  useEffect(() => {
    loadEventTypes();
    loadEventCategories();
  }, [loadEventCategories, loadEventTypes]);

  useEffect(() => {
    setEventTypeForm((prev) => ({
      ...buildEmptyTypeForm(languages),
      ...prev,
      labels: {
        ...buildEmptyTypeForm(languages).labels,
        ...prev.labels,
      },
    }));

    setEventCategoryForm((prev) => ({
      ...buildEmptyCategoryForm(languages),
      ...prev,
      labels: {
        ...buildEmptyCategoryForm(languages).labels,
        ...prev.labels,
      },
    }));
  }, [languages]);

  const handleEventTypeSelect = (eventType) => {
    if (!eventType) {
      resetEventTypeForm();
      return;
    }

    setSelectedEventType(eventType);
    setEventTypeForm({
      code: eventType.code || '',
      plantDelta: eventType.plantDelta ?? 0,
      removeDelta: eventType.removeDelta ?? 0,
      position: eventType.position ?? 0,
      labels: {
        ...buildEmptyTypeForm(languages).labels,
        ...(eventType.labels || {}),
      },
    });
    setEventTypeFormError(null);
    setEventTypeFeedback(null);
  };

  const handleEventTypeChange = (event) => {
    const { name, value } = event.target;
    setEventTypeForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value : Number(value),
    }));
  };

  const handleEventTypeLabelChange = (languageId, value) => {
    setEventTypeForm((prev) => ({
      ...prev,
      labels: {
        ...prev.labels,
        [languageId]: value,
      },
    }));
  };

  const validateEventTypeForm = () => {
    if (!eventTypeForm.code.trim()) {
      setEventTypeFormError(t('adminEventTypeCodeRequired'));
      return false;
    }

    const missing = languages.filter((lang) => !eventTypeForm.labels[lang.id]?.trim());
    if (missing.length > 0) {
      setEventTypeFormError(t('adminEventTypeMissingLabels'));
      return false;
    }

    setEventTypeFormError(null);
    return true;
  };

  const submitEventTypeForm = async (event) => {
    event.preventDefault();
    if (!validateEventTypeForm()) return;

    setEventTypeSaving(true);
    setEventTypeFeedback(null);
    try {
      const payload = {
        code: eventTypeForm.code.trim(),
        plantDelta: Number(eventTypeForm.plantDelta) || 0,
        removeDelta: Number(eventTypeForm.removeDelta) || 0,
        position: Number(eventTypeForm.position) || 0,
        labels: languages.reduce((acc, lang) => {
          acc[lang.id] = eventTypeForm.labels[lang.id].trim();
          return acc;
        }, {}),
      };

      let savedType;
      if (selectedEventType) {
        savedType = await updateAdminEventType(selectedEventType.id, payload);
        setEventTypeFeedback(t('adminEventTypeUpdated'));
      } else {
        savedType = await createAdminEventType(payload);
        setEventTypeFeedback(t('adminEventTypeCreated'));
      }

      await loadEventTypes();
      await refreshEventTypes();

      if (savedType) {
        handleEventTypeSelect(savedType);
      } else {
        resetEventTypeForm();
      }
    } catch (err) {
      setEventTypeFormError(err?.response?.data?.error || t('adminEventTypeError'));
    } finally {
      setEventTypeSaving(false);
    }
  };

  const handleDeleteEventType = async () => {
    if (!selectedEventType) return;
    const confirmation = window.confirm(
      t('adminEventTypeConfirmDelete', { code: selectedEventType.code })
    );
    if (!confirmation) return;

    setEventTypeSaving(true);
    setEventTypeFormError(null);
    setEventTypeFeedback(null);
    try {
      await deleteAdminEventType(selectedEventType.id);
      setEventTypeFeedback(t('adminEventTypeDeleted'));
      resetEventTypeForm();
      await loadEventTypes();
      await refreshEventTypes();
    } catch (err) {
      const message = err?.response?.data?.error;
      if (message && (message.toLowerCase().includes('uso') || message.toLowerCase().includes('use'))) {
        setEventTypeFormError(t('adminEventTypeInUse'));
      } else {
        setEventTypeFormError(message || t('adminEventTypeError'));
      }
    } finally {
      setEventTypeSaving(false);
    }
  };

  const handleEventCategorySelect = (category) => {
    if (!category) {
      resetEventCategoryForm();
      return;
    }

    setSelectedEventCategory(category);
    setEventCategoryForm({
      code: category.code || '',
      position: category.position ?? 0,
      labels: {
        ...buildEmptyCategoryForm(languages).labels,
        ...(category.labels || {}),
      },
    });
    setEventCategoryFormError(null);
    setEventCategoryFeedback(null);
  };

  const handleEventCategoryChange = (event) => {
    const { name, value } = event.target;
    setEventCategoryForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value : Number(value),
    }));
  };

  const handleEventCategoryLabelChange = (languageId, value) => {
    setEventCategoryForm((prev) => ({
      ...prev,
      labels: {
        ...prev.labels,
        [languageId]: value,
      },
    }));
  };

  const validateEventCategoryForm = () => {
    if (!eventCategoryForm.code.trim()) {
      setEventCategoryFormError(t('adminEventCategoryCodeRequired'));
      return false;
    }

    const missing = languages.filter((lang) => !eventCategoryForm.labels[lang.id]?.trim());
    if (missing.length > 0) {
      setEventCategoryFormError(t('adminEventCategoryMissingLabels'));
      return false;
    }

    setEventCategoryFormError(null);
    return true;
  };

  const submitEventCategoryForm = async (event) => {
    event.preventDefault();
    if (!validateEventCategoryForm()) return;

    setEventCategorySaving(true);
    setEventCategoryFeedback(null);
    try {
      const payload = {
        code: eventCategoryForm.code.trim(),
        position: Number(eventCategoryForm.position) || 0,
        labels: languages.reduce((acc, lang) => {
          acc[lang.id] = eventCategoryForm.labels[lang.id].trim();
          return acc;
        }, {}),
      };

      let savedCategory;
      if (selectedEventCategory) {
        savedCategory = await updateAdminEventCategory(selectedEventCategory.id, payload);
        setEventCategoryFeedback(t('adminEventCategoryUpdated'));
      } else {
        savedCategory = await createAdminEventCategory(payload);
        setEventCategoryFeedback(t('adminEventCategoryCreated'));
      }

      await loadEventCategories();
      await refreshCategories();

      if (savedCategory) {
        handleEventCategorySelect(savedCategory);
      } else {
        resetEventCategoryForm();
      }
    } catch (err) {
      setEventCategoryFormError(err?.response?.data?.error || t('adminEventCategoryError'));
    } finally {
      setEventCategorySaving(false);
    }
  };

  const handleDeleteEventCategory = async () => {
    if (!selectedEventCategory) return;
    const confirmation = window.confirm(
      t('adminEventCategoryConfirmDelete', { code: selectedEventCategory.code })
    );
    if (!confirmation) return;

    setEventCategorySaving(true);
    setEventCategoryFormError(null);
    setEventCategoryFeedback(null);
    try {
      await deleteAdminEventCategory(selectedEventCategory.id);
      setEventCategoryFeedback(t('adminEventCategoryDeleted'));
      resetEventCategoryForm();
      await loadEventCategories();
      await refreshCategories();
    } catch (err) {
      const message = err?.response?.data?.error;
      if (message && (message.toLowerCase().includes('uso') || message.toLowerCase().includes('use'))) {
        setEventCategoryFormError(t('adminEventCategoryInUse'));
      } else {
        setEventCategoryFormError(message || t('adminEventCategoryError'));
      }
    } finally {
      setEventCategorySaving(false);
    }
  };

  const displayedEventTypes = useMemo(
    () =>
      eventTypes.map((eventType) => ({
        ...eventType,
        displayLabel: eventType.labels?.[currentLanguage] || eventType.code,
      })),
    [eventTypes, currentLanguage]
  );

  const displayedEventCategories = useMemo(
    () =>
      eventCategories.map((category) => ({
        ...category,
        displayLabel: category.labels?.[currentLanguage] || category.code,
      })),
    [eventCategories, currentLanguage]
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">{t('adminSettingsTitle')}</h2>
        <p className="text-sm text-slate-600">{t('adminSettingsSubtitle')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/60">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{t('adminEventTypesTitle')}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={loadEventTypes}
                disabled={eventTypesLoading}
              >
                {t('adminEventTypeRefresh')}
              </button>
              <button
                type="button"
                className="rounded-full bg-gardenGreen px-4 py-1 text-sm font-semibold text-white hover:bg-emerald-600"
                onClick={resetEventTypeForm}
              >
                {t('adminEventTypeNew')}
              </button>
            </div>
          </div>

          {eventTypesLoading && <p className="text-sm text-slate-500">{t('adminEventTypeLoading')}</p>}
          {eventTypesError && <p className="text-sm text-rose-600">{eventTypesError}</p>}
          {!eventTypesLoading && !eventTypesError && (
            <p className="mb-3 text-sm text-slate-600">{t('adminEventTypesDescription')}</p>
          )}

          {!eventTypesLoading && !eventTypesError && displayedEventTypes.length === 0 && (
            <p className="text-sm text-slate-500">{t('adminEventTypeNoData')}</p>
          )}

          {!eventTypesLoading && !eventTypesError && displayedEventTypes.length > 0 && (
            <ul className="space-y-3">
              {displayedEventTypes.map((eventType) => {
                const isActive = selectedEventType?.id === eventType.id;
                return (
                  <li key={eventType.id}>
                    <button
                      type="button"
                      onClick={() => handleEventTypeSelect(eventType)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-gardenGreen bg-emerald-50/70 text-emerald-800 shadow'
                          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                          {eventType.code}
                        </span>
                        <span className="text-xs text-slate-500">
                          {t('adminEventTypePosition')}: {eventType.position ?? 0}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{eventType.displayLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t('adminEventTypePlantDelta')}: {eventType.plantDelta} · {t('adminEventTypeRemoveDelta')}: {eventType.removeDelta}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/60">
          <form className="space-y-4" onSubmit={submitEventTypeForm}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedEventType ? t('adminEventTypeUpdate') : t('adminEventTypeCreate')}
              </h3>
              {selectedEventType && (
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-3 py-1 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={handleDeleteEventType}
                  disabled={eventTypeSaving}
                >
                  {t('adminEventTypeDelete')}
                </button>
              )}
            </div>

            {eventTypeFeedback && <p className="text-sm text-emerald-600">{eventTypeFeedback}</p>}
            {eventTypeFormError && <p className="text-sm text-rose-600">{eventTypeFormError}</p>}

            <div>
              <label className="block text-sm font-semibold text-slate-600" htmlFor="eventTypeCode">
                {t('adminEventTypeCode')}
              </label>
              <input
                id="eventTypeCode"
                name="code"
                value={eventTypeForm.code}
                onChange={handleEventTypeChange}
                className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">{t('adminEventTypeCodeHelper')}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-slate-600" htmlFor="plantDelta">
                  {t('adminEventTypePlantDelta')}
                </label>
                <input
                  id="plantDelta"
                  name="plantDelta"
                  type="number"
                  value={eventTypeForm.plantDelta}
                  onChange={handleEventTypeChange}
                  className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600" htmlFor="removeDelta">
                  {t('adminEventTypeRemoveDelta')}
                </label>
                <input
                  id="removeDelta"
                  name="removeDelta"
                  type="number"
                  value={eventTypeForm.removeDelta}
                  onChange={handleEventTypeChange}
                  className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600" htmlFor="eventTypePosition">
                  {t('adminEventTypePosition')}
                </label>
                <input
                  id="eventTypePosition"
                  name="position"
                  type="number"
                  value={eventTypeForm.position}
                  onChange={handleEventTypeChange}
                  className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-600">{t('adminEventTypeLabels')}</h4>
              <p className="text-xs text-slate-500">{t('adminEventTypeLabelHelper')}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <label className="block text-xs font-semibold text-slate-500" htmlFor={`event-type-label-${lang.id}`}>
                      {lang.label}
                    </label>
                    <input
                      id={`event-type-label-${lang.id}`}
                      value={eventTypeForm.labels[lang.id] || ''}
                      onChange={(event) => handleEventTypeLabelChange(lang.id, event.target.value)}
                      className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {selectedEventType && (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={resetEventTypeForm}
                  disabled={eventTypeSaving}
                >
                  {t('adminEventTypeCancel')}
                </button>
              )}
              <button
                type="submit"
                className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                disabled={eventTypeSaving}
              >
                {eventTypeSaving
                  ? t('gardenFormSaving')
                  : selectedEventType
                  ? t('adminEventTypeSave')
                  : t('adminEventTypeCreate')}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/60">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{t('adminEventCategoriesTitle')}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={loadEventCategories}
                disabled={eventCategoriesLoading}
              >
                {t('adminEventCategoryRefresh')}
              </button>
              <button
                type="button"
                className="rounded-full bg-gardenGreen px-4 py-1 text-sm font-semibold text-white hover:bg-emerald-600"
                onClick={resetEventCategoryForm}
              >
                {t('adminEventCategoryNew')}
              </button>
            </div>
          </div>

          {eventCategoriesLoading && (
            <p className="text-sm text-slate-500">{t('adminEventCategoryLoading')}</p>
          )}
          {eventCategoriesError && <p className="text-sm text-rose-600">{eventCategoriesError}</p>}
          {!eventCategoriesLoading && !eventCategoriesError && (
            <p className="mb-3 text-sm text-slate-600">{t('adminEventCategoriesDescription')}</p>
          )}

          {!eventCategoriesLoading && !eventCategoriesError && displayedEventCategories.length === 0 && (
            <p className="text-sm text-slate-500">{t('adminEventCategoryNoData')}</p>
          )}

          {!eventCategoriesLoading && !eventCategoriesError && displayedEventCategories.length > 0 && (
            <ul className="space-y-3">
              {displayedEventCategories.map((category) => {
                const isActive = selectedEventCategory?.id === category.id;
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => handleEventCategorySelect(category)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-gardenGreen bg-emerald-50/70 text-emerald-800 shadow'
                          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                          {category.code}
                        </span>
                        <span className="text-xs text-slate-500">
                          {t('adminEventCategoryPosition')}: {category.position ?? 0}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{category.displayLabel}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/60">
          <form className="space-y-4" onSubmit={submitEventCategoryForm}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedEventCategory ? t('adminEventCategoryUpdate') : t('adminEventCategoryCreate')}
              </h3>
              {selectedEventCategory && (
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-3 py-1 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={handleDeleteEventCategory}
                  disabled={eventCategorySaving}
                >
                  {t('adminEventCategoryDelete')}
                </button>
              )}
            </div>

            {eventCategoryFeedback && <p className="text-sm text-emerald-600">{eventCategoryFeedback}</p>}
            {eventCategoryFormError && <p className="text-sm text-rose-600">{eventCategoryFormError}</p>}

            <div>
              <label className="block text-sm font-semibold text-slate-600" htmlFor="eventCategoryCode">
                {t('adminEventCategoryCode')}
              </label>
              <input
                id="eventCategoryCode"
                name="code"
                value={eventCategoryForm.code}
                onChange={handleEventCategoryChange}
                className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">{t('adminEventCategoryCodeHelper')}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600" htmlFor="eventCategoryPosition">
                {t('adminEventCategoryPosition')}
              </label>
              <input
                id="eventCategoryPosition"
                name="position"
                type="number"
                value={eventCategoryForm.position}
                onChange={handleEventCategoryChange}
                className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-600">{t('adminEventCategoryLabels')}</h4>
              <p className="text-xs text-slate-500">{t('adminEventCategoryLabelHelper')}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <label className="block text-xs font-semibold text-slate-500" htmlFor={`event-category-label-${lang.id}`}>
                      {lang.label}
                    </label>
                    <input
                      id={`event-category-label-${lang.id}`}
                      value={eventCategoryForm.labels[lang.id] || ''}
                      onChange={(event) => handleEventCategoryLabelChange(lang.id, event.target.value)}
                      className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {selectedEventCategory && (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={resetEventCategoryForm}
                  disabled={eventCategorySaving}
                >
                  {t('adminEventTypeCancel')}
                </button>
              )}
              <button
                type="submit"
                className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                disabled={eventCategorySaving}
              >
                {eventCategorySaving
                  ? t('gardenFormSaving')
                  : selectedEventCategory
                  ? t('adminEventCategorySave')
                  : t('adminEventCategoryCreate')}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
