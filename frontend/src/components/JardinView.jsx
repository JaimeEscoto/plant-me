import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEventTypes } from '../context/EventTypeContext';
import { useEventCategories } from '../context/EventCategoryContext';
import PlantHealthIllustration from './PlantHealthIllustration';

const moodStyles = [
  { limit: 33, bg: 'from-red-100 via-orange-100 to-yellow-100', messageKey: 'gardenMoodNeedsCare' },
  { limit: 66, bg: 'from-emerald-100 via-lime-100 to-teal-100', messageKey: 'gardenMoodBalanced' },
  { limit: 100, bg: 'from-emerald-200 via-teal-200 to-sky-200', messageKey: 'gardenMoodFlourishing' },
];

const getMood = (health) => moodStyles.find((mood) => health <= mood.limit) || moodStyles[2];

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

const buildEmptyForm = (defaultCategory = '', defaultType = '') => ({
  nombre: '',
  categoria: defaultCategory,
  tipo: defaultType,
  descripcion: '',
  foto: '',
});

const JardinView = () => {
  const {
    garden,
    fetchGarden,
    api,
    authHeaders,
    setGarden,
    getEconomyOverview,
    acceptAccessoryTransfer,
    rejectAccessoryTransfer,
    user,
  } = useAuth();
  const { t, language, locale } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(() => buildEmptyForm('', ''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [incomingAccessoryTransfers, setIncomingAccessoryTransfers] = useState([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [transferFeedback, setTransferFeedback] = useState(null);
  const [transferAction, setTransferAction] = useState(null);
  const gardenRef = useRef(null);
  const photoInputRef = useRef(null);
  const sizeLimitLabel = useMemo(() => {
    const value = MAX_PHOTO_SIZE / (1024 * 1024);
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }, []);

  const resetPhotoInput = useCallback(() => {
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  }, [photoInputRef]);

  const handleRemovePhoto = useCallback(() => {
    setError(null);
    setForm((prev) => ({ ...prev, foto: '' }));
    resetPhotoInput();
  }, [resetPhotoInput, setError, setForm]);

  const handlePhotoChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setError(null);

      if (!file.type.startsWith('image/')) {
        setError(t('gardenFormPhotoInvalidType'));
        resetPhotoInput();
        return;
      }

      if (file.size > MAX_PHOTO_SIZE) {
        setError(t('gardenFormPhotoSizeError', { limit: sizeLimitLabel }));
        resetPhotoInput();
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setForm((prev) => ({ ...prev, foto: reader.result }));
          resetPhotoInput();
        } else {
          setError(t('gardenFormPhotoInvalidType'));
          resetPhotoInput();
        }
      };
      reader.onerror = () => {
        setError(t('gardenFormPhotoInvalidType'));
        resetPhotoInput();
      };
      reader.readAsDataURL(file);
    },
    [resetPhotoInput, setError, setForm, sizeLimitLabel, t]
  );

  const { eventTypes, loading: eventTypesLoading, error: eventTypesError, getLabelForType, getEventTypeByCode } =
    useEventTypes();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refreshCategories,
    getLabelForCategory,
  } = useEventCategories();

  const defaultEventType = useMemo(() => eventTypes[0]?.code || '', [eventTypes]);

  const defaultCategory = useMemo(() => categories[0]?.code || '', [categories]);

  useEffect(() => {
    setForm((prev) => {
      const hasCurrentCategory = categories.some((category) => category.code === prev.categoria);
      return {
        ...prev,
        categoria: hasCurrentCategory ? prev.categoria : defaultCategory,
      };
    });
  }, [categories, defaultCategory]);

  useEffect(() => {
    setForm((prev) => {
      const hasCurrentType = eventTypes.some((eventType) => eventType.code === prev.tipo);
      return {
        ...prev,
        tipo: hasCurrentType ? prev.tipo : defaultEventType,
      };
    });
  }, [defaultEventType, eventTypes]);

  const health = garden?.estado_salud ?? 50;
  const accessoryList = Array.isArray(garden?.accesorios) ? garden.accesorios : [];
  const mood = useMemo(() => getMood(health), [health]);
  const ownedAccessories = useMemo(
    () => accessoryList.filter((item) => Number(item?.cantidad) > 0),
    [accessoryList]
  );

  const formatDateTime = useCallback(
    (value) =>
      value
        ? new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
        : '',
    [locale]
  );

  const loadAccessoryTransfers = useCallback(async () => {
    if (!getEconomyOverview) return;
    setTransferLoading(true);
    setTransferError(null);
    try {
      const data = await getEconomyOverview();
      const transfers = Array.isArray(data?.transferencias?.accesorios)
        ? data.transferencias.accesorios
        : [];
      const incoming = transfers.filter((transfer) => transfer.destinatario_id === user?.id);
      setIncomingAccessoryTransfers(incoming);
    } catch (err) {
      setTransferError(t('economyOverviewError'));
      setIncomingAccessoryTransfers([]);
    } finally {
      setTransferLoading(false);
    }
  }, [getEconomyOverview, t, user?.id]);

  useEffect(() => {
    if (!garden) {
      fetchGarden();
    }
  }, [garden, fetchGarden]);

  useEffect(() => {
    loadAccessoryTransfers();
  }, [loadAccessoryTransfers]);

  useEffect(() => {
    if (gardenRef.current) {
      const shade = Math.min(9, Math.floor(health / 10));
      gsap.to(gardenRef.current, {
        background: `linear-gradient(135deg, rgba(34,197,94,0.${shade}), rgba(56,189,248,0.${shade}))`,
        duration: 1,
      });
    }
  }, [health]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!form.tipo) {
      setError(t('gardenNoEventTypesConfigured'));
      return;
    }

    if (!form.categoria) {
      setError(t('gardenNoEventCategoriesConfigured'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.foto) {
        delete payload.foto;
      }

      const { data } = await api.post('/jardin/planta', payload, { headers: authHeaders });
      setGarden((prev) => ({
        ...(prev || {}),
        ...data.jardin,
        plantas: [data.plant, ...((prev && prev.plantas) || [])],
      }));
      setForm(buildEmptyForm(defaultCategory, defaultEventType));
      resetPhotoInput();
      setFormOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || t('formErrorRegisterPlant'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (plant) => {
    setEditingPlant(plant);
    setEditDescription(plant.descripcion || '');
    setError(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingPlant) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.put(
        `/jardin/planta/${editingPlant.id}`,
        { descripcion: editDescription },
        { headers: authHeaders }
      );
      setGarden((prev) => ({
        ...(prev || {}),
        plantas: (prev?.plantas || []).map((plant) =>
          plant.id === editingPlant.id ? { ...plant, descripcion: data.plant.descripcion } : plant
        ),
      }));
      setEditingPlant(null);
    } catch (err) {
      setError(t('formErrorUpdatePlant'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plantId) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.delete(`/jardin/planta/${plantId}`, { headers: authHeaders });
      setGarden((prev) => ({
        ...(prev || {}),
        plantas: (prev?.plantas || []).filter((plant) => plant.id !== plantId),
      }));
    } catch (err) {
      setError(t('formErrorDeletePlant'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAccessoryTransfer = async (transferId) => {
    setTransferAction(`accept-${transferId}`);
    setTransferError(null);
    setTransferFeedback(null);
    try {
      const data = await acceptAccessoryTransfer(transferId);
      if (Array.isArray(data?.accesorios)) {
        setGarden((prev) => {
          if (!prev) return prev;
          return { ...prev, accesorios: data.accesorios };
        });
      }
      setTransferFeedback(t('economyAcceptTransferSuccess'));
    } catch (err) {
      setTransferError(err.response?.data?.error || t('economyTransferUpdateError'));
    } finally {
      setTransferAction(null);
      await loadAccessoryTransfers();
    }
  };

  const handleRejectAccessoryTransfer = async (transferId) => {
    setTransferAction(`reject-${transferId}`);
    setTransferError(null);
    setTransferFeedback(null);
    try {
      await rejectAccessoryTransfer(transferId);
      setTransferFeedback(t('economyRejectTransferSuccess'));
    } catch (err) {
      setTransferError(err.response?.data?.error || t('economyTransferUpdateError'));
    } finally {
      setTransferAction(null);
      await loadAccessoryTransfers();
    }
  };


  if (!garden) {
    return <p className="text-center text-lg text-slate-500">{t('gardenLoading')}</p>;
  }

  return (
    <div className="space-y-6">
      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${mood.bg} p-8 shadow-lg`}>
        <div ref={gardenRef} className="absolute inset-0 opacity-30" aria-hidden />
        <div className="relative z-10 flex flex-col-reverse items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full text-center lg:w-auto lg:text-left">
            <h2 className="text-2xl font-bold text-gardenGreen">{t('gardenHealth', { health })}</h2>
            <p className="mt-2 text-lg text-slate-700">{t(mood.messageKey)}</p>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{t('gardenMoodDescription')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <button
                onClick={() => {
                  setForm(buildEmptyForm(defaultCategory, defaultEventType));
                  setError(null);
                  resetPhotoInput();
                  setFormOpen(true);
                }}
                className="rounded-full bg-gardenGreen px-6 py-2 font-semibold text-white shadow hover:bg-emerald-600"
              >
                {t('gardenRecordEvent')}
              </button>
            </div>
          </div>
          <PlantHealthIllustration
            health={health}
            dimension={220}
            className="w-full max-w-xs"
            accessories={accessoryList}
          />
        </div>
        <div className="relative z-0 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {garden.plantas?.map((plant) => {
            const typeLabel = getLabelForType(plant.tipo);
            const typeInfo = getEventTypeByCode(plant.tipo);
            const badgeClass = typeInfo
              ? typeInfo.plantDelta > 0
                ? 'bg-emerald-500'
                : typeInfo.plantDelta < 0
                ? 'bg-rose-500'
                : 'bg-slate-500'
              : 'bg-slate-500';
            return (
              <article key={plant.id} className="rounded-2xl bg-white/80 p-4 shadow">
                <h3 className="text-lg font-semibold text-gardenSoil">{plant.nombre}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gardenGreen">
                  {getLabelForCategory(plant.categoria) || t('gardenNoCategory')}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${badgeClass}`}
                >
                  {typeLabel}
                </span>
                <p className="mt-2 text-sm text-slate-700">{plant.descripcion || t('gardenNoDescription')}</p>
                {plant.foto && (
                  <img
                    src={plant.foto}
                    alt={t('gardenEventPhotoAlt', { name: plant.nombre })}
                    className="mt-3 h-40 w-full rounded-2xl object-cover"
                    loading="lazy"
                  />
                )}
                <time className="mt-3 block text-xs text-slate-500">
                  {new Date(plant.fecha_plantado).toLocaleString(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    onClick={() => startEditing(plant)}
                  >
                    {t('gardenEditButton')}
                  </button>
                  <button
                    className="rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-200"
                    onClick={() => handleDelete(plant.id)}
                    disabled={submitting}
                  >
                    {t('gardenDeleteButton')}
                  </button>
                </div>
              </article>
            );
          })}
          {garden.plantas?.length === 0 && (
            <p className="text-sm text-slate-600">{t('gardenNoEvents')}</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white/90 p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-semibold text-gardenGreen">
            {t('economyAccessoryTransfersTitle')}
          </h3>
          {transferLoading && (
            <span className="text-xs font-semibold text-slate-500">{t('economyLoading')}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-600">{t('economyAccessoryTransfersDescription')}</p>
        {transferError && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{transferError}</p>
        )}
        {transferFeedback && !transferError && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
            {transferFeedback}
          </p>
        )}
        <ul className="mt-4 space-y-3">
          {incomingAccessoryTransfers.map((transfer) => {
            const accessoryInfo = accessoryList.find((item) => item.id === transfer.accesorio_id);
            return (
              <li key={transfer.id} className="rounded-2xl bg-sky-50 p-3 shadow-sm">
                <p className="text-sm font-semibold text-sky-700">
                  {t('economyAccessoryTransferFromLabel', {
                    name: transfer.remitente?.nombre_usuario || t('communityUnknownUser'),
                    item: accessoryInfo?.nombre || transfer.accesorio_id,
                    amount: transfer.cantidad,
                  })}
                </p>
                <p className="mt-1 text-xs text-sky-700">{formatDateTime(transfer.fecha_creacion)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptAccessoryTransfer(transfer.id)}
                    disabled={transferAction === `accept-${transfer.id}`}
                    className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-sky-600 disabled:bg-sky-200"
                  >
                    {transferAction === `accept-${transfer.id}`
                      ? t('economyProcessing')
                      : t('economyAcceptButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectAccessoryTransfer(transfer.id)}
                    disabled={transferAction === `reject-${transfer.id}`}
                    className="rounded-full bg-rose-400 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-rose-500 disabled:bg-rose-200"
                  >
                    {transferAction === `reject-${transfer.id}`
                      ? t('economyProcessing')
                      : t('economyRejectButton')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {incomingAccessoryTransfers.length === 0 && !transferLoading && (
          <p className="mt-4 text-sm text-slate-600">{t('economyNoPendingAccessories')}</p>
        )}
      </section>

      <section className="rounded-3xl bg-white/90 p-6 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gardenGreen">
              {t('gardenAccessoriesTitle')}
            </h3>
            <p className="text-sm text-slate-600">{t('gardenAccessoriesDescription')}</p>
          </div>
        </div>
        {ownedAccessories.length > 0 ? (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ownedAccessories.map((accessory) => (
              <li
                key={accessory.id}
                className="flex h-full flex-col justify-between gap-3 rounded-2xl bg-slate-50/80 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    {accessory.icono}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gardenSoil">
                      {accessory.nombre}
                    </h4>
                    {accessory.descripcion && (
                      <p className="mt-1 text-sm text-slate-600">{accessory.descripcion}</p>
                    )}
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gardenGreen/10 px-3 py-1 text-xs font-semibold text-gardenGreen">
                  <span aria-hidden>🔸</span>
                  {t('gardenAccessoryQuantity', { count: accessory.cantidad })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-600">{t('gardenAccessoriesEmpty')}</p>
        )}
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gardenGreen">{t('gardenFormTitle')}</h3>
            <p className="mt-2 text-sm text-slate-600">{t('gardenFormDescription')}</p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="nombre">
                  {t('gardenFormName')}
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  required
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="block text-sm font-semibold text-slate-600" htmlFor="categoria">
                    {t('gardenFormCategory')}
                  </label>
                  <button
                    type="button"
                    onClick={() => refreshCategories(language)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    disabled={categoriesLoading}
                  >
                    {t('gardenFormRefreshCategories')}
                  </button>
                </div>
                <select
                  id="categoria"
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  disabled={categoriesLoading || categories.length === 0}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.code} value={category.code}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{t('gardenFormCategoryHelper')}</p>
                {categoriesLoading && (
                  <p className="mt-1 text-sm text-slate-500">{t('gardenEventCategoriesLoading')}</p>
                )}
                {categoriesError && (
                  <p className="mt-1 text-sm text-red-600">{categoriesError}</p>
                )}
                {!categoriesLoading && categories.length === 0 && !categoriesError && (
                  <p className="mt-1 text-sm text-amber-600">{t('gardenNoEventCategoriesConfigured')}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="tipo">
                  {t('gardenFormType')}
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  disabled={eventTypesLoading || eventTypes.length === 0}
                >
                  {eventTypes.map((eventType) => (
                    <option key={eventType.code} value={eventType.code}>
                      {eventType.label}
                    </option>
                  ))}
                </select>
                {eventTypesError && (
                  <p className="mt-1 text-sm text-red-600">{eventTypesError}</p>
                )}
                {!eventTypesLoading && eventTypes.length === 0 && !eventTypesError && (
                  <p className="mt-1 text-sm text-amber-600">{t('gardenNoEventTypesConfigured')}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="descripcion">
                  {t('gardenFormDescriptionLabel')}
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  placeholder={t('gardenFormDescriptionPlaceholder')}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="foto">
                  {t('gardenFormPhotoLabel')}
                </label>
                <input
                  id="foto"
                  name="foto"
                  type="file"
                  accept="image/*"
                  ref={photoInputRef}
                  onChange={handlePhotoChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-gardenGreen focus:outline-none file:mr-4 file:rounded-full file:border-0 file:bg-gardenGreen/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-gardenGreen hover:file:bg-gardenGreen/20"
                />
                <p className="mt-1 text-xs text-slate-500">{t('gardenFormPhotoHelper', { limit: sizeLimitLabel })}</p>
                {form.foto && (
                  <div className="mt-3 space-y-2 rounded-2xl bg-slate-100 p-3 text-center">
                    <img
                      src={form.foto}
                      alt={t('gardenEventPhotoAlt', { name: form.nombre || t('gardenFormTitle') })}
                      className="mx-auto h-40 w-full max-w-xs rounded-2xl object-cover"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      {t('gardenFormPhotoRemove')}
                    </button>
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() => {
                    setForm(buildEmptyForm(defaultCategory, defaultEventType));
                    setError(null);
                    resetPhotoInput();
                    setFormOpen(false);
                  }}
                >
                  {t('gardenFormCancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  disabled={submitting || eventTypes.length === 0}
                >
                  {submitting ? t('gardenFormSaving') : t('gardenFormSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gardenGreen">{t('gardenEditTitle')}</h3>
            <form className="mt-4 space-y-4" onSubmit={handleUpdate}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="descripcionEditar">
                  {t('gardenFormDescriptionLabel')}
                </label>
                <textarea
                  id="descripcionEditar"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  className="h-32 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() => setEditingPlant(null)}
                >
                  {t('gardenEditCancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  disabled={submitting}
                >
                  {submitting ? t('gardenFormSaving') : t('gardenEditUpdate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JardinView;
