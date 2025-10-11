import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEventTypes } from '../context/EventTypeContext';

const buildEmptyForm = (languages) => {
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

const AdminSettings = () => {
  const {
    getAdminEventTypes,
    createAdminEventType,
    updateAdminEventType,
    deleteAdminEventType,
  } = useAuth();
  const { t, languages, language } = useLanguage();
  const { refreshEventTypes } = useEventTypes();

  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => buildEmptyForm(languages));
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState(null);

  const currentLanguage = language;

  const resetForm = () => {
    setSelectedType(null);
    setForm(buildEmptyForm(languages));
    setFormError(null);
  };

  const loadEventTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminEventTypes();
      setEventTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || t('adminEventTypeError'));
      setEventTypes([]);
    } finally {
      setLoading(false);
    }
  }, [getAdminEventTypes, t]);

  useEffect(() => {
    loadEventTypes();
  }, [loadEventTypes]);

  useEffect(() => {
    setForm((prev) => ({
      ...buildEmptyForm(languages),
      ...prev,
      labels: {
        ...buildEmptyForm(languages).labels,
        ...prev.labels,
      },
    }));
  }, [languages]);

  const handleSelect = (eventType) => {
    if (!eventType) {
      resetForm();
      return;
    }

    setSelectedType(eventType);
    setForm({
      code: eventType.code || '',
      plantDelta: eventType.plantDelta ?? 0,
      removeDelta: eventType.removeDelta ?? 0,
      position: eventType.position ?? 0,
      labels: {
        ...buildEmptyForm(languages).labels,
        ...(eventType.labels || {}),
      },
    });
    setFormError(null);
    setFeedback(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value : Number(value),
    }));
  };

  const handleLabelChange = (languageId, value) => {
    setForm((prev) => ({
      ...prev,
      labels: {
        ...prev.labels,
        [languageId]: value,
      },
    }));
  };

  const validateForm = () => {
    if (!form.code.trim()) {
      setFormError(t('adminEventTypeCodeRequired'));
      return false;
    }

    const missing = languages.filter((lang) => !form.labels[lang.id]?.trim());
    if (missing.length > 0) {
      setFormError(t('adminEventTypeMissingLabels'));
      return false;
    }

    setFormError(null);
    return true;
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        code: form.code.trim(),
        plantDelta: Number(form.plantDelta) || 0,
        removeDelta: Number(form.removeDelta) || 0,
        position: Number(form.position) || 0,
        labels: languages.reduce((acc, lang) => {
          acc[lang.id] = form.labels[lang.id].trim();
          return acc;
        }, {}),
      };

      let savedType;
      if (selectedType) {
        savedType = await updateAdminEventType(selectedType.id, payload);
        setFeedback(t('adminEventTypeUpdated'));
      } else {
        savedType = await createAdminEventType(payload);
        setFeedback(t('adminEventTypeCreated'));
      }

      await loadEventTypes();
      await refreshEventTypes();

      if (savedType) {
        handleSelect(savedType);
      } else {
        resetForm();
      }
    } catch (err) {
      setFormError(err?.response?.data?.error || t('adminEventTypeError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;
    const confirmation = window.confirm(
      t('adminEventTypeConfirmDelete', { code: selectedType.code })
    );
    if (!confirmation) return;

    setSaving(true);
    setFormError(null);
    setFeedback(null);
    try {
      await deleteAdminEventType(selectedType.id);
      setFeedback(t('adminEventTypeDeleted'));
      resetForm();
      await loadEventTypes();
      await refreshEventTypes();
    } catch (err) {
      const message = err?.response?.data?.error;
      if (message && (message.toLowerCase().includes('uso') || message.toLowerCase().includes('use'))) {
        setFormError(t('adminEventTypeInUse'));
      } else {
        setFormError(message || t('adminEventTypeError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const displayedTypes = useMemo(
    () =>
      eventTypes.map((eventType) => ({
        ...eventType,
        displayLabel: eventType.labels?.[currentLanguage] || eventType.code,
      })),
    [eventTypes, currentLanguage]
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
                disabled={loading}
              >
                {t('adminEventTypeRefresh')}
              </button>
              <button
                type="button"
                className="rounded-full bg-gardenGreen px-4 py-1 text-sm font-semibold text-white hover:bg-emerald-600"
                onClick={resetForm}
              >
                {t('adminEventTypeNew')}
              </button>
            </div>
          </div>

          {loading && <p className="text-sm text-slate-500">{t('adminEventTypeLoading')}</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {!loading && !error && (
            <p className="mb-3 text-sm text-slate-600">{t('adminEventTypesDescription')}</p>
          )}

          {!loading && !error && displayedTypes.length === 0 && (
            <p className="text-sm text-slate-500">{t('adminEventTypeNoData')}</p>
          )}

          {!loading && !error && displayedTypes.length > 0 && (
            <ul className="space-y-3">
              {displayedTypes.map((eventType) => {
                const isActive = selectedType?.id === eventType.id;
                return (
                  <li key={eventType.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(eventType)}
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
                        {t('adminEventTypePlantDelta')}: {eventType.plantDelta} · {t('adminEventTypeRemoveDelta')}:{' '}
                        {eventType.removeDelta}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/60">
          <form className="space-y-4" onSubmit={submitForm}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedType ? t('adminEventTypeUpdate') : t('adminEventTypeCreate')}
              </h3>
              {selectedType && (
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-3 py-1 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {t('adminEventTypeDelete')}
                </button>
              )}
            </div>

            {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}
            {formError && <p className="text-sm text-rose-600">{formError}</p>}

            <div>
              <label className="block text-sm font-semibold text-slate-600" htmlFor="code">
                {t('adminEventTypeCode')}
              </label>
              <input
                id="code"
                name="code"
                value={form.code}
                onChange={handleChange}
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
                  value={form.plantDelta}
                  onChange={handleChange}
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
                  value={form.removeDelta}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600" htmlFor="position">
                  {t('adminEventTypePosition')}
                </label>
                <input
                  id="position"
                  name="position"
                  type="number"
                  value={form.position}
                  onChange={handleChange}
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
                    <label className="block text-xs font-semibold text-slate-500" htmlFor={`label-${lang.id}`}>
                      {lang.label}
                    </label>
                    <input
                      id={`label-${lang.id}`}
                      value={form.labels[lang.id] || ''}
                      onChange={(event) => handleLabelChange(lang.id, event.target.value)}
                      className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {selectedType && (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={resetForm}
                  disabled={saving}
                >
                  {t('adminEventTypeCancel')}
                </button>
              )}
              <button
                type="submit"
                className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? t('gardenFormSaving') : selectedType ? t('adminEventTypeSave') : t('adminEventTypeCreate')}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
